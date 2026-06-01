import vscode from 'vscode';
import { channel } from '../logger';
import { Settings } from '../settings';
import { readMarkerFromMessage } from '../marker/codec';
import type { VisionModelPicker } from './model';
import { createEmptyVisionStats, type VisionResult, type VisionStats } from './types';

const DESC_PREFIX = '[Image Description: ';
const DESC_SUFFIX = ']';
const DESC_UNAVAILABLE = '[Image Description unavailable]';

type MessagePart = vscode.LanguageModelChatRequestMessage['content'][number];

/**
 * Resolve all image DataParts in `messages` for models that do not accept images natively.
 *
 * Strategy:
 *  - Historical user messages: replay the vision description stored in the
 *    following assistant message's marker (two-pass binding approach).
 *  - Current user message (latest): call the vision proxy model.
 *  - Image-containing messages with no binding and not current: omit images,
 *    insert an unavailable notice.
 */
export async function resolveImages(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  token: vscode.CancellationToken,
  picker: VisionModelPicker,
): Promise<VisionResult> {
  const stats = createEmptyVisionStats();
  countInputImages(messages, stats);

  if (stats.inputParts === 0) {
    return { messages, stats, newVisionText: '' };
  }

  const bindings = buildVisionBindings(messages);

  const currentIndex = findCurrentImageUserIndex(messages);

  const resolved: vscode.LanguageModelChatRequestMessage[] = [];
  let newVisionText = '';
  let visionModelId: string | undefined;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!hasImageParts(msg)) {
      resolved.push(msg);
      continue;
    }

    const boundText = bindings.get(i);
    if (boundText !== undefined) {
      stats.replayedMessages++;
      stats.visionTextChars += boundText.length;
      resolved.push(substituteImages(msg, formatDescription(boundText), stats));
      continue;
    }

    if (i === currentIndex) {
      stats.currentMessages++;
      const visionModel = await picker.resolve();
      if (!visionModel) {
        channel.warn('No vision model available, images ignored.');
        stats.unavailableMessages++;
        resolved.push(substituteImages(msg, DESC_UNAVAILABLE, stats));
        continue;
      }
      try {
        const description = await callVisionProxy(visionModel, msg, token);
        newVisionText = description;
        visionModelId = visionModel.id;
        stats.generatedMessages++;
        channel.info(`Vision proxy: ${visionModel.name}`);
        resolved.push(substituteImages(msg, formatDescription(description), stats));
      } catch (err) {
        channel.warn('Vision proxy error:', err);
        stats.failedMessages++;
        resolved.push(substituteImages(msg, DESC_UNAVAILABLE, stats));
      }
    } else {
      stats.omittedMessages++;
      resolved.push(substituteImages(msg, DESC_UNAVAILABLE, stats));
    }
  }

  return { messages: resolved, stats, newVisionText, visionModelId };
}

/**
 * Scan all assistant messages and build a map of
 * `userMessageIndex → visionText` using the markers stored in their responses.
 *
 * For each assistant message that carries a visionText in its marker,
 * we find the nearest preceding user message that contains images and bind them.
 * This fixes the fundamental issue of looking for markers in user messages.
 */
function buildVisionBindings(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): Map<number, string> {
  const bindings = new Map<number, string>();
  const alreadyBound = new Set<number>();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== vscode.LanguageModelChatMessageRole.Assistant) continue;

    const marker = readMarkerFromMessage(msg);
    if (!marker?.valid || !marker.visionText) continue;

    for (let j = i - 1; j >= 0; j--) {
      if (alreadyBound.has(j)) continue;
      const candidate = messages[j];
      if (candidate.role !== vscode.LanguageModelChatMessageRole.User) continue;
      if (!hasImageParts(candidate)) continue;

      bindings.set(j, marker.visionText);
      alreadyBound.add(j);
      break;
    }
  }

  return bindings;
}

/**
 * Find the index of the current user message with images.
 * Scans backward from the end; returns undefined if an assistant message is
 * encountered first (meaning the user's last image message already has a response).
 */
function findCurrentImageUserIndex(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): number | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === vscode.LanguageModelChatMessageRole.Assistant) return undefined;
    if (msg.role === vscode.LanguageModelChatMessageRole.User && hasImageParts(msg)) return i;
  }
  return undefined;
}

function countInputImages(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  stats: VisionStats,
): void {
  for (const msg of messages) {
    const count = getImagePartCount(msg);
    if (count > 0) {
      stats.inputMessages++;
      stats.inputParts += count;
    }
  }
}

function hasImageParts(msg: vscode.LanguageModelChatRequestMessage): boolean {
  return getImagePartCount(msg) > 0;
}

function getImagePartCount(msg: vscode.LanguageModelChatRequestMessage): number {
  return msg.content.filter(isImageDataPart).length;
}

function isImageDataPart(part: MessagePart): boolean {
  return part instanceof vscode.LanguageModelDataPart && part.mimeType.startsWith('image/');
}

function formatDescription(text: string): string {
  return `${DESC_PREFIX}${text}${DESC_SUFFIX}`;
}

/**
 * Replace all image DataParts in a message with a single text substitution.
 * All image parts collapse into one text part to avoid injecting duplicate descriptions.
 */
function substituteImages(
  msg: vscode.LanguageModelChatRequestMessage,
  substitution: string,
  stats: VisionStats,
): vscode.LanguageModelChatRequestMessage {
  const newContent: MessagePart[] = [];
  let substituted = false;

  for (const part of msg.content) {
    if (isImageDataPart(part)) {
      stats.droppedParts++;
      if (!substituted) {
        newContent.push(new vscode.LanguageModelTextPart(substitution));
        substituted = true;
      }
    } else {
      newContent.push(part);
    }
  }

  return { ...msg, content: newContent };
}

async function callVisionProxy(
  model: vscode.LanguageModelChat,
  msg: vscode.LanguageModelChatRequestMessage,
  token: vscode.CancellationToken,
): Promise<string> {
  const prompt = Settings.visionPrompt() || defaultVisionPrompt();

  // Only pass image data parts to the vision proxy — exclude original user text
  // which adds noise and may confuse the description task.
  const imageParts = (msg.content as vscode.LanguageModelDataPart[]).filter(
    (p) => p instanceof vscode.LanguageModelDataPart && p.mimeType.startsWith('image/'),
  );

  if (!imageParts.length) {
    throw new Error('No image parts found in message');
  }

  const visionMsg = vscode.LanguageModelChatMessage.User([
    ...imageParts,
    new vscode.LanguageModelTextPart(prompt),
  ]);

  channel.info(`Vision proxy: ${imageParts.length} image(s) → ${model.name} (${model.id})`);

  // Use a fresh cancellation token to avoid sharing the outer request context,
  // which can cause VS Code's LM router to misroute the inner response stream.
  const source = new vscode.CancellationTokenSource();
  const disposeCancel = token.onCancellationRequested(() => source.cancel());

  try {
    const response = await model.sendRequest(
      [visionMsg],
      {
        justification: 'Describing image attachments for a text-only language model',
      },
      source.token,
    );

    let result = '';
    for await (const part of response.stream) {
      if (part instanceof vscode.LanguageModelTextPart) {
        result += part.value;
      }
      // Non-text parts (e.g. LanguageModelThinkingPart from reasoning models) are ignored.
    }
    channel.info(`Vision proxy: stream ended — ${result.length} text char(s)`);

    const trimmed = result.trim();
    if (!trimmed) {
      throw new Error('Vision proxy returned empty response');
    }
    return trimmed;
  } finally {
    disposeCancel.dispose();
    source.dispose();
  }
}

function defaultVisionPrompt(): string {
  return (
    'Task: describe the provided image(s) accurately for injection into a text-only language model conversation. ' +
    'Cover all visually significant content: text, code, UI elements, diagrams, and spatial relationships. ' +
    'For multiple images, label each in order ("Image 1:", "Image 2:", ...) and add a brief "Summary:" section. ' +
    'Report only what is clearly visible; do not infer, guess, or embellish.'
  );
}

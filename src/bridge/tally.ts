import vscode from 'vscode';
import { Settings } from '../settings';

const MARKER_MIME = 'stateful_marker';

/**
 * Estimate the character count for a single content part.
 * Returns characters, which the caller divides by charsPerToken.
 * Image and marker parts are NOT handled here — see estimateTokens.
 */
function estimatePartChars(part: unknown): number {
  if (part instanceof vscode.LanguageModelTextPart) {
    return part.value.length;
  }

  if (part instanceof vscode.LanguageModelToolCallPart) {
    let chars = part.callId.length + part.name.length;
    try {
      chars += JSON.stringify(part.input).length;
    } catch {
      chars += 2;
    }

    return chars;
  }

  if (part instanceof vscode.LanguageModelToolResultPart) {
    let chars = part.callId.length;
    if (Array.isArray(part.content)) {
      for (const item of part.content) {
        chars += estimatePartChars(item);
      }
    }

    return chars;
  }

  if (part instanceof vscode.LanguageModelDataPart) {
    // image/ and marker are handled by the caller (estimateTokens)
    return Math.min(part.data?.byteLength ?? 0, 10000);
  }

  if (isThinkingPart(part)) {
    const v = (part as vscode.LanguageModelThinkingPart).value;
    if (typeof v === 'string') return v.length;
    if (Array.isArray(v)) return (v as string[]).reduce((s, t) => s + t.length, 0);

    return 0;
  }

  // LanguageModelPromptTsxPart — used by Copilot Chat for system instructions and tool definitions
  if (
    part &&
    typeof part === 'object' &&
    'value' in part &&
    (part as { constructor?: { name?: string } }).constructor?.name === 'LanguageModelPromptTsxPart'
  ) {
    try {
      return JSON.stringify((part as { value: unknown }).value).length;
    } catch {
      return 0;
    }
  }

  // Fallback for unknown part types
  if (part && typeof part === 'object') {
    try {
      return JSON.stringify(part).length;
    } catch {
      return 0;
    }
  }

  return 0;
}

/**
 * Estimate the token count for a VS Code chat message or plain string.
 * Uses a chars-per-token ratio that is calibrated over time from actual API usage.
 */
export function estimateTokens(
  input: string | vscode.LanguageModelChatRequestMessage,
  charsPerToken: number,
): number {
  if (typeof input === 'string') {
    return Math.ceil(input.length / charsPerToken);
  }

  let chars = 0;
  let bonusTokens = 0;

  for (const part of input.content) {
    if (part instanceof vscode.LanguageModelDataPart) {
      if (part.mimeType === MARKER_MIME) {
        // Replay markers are not real content; count the whole message as 0
        return 0;
      }
      if (part.mimeType.startsWith('image/')) {
        // Images have a fixed token cost; accumulate separately to avoid ratio distortion
        bonusTokens += Settings.imageTokenEstimate();

        continue;
      }
    }
    chars += estimatePartChars(part);
  }

  return Math.ceil(chars / charsPerToken) + bonusTokens;
}

/** Update EMA of chars-per-token using actual API usage data. */
export function refineRatio(
  totalRequestChars: number,
  promptTokens: number,
  currentRatio: number,
): number {
  if (promptTokens <= 0 || totalRequestChars <= 0) return currentRatio;
  const observed = totalRequestChars / promptTokens;

  return currentRatio * 0.8 + observed * 0.2;
}

function isThinkingPart(part: unknown): boolean {
  return (
    typeof vscode.LanguageModelThinkingPart === 'function' &&
    part instanceof vscode.LanguageModelThinkingPart
  );
}

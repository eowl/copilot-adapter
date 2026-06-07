import vscode from 'vscode';
import { encodeMarker } from '../marker/codec';
import type { MarkerPayload } from '../marker/types';
import { streamHttp } from '../client/http';
import { ApiError } from '../client/error';
import { Settings } from '../settings';
import { resolveTrait } from '../providers/utils';
import type { UsagePayload } from './types';
import { applyUsageSchema, buildUsageLog } from './usage';
import { DEFAULT_CHARS_PER_TOKEN } from './tally';
import { channel } from '../logger';
import type { ReadyReq } from './prepare';

type Progress = vscode.Progress<vscode.LanguageModelResponsePart>;

export async function forwardStream(
  ready: ReadyReq,
  progress: Progress,
  token: vscode.CancellationToken,
  segmentId: string,
): Promise<{ newReasoningText: string; promptTokens: number }> {
  const { url, apiKey, body, model } = ready;
  const modelProvider = model.provider;

  let reasoningText = '';
  let contentText = '';
  let promptTokens = 0;

  const abortCtrl = new AbortController();
  const cancelDispose = token.onCancellationRequested(() => abortCtrl.abort());

  const timeoutSeconds = Settings.requestTimeout();
  const effectiveSignal =
    timeoutSeconds > 0
      ? AbortSignal.any([abortCtrl.signal, AbortSignal.timeout(timeoutSeconds * 1000)])
      : abortCtrl.signal;

  const maxRetries = Settings.requestRetries();
  let attempt = 0;

  try {
    while (true) {
      let yieldedContent = false;
      reasoningText = '';
      promptTokens = 0;

      try {
        const gen = streamHttp(
          url,
          apiKey,
          body,
          resolveTrait(ready.model, 'thinkingField'),
          ready.model.createContentParser?.(),
          effectiveSignal,
          modelProvider.links,
        );

        for await (const event of gen) {
          if (token.isCancellationRequested) break;
          switch (event.kind) {
            case 'content':
              if (event.text) {
                contentText += event.text;
                yieldedContent = true;
                progress.report(new vscode.LanguageModelTextPart(event.text));
              }

              break;

            case 'thinking':
              if (event.text) {
                yieldedContent = true;
                reasoningText += event.text;
                if (typeof vscode.LanguageModelThinkingPart === 'function') {
                  progress.report(
                    new (vscode.LanguageModelThinkingPart as unknown as typeof vscode.LanguageModelThinkingPart)(
                      event.text,
                    ) as unknown as vscode.LanguageModelResponsePart,
                  );
                }
              }

              break;

            case 'tool-call':
              yieldedContent = true;
              progress.report(
                new vscode.LanguageModelToolCallPart(
                  event.call.id,
                  event.call.function.name,
                  tryParseJson(event.call.function.arguments) as object,
                ),
              );

              break;

            case 'usage':
              promptTokens = reportUsage(ready, event.data, model.apiId, progress);

              break;
          }
        }

        break;
      } catch (err) {
        if (!yieldedContent && attempt < maxRetries && isRetryableError(err)) {
          attempt++;
          const delayMs = Math.min(1000 * 2 ** (attempt - 1), 30_000);
          await new Promise<void>((r) => setTimeout(r, delayMs));

          continue;
        }

        throw err;
      }
    }
  } finally {
    cancelDispose.dispose();
  }

  const payload: MarkerPayload = {
    visionText: ready.visionText || undefined,
    reasoningText: reasoningText || undefined,
  };

  const marker = encodeMarker(payload, segmentId);
  progress.report(new vscode.LanguageModelDataPart(marker.data, marker.mimeType));

  // Fallback usage estimation when the API does not return usage data (e.g. MiniMax).
  if (promptTokens === 0 && (contentText || reasoningText)) {
    channel.info(
      `Using fallback usage estimation (API returned no usage data) — ` +
        `prompt chars: ${ready.promptChars}, response chars: ${(contentText + reasoningText).length}`,
    );

    const charsPerToken = resolveTrait(ready.model, 'tokenRatio') ?? DEFAULT_CHARS_PER_TOKEN;
    const usage: UsagePayload = {
      prompt_tokens: Math.ceil(ready.promptChars / charsPerToken),
      completion_tokens: Math.ceil((contentText + reasoningText).length / charsPerToken),
      total_tokens: 0,
    };
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

    try {
      progress.report(
        new vscode.LanguageModelDataPart(new TextEncoder().encode(JSON.stringify(usage)), 'usage'),
      );
    } catch (err) {
      channel.error('Failed to report fallback usage:', err);
    }

    try {
      channel.info(buildUsageLog(model.apiId, usage, ready.promptChars));
    } catch (err) {
      channel.error('Failed to build fallback usage log:', err);
    }

    // Fallback usage is an estimate, not real API data.
    // Do NOT set promptTokens — keeping it 0 prevents adapter.ts
    // from incorrectly calibrating ratio for providers without API usage.
  }

  return { newReasoningText: reasoningText, promptTokens };
}

function reportUsage(
  ready: ReadyReq,
  rawUsage: Record<string, unknown>,
  modelApiId: string,
  progress: Progress,
): number {
  const usageSchema = resolveTrait(ready.model, 'usageSchema');
  const usage: UsagePayload = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  if (usageSchema) {
    applyUsageSchema(usageSchema, rawUsage, usage as unknown as Record<string, unknown>);
  }

  try {
    progress.report(
      new vscode.LanguageModelDataPart(new TextEncoder().encode(JSON.stringify(usage)), 'usage'),
    );
  } catch (err) {
    channel.error(`Failed to report usage:`, err);
  }

  try {
    channel.info(buildUsageLog(modelApiId, usage, ready.promptChars));
  } catch (err) {
    channel.error(`Failed to build usage log:`, err);
  }

  return usage.prompt_tokens;
}

function isRetryableError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 429 || err.status === 503);
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

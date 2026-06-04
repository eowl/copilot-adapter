import vscode from 'vscode';
import { encodeMarker } from '../marker/codec';
import type { MarkerPayload } from '../marker/types';
import { streamHttp } from '../client/http';
import { ApiError } from '../client/error';
import { Settings } from '../settings';
import { resolveTrait } from '../providers/utils';
import type { ReadyReq } from './prepare';

type Progress = vscode.Progress<vscode.LanguageModelResponsePart>;

export async function forwardStream(
  ready: ReadyReq,
  progress: Progress,
  token: vscode.CancellationToken,
  segmentId: string,
): Promise<{ newReasoningText: string; promptTokens: number }> {
  const { endpoint, apiKey, body, model } = ready;
  const provider = model.provider;

  let reasoningText = '';
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
          endpoint,
          apiKey,
          body,
          resolveTrait(ready.model, 'thinkingField'),
          ready.model.createContentParser?.(),
          effectiveSignal,
          provider.links,
        );

        for await (const event of gen) {
          if (token.isCancellationRequested) break;

          switch (event.kind) {
            case 'content':
              if (event.text) {
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
              promptTokens = event.data.prompt_tokens ?? 0;
              // Report usage back to Copilot Chat so it can populate the
              // Context Window panel (token counter / breakdown). The host
              // listens for a DataPart with mime "usage" containing an
              // OpenAI-shaped JSON payload.
              {
                const usagePayload = {
                  prompt_tokens: event.data.prompt_tokens ?? 0,
                  completion_tokens: event.data.completion_tokens ?? 0,
                  total_tokens: event.data.total_tokens ?? 0,
                  prompt_tokens_details: {
                    cached_tokens: event.data.prompt_cache_hit_tokens ?? 0,
                  },
                };
                progress.report(
                  new vscode.LanguageModelDataPart(
                    new TextEncoder().encode(JSON.stringify(usagePayload)),
                    'usage',
                  ),
                );
              }
              break;
          }
        }

        break; // success — exit retry loop
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

  return { newReasoningText: reasoningText, promptTokens };
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

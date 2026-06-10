import vscode from 'vscode';
import { Settings } from '../settings';

/**
 * Hard-coded fallback default for chars-per-token ratio.
 * Used only when the user has NOT set a custom tokenRatio in settings
 * AND the model/provider has no tokenRatio trait.
 */
export const DEFAULT_CHARS_PER_TOKEN = 4.0;

const MARKER_MIME = 'stateful_marker';

/**
 * Estimate the character count for a single content part.
 * Returns characters, which the caller divides by charsPerToken.
 * Image and marker parts are NOT handled here — see estimateTokens.
 */
export function estimatePartChars(part: unknown): number {
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

export function refineRatio(
  totalRequestChars: number,
  promptTokens: number,
  currentRatio: number,
): number {
  if (promptTokens <= 0 || totalRequestChars <= 0) return currentRatio;
  const observed = totalRequestChars / promptTokens;

  return currentRatio * 0.8 + observed * 0.2;
}

const calibratedRatios = new Map<string, number>();

/**
 * Returns the calibrated chars-per-token ratio for a provider.
 *
 * Priority:
 * If tokenRatioGlobal is enabled, always use the user-configured tokenRatio.
 * Otherwise use the calibrated value if available, falling back to the
 *    given defaultRatio (which may itself come from the user setting, a model
 *    trait, or the hard-coded DEFAULT_CHARS_PER_TOKEN).
 */
export function getCalibratedRatio(providerId: string, defaultRatio: number): number {
  if (Settings.tokenRatioGlobal()) {
    return Settings.tokenRatio();
  }

  return calibratedRatios.get(providerId) ?? defaultRatio;
}

/**
 * Update the calibrated ratio for a provider using actual API usage data.
 * Uses EMA smoothing (80% old, 20% new) so a single outlier doesn't skew the estimate.
 *
 * Skips calibration entirely when:
 * - tokenRatioGlobal is enabled (global override forces a fixed ratio)
 * - tokenRatioAutoCalibrate is disabled (user opted out of auto-tuning)
 */
export function calibrateRatio(
  providerId: string,
  promptChars: number,
  promptTokens: number,
  defaultRatio: number,
): { newRatio: number; changed: boolean } {
  if (Settings.tokenRatioGlobal() || !Settings.tokenRatioAutoCalibrate()) {
    return { newRatio: getCalibratedRatio(providerId, defaultRatio), changed: false };
  }

  const current = calibratedRatios.get(providerId) ?? defaultRatio;
  const next = refineRatio(promptChars, promptTokens, current);

  // Only update if the change exceeds the threshold to avoid noise
  const threshold = Settings.tokenRatioCalibrationThreshold();
  const relativeChange = Math.abs(next - current) / current;
  if (relativeChange >= threshold) {
    calibratedRatios.set(providerId, next);

    return { newRatio: next, changed: true };
  }

  return { newRatio: next, changed: false };
}

/**
 * Calculate the total character count for an array of VS Code chat messages.
 * Uses the same estimation logic as estimatePartChars.
 */
export function countMessageChars(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): number {
  let chars = 0;
  for (const msg of messages) {
    for (const part of msg.content) {
      if (part instanceof vscode.LanguageModelDataPart) {
        if (part.mimeType === MARKER_MIME) continue;
        if (part.mimeType.startsWith('image/')) continue;
      }
      chars += estimatePartChars(part);
    }
  }

  return chars;
}

function isThinkingPart(part: unknown): boolean {
  return (
    typeof vscode.LanguageModelThinkingPart === 'function' &&
    part instanceof vscode.LanguageModelThinkingPart
  );
}

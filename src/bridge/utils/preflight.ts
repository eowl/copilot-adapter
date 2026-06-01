import { createHash } from 'crypto';
import vscode from 'vscode';
import { ACTIVATE_PREFIX, WARMUP_CALL_ID_PREFIX } from './defines';
import { Settings } from '../../settings';

export interface WarmupState {
  /** Whether the conversation is currently mid-warmup. */
  inProgress: boolean;
  /** Number of warmup rounds already completed. */
  completedRounds: number;
  /** Tool names waiting to be activated (from most recent activate_* call IDs). */
  pendingNames: string[];
}

export function makeWarmupCallId(round: number, toolName: string): string {
  const hash = createHash('sha256').update(toolName).digest('hex').slice(0, 32);
  return `${WARMUP_CALL_ID_PREFIX}${round}_${hash}`;
}

export function parseWarmupCallId(callId: string): { round: number; hash: string } | undefined {
  if (!callId.startsWith(WARMUP_CALL_ID_PREFIX)) return undefined;
  const rest = callId.slice(WARMUP_CALL_ID_PREFIX.length);
  const underscore = rest.indexOf('_');
  if (underscore < 0) return undefined;
  const round = Number(rest.slice(0, underscore));
  const hash = rest.slice(underscore + 1);
  if (!Number.isInteger(round) || !hash) return undefined;
  return { round, hash };
}

/**
 * Scan the conversation history to detect if warmup is in progress and
 * how many rounds have already completed.
 */
export function scanWarmupState(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  availableToolNames: readonly string[],
): WarmupState {
  const activatableNames = availableToolNames.filter((n) => n.startsWith(ACTIVATE_PREFIX));

  let completedRounds = 0;
  let pendingNames: string[] = [];
  let inProgress = false;

  for (const msg of messages) {
    for (const part of msg.content) {
      if (!(part instanceof vscode.LanguageModelToolCallPart)) continue;
      const parsed = parseWarmupCallId(part.callId);
      if (!parsed) continue;

      if (parsed.round > completedRounds) {
        completedRounds = parsed.round;
        pendingNames = activatableNames.filter((name) => {
          const hash = createHash('sha256').update(name).digest('hex').slice(0, 32);
          return hash === parsed.hash;
        });
        inProgress = true;
      }
    }

    for (const part of msg.content) {
      if (!(part instanceof vscode.LanguageModelToolResultPart)) continue;
      const parsed = parseWarmupCallId(part.callId);
      if (!parsed) continue;
      if (parsed.round === completedRounds) {
        inProgress = false;
      }
    }
  }

  return { inProgress, completedRounds, pendingNames };
}

/**
 * Remove all warmup-generated messages from the conversation history
 * before forwarding to the provider.
 */
export function stripWarmupMessages(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): readonly vscode.LanguageModelChatRequestMessage[] {
  return messages.filter((msg) => {
    for (const part of msg.content) {
      if (part instanceof vscode.LanguageModelToolCallPart && parseWarmupCallId(part.callId)) {
        return false;
      }
      if (part instanceof vscode.LanguageModelToolResultPart && parseWarmupCallId(part.callId)) {
        return false;
      }
    }

    return true;
  });
}

export function needsWarmup(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  availableToolNames: readonly string[],
  isEnabled: boolean,
): boolean {
  if (!isEnabled) return false;

  const activatable = availableToolNames.filter((n) => n.startsWith(ACTIVATE_PREFIX));
  if (activatable.length === 0) return false;

  const state = scanWarmupState(messages, availableToolNames);

  return !state.inProgress && state.completedRounds < Settings.maxWarmupRounds();
}

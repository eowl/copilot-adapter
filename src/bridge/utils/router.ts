import vscode from 'vscode';

import type { Tool } from '../../client/types';
import type { Provider, Model } from '../../providers/types';
import { buildToolList } from './build';
import { needsWarmup, scanWarmupState, stripWarmupMessages, makeWarmupCallId } from './preflight';
import { cleanDriftNotices } from './drift';

export type GateAction =
  | {
      kind: 'proceed';
      tools: Tool[] | undefined;
      messages: readonly vscode.LanguageModelChatRequestMessage[];
    }
  | { kind: 'warmup'; toolName: string; callId: string }
  | { kind: 'reject'; reason: string };

/**
 * Decide how to handle tool flow for this request.
 * Returns:
 *  - `proceed` — the request is ready, use `tools` and `messages`
 *  - `warmup`  — must inject a preflight activate_* call before proceeding
 *  - `reject`  — tool count limit exceeded
 */
export function routeToolFlow(
  vsTools: readonly vscode.LanguageModelChatTool[] | undefined,
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  model: Model,
  _provider: Provider,
): GateAction {
  const stabilize = false;

  let liveMessages = messages;
  if (stabilize) {
    liveMessages = cleanDriftNotices(messages);
    liveMessages = stripWarmupMessages(liveMessages);
  }

  const tools = buildToolList(vsTools, model.ability.maxTools);

  if (stabilize && vsTools && vsTools.length > 0) {
    const toolNames = vsTools.map((t) => t.name);
    if (needsWarmup(messages, toolNames, true)) {
      const state = scanWarmupState(messages, toolNames);
      const round = state.completedRounds + 1;
      const activateName = toolNames.find((n) => n.startsWith('activate_'));

      if (activateName) {
        return {
          kind: 'warmup',
          toolName: activateName,
          callId: makeWarmupCallId(round, activateName),
        };
      }
    }
  }

  return { kind: 'proceed', tools, messages: liveMessages };
}

import vscode from 'vscode';

import type { Tool } from '../../client/types';
import type { ModelProvider, ModelItem } from '../../providers/types';
import { buildToolList } from './build';
import { needsWarmup, scanWarmupState, stripWarmupMessages, makeWarmupCallId } from './preflight';
import { cleanDriftNotices } from './drift';
import { Settings } from '../../settings';
import { channel } from '../../logger';

export type GateAction =
  | {
      kind: 'proceed';
      tools: Tool[] | undefined;
      messages: readonly vscode.LanguageModelChatRequestMessage[];
    }
  | {
      kind: 'warmup';
      toolName: string;
      callId: string;
      round: number;
      totalRounds: number;
    }
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
  modelItem: ModelItem,
  _modelProvider: ModelProvider,
): GateAction {
  const stabilize = Settings.toolWarmup();

  let liveMessages = messages;
  if (stabilize) {
    liveMessages = cleanDriftNotices(messages);
    liveMessages = stripWarmupMessages(liveMessages);
  }

  const tools = buildToolList(vsTools, modelItem.ability.maxTools);

  if (stabilize && vsTools && vsTools.length > 0) {
    const toolNames = vsTools.map((t) => t.name);
    if (needsWarmup(messages, toolNames, true)) {
      const state = scanWarmupState(messages, toolNames);
      const round = state.completedRounds + 1;
      const totalRounds = Settings.maxWarmupRounds();
      const activateName = toolNames.find((n) => n.startsWith('activate_'));

      if (activateName) {
        channel.info(
          `[Warmup] ${modelItem.provider.label} / ${modelItem.label}: ` +
            `injecting round ${round}/${totalRounds} (${activateName})`,
        );

        return {
          kind: 'warmup',
          toolName: activateName,
          callId: makeWarmupCallId(round, activateName),
          round,
          totalRounds,
        };
      }
    }
  }

  return { kind: 'proceed', tools, messages: liveMessages };
}

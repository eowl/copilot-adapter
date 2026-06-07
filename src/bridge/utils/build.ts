import vscode from 'vscode';
import { channel } from '../../logger';
import { sortKeys } from '../../serialize';
import type { Tool } from '../../client/types';

/**
 * Build LLM Tool list from VS Code tool definitions.
 * When the model's maxTools limit is exceeded, the list is silently truncated
 * (first N tools kept) and a warning is logged — the request still proceeds.
 */
export function buildToolList(
  vsTools: readonly vscode.LanguageModelChatTool[] | undefined,
  maxTools: number | undefined,
): Tool[] | undefined {
  if (!vsTools || vsTools.length === 0) return undefined;

  let tools = vsTools;
  if (maxTools !== undefined && vsTools.length > maxTools) {
    channel.warn(
      `Tool count ${vsTools.length} exceeds model limit ${maxTools}; truncating to first ${maxTools}.`,
    );
    tools = vsTools.slice(0, maxTools);
  }

  const result = tools.flatMap((tool) => {
    if (!tool.name) return [];
    const schema = tool.inputSchema as Record<string, unknown> | undefined;
    const parameters =
      schema && typeof schema === 'object' && Object.keys(schema).length > 0
        ? sortKeys(schema)
        : { type: 'object', properties: {} };
    return [
      {
        type: 'function' as const,
        function: { name: tool.name, description: tool.description || tool.name, parameters },
      },
    ];
  });
  return result.length > 0 ? result : undefined;
}

export function gatherTrailingResultIds(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): string[] {
  const ids: string[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    let hasResult = false;
    for (const part of msg.content) {
      if (part instanceof vscode.LanguageModelToolResultPart) {
        ids.push(part.callId);
        hasResult = true;
      }
    }
    if (!hasResult) break;
  }

  return ids.reverse();
}

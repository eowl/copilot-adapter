import * as vscode from 'vscode';

/** Create a user message with one text part per string argument. */
export function userMsg(...texts: string[]): vscode.LanguageModelChatMessage {
  return vscode.LanguageModelChatMessage.User(
    texts.map((t) => new vscode.LanguageModelTextPart(t)),
  );
}

/** Create an assistant message with one text part per string argument. */
export function assistantMsg(...texts: string[]): vscode.LanguageModelChatMessage {
  return vscode.LanguageModelChatMessage.Assistant(
    texts.map((t) => new vscode.LanguageModelTextPart(t)),
  );
}

/** Create a minimal VS Code tool definition. */
export function makeTool(name: string): vscode.LanguageModelChatTool {
  return {
    name,
    description: `Tool: ${name}`,
    inputSchema: { type: 'object', properties: {} } as Record<string, unknown>,
  };
}

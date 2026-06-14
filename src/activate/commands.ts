import vscode from 'vscode';
import { channel } from '../logger';
import { openDumpsFolder } from '../trace/dump';
import type { Adapter } from '../bridge/adapter';

export function registerCommands(context: vscode.ExtensionContext, adapter: Adapter): void {
  const cmds: Array<[string, (...args: unknown[]) => unknown]> = [
    [
      'copilot-adapter.addApiKey',
      (providerId?: unknown) =>
        adapter.configureApiKey(typeof providerId === 'string' ? providerId : undefined),
    ],
    [
      'copilot-adapter.removeApiKey',
      (providerId?: unknown) =>
        adapter.removeApiKey(typeof providerId === 'string' ? providerId : undefined),
    ],
    ['copilot-adapter.setVisionProxyModel', () => adapter.setVisionProxyModel()],
    [
      'copilot-adapter.openSettings',
      () => vscode.commands.executeCommand('workbench.action.openSettings', 'copilot-adapter'),
    ],
    ['copilot-adapter.showLogs', () => channel.show()],
    ['copilot-adapter.openRequestRecordsFolder', () => openDumpsFolder(context)],
  ];

  for (const [id, handler] of cmds) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }
}

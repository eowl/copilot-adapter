import vscode from 'vscode';
import { channel } from '../logger';
import { Settings } from '../settings';

export function logStartupDiagnostics(context: vscode.ExtensionContext): void {
  const ext = vscode.extensions.getExtension('copilot-adapter.copilot-adapter');
  const version = ext?.packageJSON?.version ?? '(unknown)';

  channel.info(
    `copilot-adapter v${version} — vscode ${vscode.version} — ${process.platform} — debug:${Settings.loggingEnabled()}`,
  );

  if (Settings.loggingEnabled()) {
    channel.debug(`globalStorageUri: ${context.globalStorageUri.fsPath}`);
  }
}

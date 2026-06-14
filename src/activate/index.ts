import vscode from 'vscode';
import { channel } from '../logger';
import { migrateLegacySecrets } from '../bridge/managed';
import { registerCommands } from './commands';
import { registerUriHandler } from './links';
import { logStartupDiagnostics } from './diag';
import { maybeShowWelcome } from './onboard';
import { mountProviders } from './mount';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logStartupDiagnostics(context);

  const adapters = await mountProviders(context);

  registerCommands(context, adapters[0]);

  context.subscriptions.push(registerUriHandler(context, adapters[0]));

  const migratedCount = await migrateLegacySecrets(context);
  if (migratedCount > 0) {
    adapters.forEach((a) => a.notifyChange());
  }

  await maybeShowWelcome(context, migratedCount > 0);

  channel.info('copilot-adapter activated');
}

export async function deactivate(): Promise<void> {
  // Nothing to clean up — VS Code disposes subscriptions automatically
}

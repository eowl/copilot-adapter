import * as fs from 'node:fs';
import vscode from 'vscode';
import { channel } from '../logger';
import { migrateLegacySecrets } from '../bridge/managed';
import { registerCommands } from './commands';
import { registerUriHandler } from './links';
import { logStartupDiagnostics, startCustomModelsWatcher } from './diag';
import { maybeShowWelcome } from './onboard';
import { mountProviders } from './mount';
import { refreshModels } from '../registry';
import { getCustomModelsPath } from '../storage';

/**
 * Ensure custom-models.json exists in our storage.
 * Creates a template if the file doesn't already exist.
 */
function ensureCustomModelsFile(context: vscode.ExtensionContext): string {
  const filePath = getCustomModelsPath(context);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]\n', 'utf-8');
  }

  return filePath;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logStartupDiagnostics(context);

  // Create + load custom models from our storage
  const customPath = ensureCustomModelsFile(context);
  refreshModels(customPath);

  const adapters = await mountProviders(context);

  registerCommands(context, adapters[0]);

  context.subscriptions.push(registerUriHandler(context, adapters[0]));

  const migratedCount = await migrateLegacySecrets(context);
  if (migratedCount > 0) {
    adapters.forEach((a) => a.notifyChange());
  }

  // Watch custom models file for changes
  context.subscriptions.push(...startCustomModelsWatcher(context, adapters));

  await maybeShowWelcome(context, migratedCount > 0);

  channel.info('copilot-adapter activated');
}

export async function deactivate(): Promise<void> {
  // Nothing to clean up — VS Code disposes subscriptions automatically
}

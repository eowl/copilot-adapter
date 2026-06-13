import * as fs from 'node:fs';
import * as path from 'node:path';
import vscode from 'vscode';
import { channel } from '../logger';
import { migrateLegacySecrets } from '../bridge/managed';
import { registerCommands } from './commands';
import { registerUriHandler } from './links';
import { logStartupDiagnostics, startCustomModelsWatcher } from './diag';
import { maybeShowWelcome } from './onboard';
import { mountProviders } from './mount';
import { refreshModels } from '../registry';

const CUSTOM_MODELS_FILE = 'custom-models.json';

/**
 * Ensure custom-models.json exists in globalStorage.
 * Creates a template if the file doesn't already exist.
 */
function ensureCustomModelsFile(context: vscode.ExtensionContext): string {
  const dir = context.globalStorageUri.fsPath;
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  const filePath = path.join(dir, CUSTOM_MODELS_FILE);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]\n', 'utf-8');
  }

  return filePath;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logStartupDiagnostics(context);

  // Create + load custom models from globalStorage
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

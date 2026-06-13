import * as path from 'node:path';
import vscode from 'vscode';
import { channel } from '../logger';
import { Settings } from '../settings';
import { loadCustomModels } from '../custom/loader';
import { updateDiagnostics, clearAllDiagnostics } from '../custom/diag';
import { providerById, endpointById, refreshCustomModels } from '../providers/index';
import type { Adapter } from '../bridge/adapter';

const CUSTOM_MODELS_FILE = 'custom-models.json';

function customModelsPath(context: vscode.ExtensionContext): string {
  return path.join(context.globalStorageUri.fsPath, CUSTOM_MODELS_FILE);
}

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

function loadAndDiagnose(filePath: string, adapters: Adapter[]): void {
  const { errors, models } = loadCustomModels(filePath, {
    providerById,
    endpointById,
  });

  // File doesn't exist is not an error — loadCustomModels returns empty
  const fileUri = vscode.Uri.file(filePath);
  updateDiagnostics(fileUri, errors);

  if (errors.length > 0) {
    channel.warn(`Custom models: ${errors.length} validation error(s) in ${filePath}`);
  } else if (models.length > 0) {
    channel.info(`Custom models loaded: ${models.length} model instance(s) from ${filePath}`);
  }

  // Refresh model list so the UI picks up changes (or removes models on error)
  refreshCustomModels(filePath);
  for (const a of adapters) {
    a.notifyChange();
  }
}

function createWatcher(filePath: string, adapters: Adapter[]): vscode.Disposable[] {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);

  const disposables: vscode.Disposable[] = [];

  try {
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(dir, base));
    const onChange = (): void => loadAndDiagnose(filePath, adapters);
    const onDelete = (): void => {
      updateDiagnostics(vscode.Uri.file(filePath), []);
      refreshCustomModels(filePath);
      for (const a of adapters) {
        a.notifyChange();
      }
    };
    watcher.onDidChange(onChange);
    watcher.onDidCreate(onChange);
    watcher.onDidDelete(onDelete);
    disposables.push(watcher);
  } catch {
    channel.warn(`Custom models: could not create file watcher for ${filePath}`);
  }

  return disposables;
}

export function startCustomModelsWatcher(
  context: vscode.ExtensionContext,
  adapters: Adapter[],
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  let currentWatchers: vscode.Disposable[] = [];

  const startOrRestart = (): void => {
    for (const d of currentWatchers) d.dispose();
    currentWatchers = [];

    const filePath = customModelsPath(context);
    loadAndDiagnose(filePath, adapters);

    currentWatchers = createWatcher(filePath, adapters);
  };

  startOrRestart();

  disposables.push(
    new vscode.Disposable(() => {
      for (const d of currentWatchers) d.dispose();
      clearAllDiagnostics();
    }),
  );

  return disposables;
}

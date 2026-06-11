import * as path from 'node:path';
import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { Settings } from '../settings';
import { loadCustomModels } from '../custom/loader';
import { updateDiagnostics, clearAllDiagnostics } from '../custom/diag';
import { getCustomModels, refreshCustomModels } from '../providers/index';
import type { Adapter } from '../bridge/adapter';

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
  const { errors } = loadCustomModels(filePath, {
    providerById: getCustomModels().registries.providerById,
    endpointById: getCustomModels().registries.endpointById,
  });

  const fileUri = vscode.Uri.file(filePath);
  updateDiagnostics(fileUri, errors);

  if (errors.length > 0) {
    channel.warn(`Custom models: ${errors.length} validation error(s) in ${filePath}`);
  } else if (filePath) {
    channel.info(`Custom models loaded from ${filePath}`);
  }

  // Refresh model list so the UI picks up changes (or removes models on error)
  refreshCustomModels();
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
      refreshCustomModels();
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

    const filePath = Settings.customModelsPath();
    if (!filePath) {
      clearAllDiagnostics();
      refreshCustomModels();

      for (const a of adapters) a.notifyChange();

      return;
    }
    loadAndDiagnose(filePath, adapters);

    currentWatchers = createWatcher(filePath, adapters);
  };

  startOrRestart();

  disposables.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${EXT_ID}.customModelsPath`)) {
        startOrRestart();
      }
    }),
  );

  disposables.push(
    new vscode.Disposable(() => {
      for (const d of currentWatchers) d.dispose();
      clearAllDiagnostics();
    }),
  );

  return disposables;
}

import * as path from 'node:path';
import * as fs from 'node:fs';
import vscode from 'vscode';
import { EXT_ID } from './defines';

/**
 * Build a custom storage path under globalStorage, using just the extension
 * name (copilot-adapter) without the publisher namespace prefix.
 *
 * VS Code's globalStorageUri is typically:
 *   <userData>/globalStorage/<publisher>.<name>/
 *
 * We use the parent directory + EXT_ID so the path becomes:
 *   <userData>/globalStorage/copilot-adapter/
 */
function ensureDir(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

/**
 * Returns the storage root URI: <globalStorage>/copilot-adapter/
 */
export function getStorageUri(context: vscode.ExtensionContext): vscode.Uri {
  const parent = path.dirname(context.globalStorageUri.fsPath);
  const uri = vscode.Uri.joinPath(vscode.Uri.file(parent), EXT_ID);
  ensureDir(uri.fsPath);

  return uri;
}

/**
 * Returns the full path to custom-models.json in our custom storage.
 */
export function getCustomModelsPath(context: vscode.ExtensionContext): string {
  const storagePath = getStorageUri(context).fsPath;

  return path.join(storagePath, 'custom-models.json');
}

/**
 * Returns the full path to the requests dump directory in our custom storage.
 */
export function getDumpsPath(context: vscode.ExtensionContext): string {
  const storagePath = getStorageUri(context).fsPath;
  const dumpsPath = path.join(storagePath, 'requests');
  ensureDir(dumpsPath);
  
  return dumpsPath;
}

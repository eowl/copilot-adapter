import vscode from 'vscode';
import { t } from '../nls';
import type { ValidationError } from './loader';

const DIAG_SOURCE_KEY = 'copilot-adapter.customModels.diag.source';

let collection: vscode.DiagnosticCollection | undefined;

function ensureCollection(): vscode.DiagnosticCollection {
  if (!collection) {
    collection = vscode.languages.createDiagnosticCollection(t(DIAG_SOURCE_KEY));
  }
  return collection;
}

export function updateDiagnostics(fileUri: vscode.Uri, errors: ValidationError[]): void {
  const diags = ensureCollection();

  if (errors.length === 0) {
    diags.delete(fileUri);
    return;
  }

  const diagnostics: vscode.Diagnostic[] = errors.map((err) => {
    const line = Math.max(0, err.line - 1);
    const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);

    const diag = new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
    diag.source = t(DIAG_SOURCE_KEY);
    return diag;
  });

  diags.set(fileUri, diagnostics);
}

export function clearAllDiagnostics(): void {
  collection?.clear();
}

export function disposeDiagnostics(): void {
  collection?.dispose();
  collection = undefined;
}

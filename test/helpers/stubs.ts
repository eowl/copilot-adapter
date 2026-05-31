import * as vscode from 'vscode';

/**
 * Temporarily replace a property on an object.
 * Returns a restore function — call it in afterEach() to undo.
 */
export function stub<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
): () => void {
  const original = obj[key];
  obj[key] = value;
  return () => {
    obj[key] = original;
  };
}

/**
 * Stub vscode.workspace.getConfiguration() to return values from a flat map.
 * The map key is the section string passed to getConfiguration().get(section).
 * Returns a restore function.
 */
export function stubConfig(values: Record<string, unknown>): () => void {
  const mockConfig = {
    get<T>(section: string, defaultValue?: T): T {
      return (section in values ? values[section] : defaultValue) as T;
    },
    has(section: string): boolean {
      return section in values;
    },
    inspect() {
      return undefined;
    },
    update: () => Promise.resolve(),
  } as unknown as vscode.WorkspaceConfiguration;

  return stub(vscode.workspace, 'getConfiguration', () => mockConfig);
}

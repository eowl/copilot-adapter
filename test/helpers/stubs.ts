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
 * Deep-stub a nested property path using Object.defineProperty so it works
 * even for getter-only properties (e.g. vscode.env.language).
 * Each dot-separated segment is stubbed in turn. Returns a composite restore function.
 */
export function stubNested(obj: Record<string, unknown>, path: string, value: unknown): () => void {
  const segments = path.split('.');
  const restores: Array<() => void> = [];

  // Walk intermediate segments
  for (const seg of segments.slice(0, -1)) {
    if (!obj[seg] || typeof obj[seg] !== 'object') {
      obj[seg] = {} as Record<string, unknown>;
    }
    obj = obj[seg] as Record<string, unknown>;
  }

  const last = segments[segments.length - 1];
  const descriptor = Object.getOwnPropertyDescriptor(obj, last);

  // Use defineProperty to handle getter-only properties
  Object.defineProperty(obj, last, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
  restores.push(() => {
    if (descriptor) {
      Object.defineProperty(obj, last, descriptor);
    } else {
      delete obj[last];
    }
  });

  return () => restores.forEach((r) => r());
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

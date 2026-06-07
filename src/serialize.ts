/**
 * JSON serialization utilities that handle lone surrogates (U+D800–U+DFFF)
 * which are invalid in UTF-8 but can appear in JavaScript strings from VS Code APIs.
 */

const REPLACEMENT = '\uFFFD';

function sanitize(s: string): string {
  return s.replace(/[\uD800-\uDFFF]/g, (ch) => {
    const code = ch.charCodeAt(0);
    // Keep valid surrogate pairs; replace lone surrogates
    return code >= 0xdc00 ? REPLACEMENT : ch;
  });
}

export function sortKeys<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeys) as unknown as T;
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted as unknown as T;
}

export function pack(value: unknown): string {
  return sanitize(JSON.stringify(sortKeys(value)) ?? 'null');
}

export function packPretty(value: unknown): string {
  return sanitize(JSON.stringify(sortKeys(value), null, 2) ?? 'null');
}

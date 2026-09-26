/**
 * JSON serialization utilities that handle lone surrogates (U+D800–U+DFFF)
 * which are invalid in UTF-8 but can appear in JavaScript strings from VS Code APIs.
 *
 * IMPORTANT: sanitization must run on the *value* before `JSON.stringify`.
 * Once stringified, a lone surrogate is already an ASCII escape sequence
 * (`\ud83d`) and can no longer be detected as a surrogate — only as the
 * "unexpected end of hex escape" that strict parsers (serde_json) reject when
 * tool-call `arguments` is re-parsed by the provider.
 */

const REPLACEMENT = '\uFFFD';

/**
 * Replaces only *unpaired* surrogates with U+FFFD.
 *
 * `for...of` iterates by code point: a well-formed pair arrives as a single
 * two-unit string and is kept verbatim, while a lone surrogate arrives as a
 * one-unit string and is replaced. Valid emoji therefore survive and
 * `JSON.stringify` emits a matched `\uD83D\uDE00` pair.
 */
function sanitizeString(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const low = value.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        out += value[i] + value[i + 1];
        i++;
      } else {
        out += REPLACEMENT;
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      out += REPLACEMENT;
    } else {
      out += value[i];
    }
  }
  return out;
}

function stripLoneSurrogates(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(stripLoneSurrogates);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = stripLoneSurrogates((value as Record<string, unknown>)[key]);
    }
    return out;
  }

  return value;
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
  return JSON.stringify(stripLoneSurrogates(sortKeys(value))) ?? 'null';
}

export function packPretty(value: unknown): string {
  return JSON.stringify(stripLoneSurrogates(sortKeys(value)), null, 2) ?? 'null';
}

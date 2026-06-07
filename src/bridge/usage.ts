import type { UsagePayload } from './types';

/**
 * Read a dot-separated path from an object, returning the numeric value or 0.
 * e.g. readPath(obj, "prompt_tokens_details.cached_tokens")
 */
export function readPath(obj: unknown, path: string | undefined): number {
  if (!path) return 0;
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') return 0;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'number' ? current : 0;
}

/**
 * Walk the nested UsageSchema and populate a UsagePayload from the provider's
 * raw usage object.  Each schema leaf is a dot-path into rawUsage.
 */
export function applyUsageSchema(
  schema: Record<string, unknown>,
  rawUsage: Record<string, unknown>,
  target: Record<string, unknown>,
): void {
  for (const key of Object.keys(schema)) {
    const val = schema[key];
    if (typeof val === 'string') {
      target[key] = readPath(rawUsage, val);
    } else if (typeof val === 'object' && val !== null) {
      if (!(key in target) || typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      applyUsageSchema(
        val as Record<string, unknown>,
        rawUsage,
        target[key] as Record<string, unknown>,
      );
    }
  }
}

/** Build a concise one-line usage summary for logging. */
export function buildUsageLog(
  modelApiId: string,
  usage: UsagePayload,
  promptChars?: number,
): string {
  const segments: string[] = [`model: ${modelApiId}`];

  const tokenSegments: string[] = [];
  if (usage.prompt_tokens > 0) tokenSegments.push(`prompt=${usage.prompt_tokens}`);

  const reasoning = usage.completion_tokens_details?.reasoning_tokens;
  if (reasoning && reasoning > 0) tokenSegments.push(`reasoning=${reasoning}`);

  if (usage.completion_tokens > 0) tokenSegments.push(`completion=${usage.completion_tokens}`);

  const cacheSegments: string[] = [];
  if (usage.prompt_tokens_details) {
    const { cached_tokens: hit = 0, cache_miss: miss = 0 } = usage.prompt_tokens_details;
    let derivedMiss = miss;
    // Derive cache_miss from prompt_tokens - hit when provider doesn't report it
    if (miss === 0 && hit >= 0 && usage.prompt_tokens > hit) {
      derivedMiss = usage.prompt_tokens - hit;
    }
    cacheSegments.push(`hit=${hit}`);
    if (derivedMiss > 0 || hit > 0) cacheSegments.push(`miss=${derivedMiss}`);
    if (hit + derivedMiss > 0) {
      const rate = Math.round((hit / (hit + derivedMiss)) * 100);
      cacheSegments.push(`rate=${rate}%`);
    }
  }

  if (tokenSegments.length > 0) segments.push(`tokens: ${tokenSegments.join(' ')}`);
  if (cacheSegments.length > 0) segments.push(`cache: ${cacheSegments.join(' ')}`);
  if (promptChars !== undefined && usage.prompt_tokens > 0) {
    segments.push(`chars/token=${(promptChars / usage.prompt_tokens).toFixed(1)}`);
  }

  return segments.join(', ');
}

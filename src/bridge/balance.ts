import { channel } from '../logger';
import type { ServiceLinks } from '../providers/types';

/**
 * Shape returned by DeepSeek's /user/balance endpoint.
 * Other providers may return different shapes — handle per-provider.
 */
export interface BalanceResult {
  /** Formatted balance string for display, e.g. "¥19.20" */
  display: string;
  /** Raw balance data — provider-specific */
  raw?: unknown;
}

/**
 * In-memory cache entry for balance queries.
 */
interface CacheEntry {
  data: BalanceResult;
  timestamp: number;
}

/** Default cache TTL: 5 minutes. */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, CacheEntry>();

function cacheKey(apiKey: string, endpointId: string): string {
  return `${apiKey}:${endpointId}`;
}

/**
 * Return cached balance if it's fresh enough; otherwise undefined.
 */
export function getCachedBalance(
  apiKey: string,
  endpointId: string,
  ttlMs = DEFAULT_TTL_MS,
): BalanceResult | undefined {
  const entry = cache.get(cacheKey(apiKey, endpointId));
  if (!entry) return undefined;

  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(cacheKey(apiKey, endpointId));
    return undefined;
  }

  return entry.data;
}

/**
 * Query DeepSeek's /user/balance endpoint.
 */
async function queryDeepSeekBalance(apiKey: string): Promise<BalanceResult> {
  const url = 'https://api.deepseek.com/user/balance';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Balance query failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    is_available: boolean;
    balance_infos: Array<{
      currency: string;
      total_balance: string;
      granted_balance: string;
      topped_up_balance: string;
    }>;
  };

  const info = data.balance_infos?.[0];
  if (!info) {
    return { display: 'N/A', raw: data };
  }

  const symbol = info.currency === 'CNY' ? '¥' : info.currency === 'USD' ? '$' : `${info.currency} `;

  return {
    display: `${symbol}${info.total_balance}`,
    raw: data,
  };
}

/**
 * Query balance for a given provider endpoint.
 * Dispatches to the appropriate provider-specific handler based on links.
 */
export async function queryBalance(
  apiKey: string,
  endpointId: string,
  _links?: ServiceLinks,
): Promise<BalanceResult> {
  // For now only DeepSeek is supported; other providers will follow
  // the same pattern once balance endpoints are known.
  try {
    const result = await queryDeepSeekBalance(apiKey);

    // Cache the result
    cache.set(cacheKey(apiKey, endpointId), {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    channel.warn(`Balance query failed for ${endpointId}: ${msg}`);

    return { display: 'N/A' };
  }
}

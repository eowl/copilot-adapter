import { channel } from '../logger';
import { Settings } from '../settings';
import type { ServiceLinks } from '../providers/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
};

function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

export interface BalanceResult {
  display: string;
  currency?: string;
  raw?: unknown;
}

interface CacheEntry {
  data: BalanceResult;
  timestamp: number;
}

function defaultTtlMs(): number {
  return Settings.balanceCacheTime() * 1000;
}

const ERROR_CACHE_TTL_MS = 30_000;

const ERROR_SENTINEL: BalanceResult = { display: '' };

export function isBalanceErrorSentinel(r: BalanceResult): boolean {
  return r === ERROR_SENTINEL;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(apiKey: string, endpointId: string): string {
  return `${apiKey}:${endpointId}`;
}

export function getCachedBalance(
  apiKey: string,
  endpointId: string,
  ttlMs = defaultTtlMs(),
): BalanceResult | undefined {
  const entry = cache.get(cacheKey(apiKey, endpointId));
  if (!entry) return undefined;

  // Error sentinels use their own shorter TTL so they eventually expire.
  const effectiveTtl = entry.data === ERROR_SENTINEL ? ERROR_CACHE_TTL_MS : ttlMs;

  if (Date.now() - entry.timestamp > effectiveTtl) {
    cache.delete(cacheKey(apiKey, endpointId));
    return undefined;
  }

  return entry.data;
}

async function queryDeepSeekBalance(apiKey: string, url: string): Promise<BalanceResult> {
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

  return {
    display: `${currencySymbol(info.currency)}${info.total_balance}`,
    currency: info.currency,
    raw: data,
  };
}

async function queryMoonshotBalance(
  apiKey: string,
  url: string,
  currency: string,
): Promise<BalanceResult> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Balance query failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    code: number;
    data: {
      available_balance: number;
      voucher_balance: number;
      cash_balance: number;
    };
    scode: string;
    status: boolean;
  };

  if (!data.status || !data.data) {
    return { display: 'N/A', raw: data };
  }

  return {
    display: `${currencySymbol(currency)}${data.data.available_balance.toFixed(2)}`,
    currency,
    raw: data,
  };
}

export async function queryBalance(
  apiKey: string,
  endpointId: string,
  links?: ServiceLinks,
): Promise<BalanceResult> {
  const url = links?.balance;
  if (!url) return ERROR_SENTINEL;

  try {
    let result: BalanceResult;

    if (endpointId === 'deepseek') {
      result = await queryDeepSeekBalance(apiKey, url);
    } else if (endpointId === 'moonshot.cn') {
      result = await queryMoonshotBalance(apiKey, url, 'CNY');
    } else if (endpointId === 'moonshot.ai') {
      result = await queryMoonshotBalance(apiKey, url, 'USD');
    } else {
      return ERROR_SENTINEL;
    }

    cache.set(cacheKey(apiKey, endpointId), {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    channel.warn(`Balance query failed for ${endpointId}: ${msg}`);

    cache.set(cacheKey(apiKey, endpointId), {
      data: ERROR_SENTINEL,
      timestamp: Date.now(),
    });

    return ERROR_SENTINEL;
  }
}

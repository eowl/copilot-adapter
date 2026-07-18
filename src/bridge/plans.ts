import { channel } from '../logger';
import { Settings } from '../settings';
import { t } from '../nls';
import type { ServiceLinks } from '../providers/types';

export interface PlanUsageResult {
  display: string;
  raw?: unknown;
}

interface CacheEntry {
  data: PlanUsageResult;
  timestamp: number;
}

function defaultTtlMs(): number {
  return Settings.balanceCacheTime() * 1000;
}

const ERROR_CACHE_TTL_MS = 30_000;

const ERROR_SENTINEL: PlanUsageResult = { display: '' };

export function isPlanUsageErrorSentinel(r: PlanUsageResult): boolean {
  return r === ERROR_SENTINEL;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(apiKey: string, endpointId: string): string {
  return `plan-usage:${apiKey}:${endpointId}`;
}

export function getCachedPlanUsage(
  apiKey: string,
  endpointId: string,
  ttlMs = defaultTtlMs(),
): PlanUsageResult | undefined {
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

interface KimiUsageWindow {
  duration: number;
  timeUnit: string;
}

interface KimiUsageDetail {
  limit: string;
  remaining: string;
  resetTime?: string;
  used?: string;
}

interface KimiPlanUsageResponse {
  limits?: Array<{
    detail?: KimiUsageDetail;
    window?: KimiUsageWindow;
  }>;
  totalQuota?: {
    limit: string;
    remaining: string;
  };
  usage?: KimiUsageDetail;
}

function kimiTimeUnitLabel(unit: string): string {
  switch (unit) {
    case 'TIME_UNIT_MINUTE':
      return 'M';
    case 'TIME_UNIT_HOUR':
      return 'H';
    case 'TIME_UNIT_DAY':
      return 'D';
    case 'TIME_UNIT_WEEK':
      return 'W';
    default:
      return unit;
  }
}

function formatKimiWindow(window: KimiUsageWindow): string {
  if (
    window.timeUnit === 'TIME_UNIT_MINUTE' &&
    window.duration >= 60 &&
    window.duration % 60 === 0
  ) {
    return `${window.duration / 60}H`;
  }

  return `${window.duration}${kimiTimeUnitLabel(window.timeUnit)}`;
}

function formatSegment(labelKey: string, remaining: string, limit: string): string {
  const r = parseInt(remaining, 10);
  const l = parseInt(limit, 10);
  if (isNaN(r) || isNaN(l)) {
    return t(labelKey, remaining, limit);
  }
  return t(labelKey, String(r), String(l));
}

async function queryKimiPlanUsage(apiKey: string, url: string): Promise<PlanUsageResult> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kimi plan usage query failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as KimiPlanUsageResponse;

  const parts: string[] = [];

  const limitWindow = data.limits?.[0];
  if (limitWindow?.window && limitWindow?.detail) {
    const w = formatKimiWindow(limitWindow.window);
    parts.push(t('plan.usage.window', w, limitWindow.detail.remaining, limitWindow.detail.limit));
  }

  if (data.usage) {
    parts.push(formatSegment('plan.usage.weekly', data.usage.remaining, data.usage.limit));
  }

  if (data.totalQuota) {
    parts.push(formatSegment('plan.usage.total', data.totalQuota.remaining, data.totalQuota.limit));
  }

  return { display: parts.length > 0 ? parts.join(' ') : '', raw: data };
}

export async function queryPlanUsage(
  apiKey: string,
  endpointId: string,
  links?: ServiceLinks,
): Promise<PlanUsageResult> {
  const url = links?.usage;
  if (!url) return ERROR_SENTINEL;

  try {
    let result: PlanUsageResult;

    if (endpointId === 'kimi-code') {
      result = await queryKimiPlanUsage(apiKey, url);
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
    channel.warn(`Plan usage query failed for ${endpointId}: ${msg}`);

    cache.set(cacheKey(apiKey, endpointId), {
      data: ERROR_SENTINEL,
      timestamp: Date.now(),
    });

    return ERROR_SENTINEL;
  }
}

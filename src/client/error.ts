import { t } from '../nls';
import type { ServiceLinks } from '../providers/types';

export type ApiErrorKind = 'http' | 'network' | 'unknown';

/**
 * Structured error from the LLM API layer.
 * Carries a short user-facing summary and a richer diagnostic message.
 */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly summary: string,
    public readonly diagnostic: string,
    public readonly links?: ServiceLinks,
    public readonly status?: number,
  ) {
    super(summary);
    this.name = 'ApiError';
  }
}

export async function buildHttpError(response: Response, links?: ServiceLinks): Promise<ApiError> {
  const status = response.status;
  let body = '';
  try {
    body = await response.text();
  } catch {
    // ignore
  }

  const diagnostic = `HTTP ${status}: ${body.slice(0, 400)}`;

  const summary = mapHttpStatus(status, links, body);
  return new ApiError('http', summary, diagnostic, links, status);
}

export function extractErrorDetail(body: string, maxLength = 200): string | undefined {
  const text = body.trim();
  if (!text) return undefined;

  let detail: string | undefined;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const err = parsed.error;
    if (err && typeof err === 'object') {
      const inner = err as Record<string, unknown>;
      if (typeof inner.message === 'string' && inner.message) detail = inner.message;
      else if (typeof inner.msg === 'string' && inner.msg) detail = inner.msg;
    }
    if (!detail) {
      if (typeof parsed.message === 'string' && parsed.message) detail = parsed.message;
      else if (typeof parsed.msg === 'string' && parsed.msg) detail = parsed.msg;
      else if (typeof parsed.detail === 'string' && parsed.detail) detail = parsed.detail;
    }
  } catch {
    // Not JSON — treat as plain text below.
  }

  if (!detail) detail = text;

  detail = detail.replace(/\s+/g, ' ').trim();
  if (!detail) return undefined;
  if (detail.length > maxLength) detail = `${detail.slice(0, maxLength)}…`;
  return detail;
}

function mapHttpStatus(status: number, links?: ServiceLinks, body = ''): string {
  const logsHint = links ? ` ${t('err.action.logs')}.` : '';
  switch (status) {
    case 401:
      return `${t('err.http.401')}${links?.apiKeys ? ` [${t('err.action.keys')}](${links.apiKeys})` : ''}`;
    case 402:
      return `${t('err.http.402')}${links?.usage ? ` [${t('err.action.usage')}](${links.usage})` : ''}`;
    case 429:
      return t('err.http.429');
    case 500:
      return `${t('err.http.500')}${logsHint}`;
    case 503:
      return `${t('err.http.503')}${links?.status ? ` [${t('err.action.status')}](${links.status})` : ''}`;
    default: {
      const detail = extractErrorDetail(body);
      return detail
        ? `HTTP ${status} error: ${detail}${logsHint}`
        : `HTTP ${status} error.${logsHint}`;
    }
  }
}

export function wrapFetchError(err: unknown, apiUrl: string, links?: ServiceLinks): ApiError {
  if (err instanceof ApiError) return err;

  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  // Abort / cancellation
  if (lower.includes('abort') || lower.includes('cancel')) {
    return new ApiError('network', t('err.network.aborted'), message, links);
  }

  // Timeout
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return new ApiError('network', t('err.network.timeout'), message, links);
  }

  // DNS / unreachable
  if (
    lower.includes('getaddrinfo') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('network') ||
    lower.includes('socket')
  ) {
    try {
      const host = new URL(apiUrl).hostname;
      return new ApiError('network', t('err.network.dns', host), message, links);
    } catch {
      return new ApiError('network', t('err.network.dns', apiUrl), message, links);
    }
  }

  return new ApiError('unknown', `${message}`, message, links);
}

/** Wraps any error into an ApiError suitable for throwing to VS Code. */
export function toApiError(err: unknown, apiUrl: string, links?: ServiceLinks): ApiError {
  if (err instanceof ApiError) return err;

  return wrapFetchError(err, apiUrl, links);
}

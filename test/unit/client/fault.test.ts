import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { ApiError, buildHttpError, wrapFetchError, toApiError } from '../../../src/client/error';

suite('client/fault', () => {
  suite('ApiError', () => {
    test('is an instance of Error', () => {
      const err = new ApiError('http', 'summary', 'diag');
      assert.ok(err instanceof Error);
    });

    test('has name "ApiError"', () => {
      const err = new ApiError('http', 'summary', 'diag');
      assert.equal(err.name, 'ApiError');
    });

    test('message equals summary', () => {
      const err = new ApiError('http', 'my summary', 'diag');
      assert.equal(err.message, 'my summary');
    });

    test('exposes kind, summary, diagnostic, links, status', () => {
      const links = { apiKeys: 'https://example.com/keys' };
      const err = new ApiError('http', 'sum', 'diag', links, 401);
      assert.equal(err.kind, 'http');
      assert.equal(err.summary, 'sum');
      assert.equal(err.diagnostic, 'diag');
      assert.deepEqual(err.links, links);
      assert.equal(err.status, 401);
    });
  });

  suite('buildHttpError()', () => {
    test('returns an ApiError with kind "http"', async () => {
      const response = new Response('body', { status: 500 });
      const err = await buildHttpError(response);
      assert.ok(err instanceof ApiError);
      assert.equal(err.kind, 'http');
    });

    test('sets status from response.status', async () => {
      const response = new Response('', { status: 429 });
      const err = await buildHttpError(response);
      assert.equal(err.status, 429);
    });

    test('diagnostic includes HTTP status code and body', async () => {
      const response = new Response('error body text', { status: 400 });
      const err = await buildHttpError(response);
      assert.ok(err.diagnostic.includes('400'), `diagnostic: ${err.diagnostic}`);
      assert.ok(err.diagnostic.includes('error body text'), `diagnostic: ${err.diagnostic}`);
    });

    test('summary for 429 mentions 429', async () => {
      const response = new Response('', { status: 429 });
      const err = await buildHttpError(response);
      assert.ok(err.summary.includes('429'), `summary: ${err.summary}`);
    });

    test('summary for unknown status includes status code', async () => {
      const response = new Response('', { status: 418 });
      const err = await buildHttpError(response);
      assert.ok(err.summary.includes('418'), `summary: ${err.summary}`);
    });
  });

  suite('wrapFetchError()', () => {
    test('returns same ApiError if already an ApiError', () => {
      const original = new ApiError('http', 's', 'd');
      const result = wrapFetchError(original, 'https://api.example.com');
      assert.strictEqual(result, original);
    });

    test('detects abort/cancel → network kind', () => {
      const err = new Error('request was aborted');
      const result = wrapFetchError(err, 'https://api.example.com');
      assert.equal(result.kind, 'network');
      assert.ok(result.summary.includes('cancel') || result.summary.toLowerCase().includes('cancel'), result.summary);
    });

    test('detects timeout → network kind', () => {
      const err = new Error('Request timed out after 30s');
      const result = wrapFetchError(err, 'https://api.example.com');
      assert.equal(result.kind, 'network');
    });

    test('detects ENOTFOUND (DNS) → network kind with hostname', () => {
      const err = new Error('getaddrinfo ENOTFOUND api.example.com');
      const result = wrapFetchError(err, 'https://api.example.com/v1');
      assert.equal(result.kind, 'network');
      assert.ok(result.summary.includes('api.example.com'), `summary: ${result.summary}`);
    });

    test('unknown error → kind "unknown"', () => {
      const err = new Error('some weird error');
      const result = wrapFetchError(err, 'https://api.example.com');
      assert.equal(result.kind, 'unknown');
    });

    test('handles non-Error thrown values', () => {
      const result = wrapFetchError('string error', 'https://api.example.com');
      assert.ok(result instanceof ApiError);
    });
  });

  suite('toApiError()', () => {
    test('passes through an existing ApiError', () => {
      const original = new ApiError('http', 's', 'd');
      assert.strictEqual(toApiError(original, 'https://x'), original);
    });

    test('wraps a generic Error into an ApiError', () => {
      const result = toApiError(new Error('boom'), 'https://x');
      assert.ok(result instanceof ApiError);
    });
  });
});

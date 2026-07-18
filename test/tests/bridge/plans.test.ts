import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import {
  getCachedPlanUsage,
  queryPlanUsage,
  isPlanUsageErrorSentinel,
} from '../../../src/bridge/plans';

suite('bridge/plans getCachedPlanUsage', () => {
  test('returns undefined when nothing cached', () => {
    const result = getCachedPlanUsage('key-unknown', 'ep-unknown', 60_000);
    assert.equal(result, undefined);
  });

  test('returns undefined for empty apiKey', () => {
    const result = getCachedPlanUsage('', 'some-ep', 60_000);
    assert.equal(result, undefined);
  });
});

suite('bridge/plans queryPlanUsage', () => {
  test('returns error sentinel when links are undefined', async () => {
    const result = await queryPlanUsage('key', 'some-ep', undefined);
    assert.equal(isPlanUsageErrorSentinel(result), true);
    assert.equal(result.display, '');
  });

  test('returns error sentinel when usage URL is empty', async () => {
    const result = await queryPlanUsage('key', 'some-ep', {});
    assert.equal(isPlanUsageErrorSentinel(result), true);
    assert.equal(result.display, '');
  });

  test('returns error sentinel for unknown endpoint id', async () => {
    const result = await queryPlanUsage('key', 'unknown-provider', {
      usage: 'https://example.com/usage',
    });
    assert.equal(isPlanUsageErrorSentinel(result), true);
    assert.equal(result.display, '');
  });
});

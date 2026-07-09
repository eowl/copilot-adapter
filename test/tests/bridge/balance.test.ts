import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { getCachedBalance, queryBalance } from '../../../src/bridge/balance';

suite('bridge/balance getCachedBalance', () => {
  test('returns undefined when nothing cached', () => {
    const result = getCachedBalance('key-unknown', 'ep-unknown', 60_000);
    assert.equal(result, undefined);
  });

  test('returns undefined for empty apiKey', () => {
    const result = getCachedBalance('', 'some-ep', 60_000);
    assert.equal(result, undefined);
  });
});

suite('bridge/balance queryBalance', () => {
  test('returns N/A display when links are undefined', async () => {
    const result = await queryBalance('key', 'some-ep', undefined);
    assert.equal(result.display, 'N/A');
  });

  test('returns N/A display when balance URL is empty', async () => {
    const result = await queryBalance('key', 'some-ep', {});
    assert.equal(result.display, 'N/A');
  });

  test('returns N/A display for unknown endpoint id', async () => {
    const result = await queryBalance('key', 'unknown-provider', {
      balance: 'https://example.com/balance',
    });
    assert.equal(result.display, 'N/A');
  });
});

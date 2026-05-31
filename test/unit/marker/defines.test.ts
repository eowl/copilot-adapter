import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MARKER_MIME, WRITER_ID, BASE64URL_RE, UUID_RE } from '../../../src/marker/defines';

suite('marker/defines', () => {
  test('MARKER_MIME is stateful_marker', () => {
    assert.equal(MARKER_MIME, 'stateful_marker');
  });

  test('WRITER_ID is copilot-adapter', () => {
    assert.equal(WRITER_ID, 'copilot-adapter');
  });

  suite('BASE64URL_RE', () => {
    test('accepts valid base64url chars', () => {
      assert.ok(BASE64URL_RE.test('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'));
    });

    test('rejects padding character =', () => {
      assert.ok(!BASE64URL_RE.test('abc='));
    });

    test('rejects + (standard base64 char)', () => {
      assert.ok(!BASE64URL_RE.test('abc+def'));
    });

    test('rejects empty string', () => {
      assert.ok(!BASE64URL_RE.test(''));
    });
  });

  suite('UUID_RE', () => {
    test('accepts a valid lowercase UUID', () => {
      assert.ok(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000'));
    });

    test('accepts a mixed-case UUID', () => {
      assert.ok(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000'));
    });

    test('rejects a UUID without hyphens', () => {
      assert.ok(!UUID_RE.test('550e8400e29b41d4a716446655440000'));
    });

    test('rejects a truncated UUID', () => {
      assert.ok(!UUID_RE.test('550e8400-e29b-41d4-a716'));
    });
  });
});

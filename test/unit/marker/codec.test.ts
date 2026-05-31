import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { encodeMarker, decodeMarkerData, hasMarkerPayload } from '../../../src/marker/codec';
import { MARKER_MIME, WRITER_ID } from '../../../src/marker/defines';

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

suite('marker/codec', () => {
  suite('encodeMarker()', () => {
    test('returns a LanguageModelDataPart with the correct MIME type', () => {
      const part = encodeMarker({}, SAMPLE_UUID);
      assert.ok(part instanceof vscode.LanguageModelDataPart);
      assert.equal(part.mimeType, MARKER_MIME);
    });

    test('encoded data starts with WRITER_ID + backslash', () => {
      const part = encodeMarker({}, SAMPLE_UUID);
      const text = new TextDecoder().decode(part.data);
      assert.ok(text.startsWith(`${WRITER_ID}\\`), `Got: ${text}`);
    });

    test('empty payload omits segmentId when no segmentId arg', () => {
      const part = encodeMarker({});
      const result = decodeMarkerData(part.data);
      assert.ok(result.valid);
      assert.equal(result.segmentId, undefined);
    });

    test('segmentId is preserved through encode/decode round-trip', () => {
      const part = encodeMarker({}, SAMPLE_UUID);
      const result = decodeMarkerData(part.data);
      assert.ok(result.valid, `Decode failed: ${result.valid ? '' : result.error}`);
      assert.equal(result.segmentId, SAMPLE_UUID.toLowerCase());
    });

    test('visionText is preserved through encode/decode round-trip', () => {
      const part = encodeMarker({ visionText: 'a cat on a mat' }, SAMPLE_UUID);
      const result = decodeMarkerData(part.data);
      assert.ok(result.valid);
      assert.equal(result.visionText, 'a cat on a mat');
    });

    test('reasoningText is preserved through encode/decode round-trip', () => {
      const part = encodeMarker({ reasoningText: 'thinking...' }, SAMPLE_UUID);
      const result = decodeMarkerData(part.data);
      assert.ok(result.valid);
      assert.equal(result.reasoningText, 'thinking...');
    });

    test('segmentId is lowercased in decode output', () => {
      const uuidUpper = SAMPLE_UUID.toUpperCase();
      const part = encodeMarker({}, uuidUpper);
      const result = decodeMarkerData(part.data);
      assert.ok(result.valid);
      assert.equal(result.segmentId, SAMPLE_UUID.toLowerCase());
    });
  });

  suite('decodeMarkerData()', () => {
    test('returns valid:false for data without backslash separator', () => {
      const data = new TextEncoder().encode('nodashhere');
      const result = decodeMarkerData(data);
      assert.ok(!result.valid);
      assert.equal(result.error, 'missing-separator');
    });

    test('returns valid:false for unknown writer', () => {
      const data = new TextEncoder().encode('unknown-writer\\json:dGVzdA');
      const result = decodeMarkerData(data);
      assert.ok(!result.valid);
      assert.equal(result.error, 'unknown-writer');
    });

    test('returns valid:false for invalid base64url payload', () => {
      const data = new TextEncoder().encode(`${WRITER_ID}\\json:not valid base64!`);
      const result = decodeMarkerData(data);
      assert.ok(!result.valid);
    });
  });

  suite('hasMarkerPayload()', () => {
    test('returns false for empty payload', () => {
      assert.equal(hasMarkerPayload({}), false);
    });

    test('returns true when visionText is set', () => {
      assert.equal(hasMarkerPayload({ visionText: 'image desc' }), true);
    });

    test('returns true when reasoningText is set', () => {
      assert.equal(hasMarkerPayload({ reasoningText: 'some reasoning' }), true);
    });

    test('returns true when both are set', () => {
      assert.equal(hasMarkerPayload({ visionText: 'img', reasoningText: 'think' }), true);
    });
  });
});

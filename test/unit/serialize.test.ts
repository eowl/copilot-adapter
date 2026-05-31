import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { pack, packPretty } from '../../src/serialize';

suite('serialize', () => {
  suite('pack()', () => {
    test('serializes a plain object', () => {
      assert.equal(pack({ a: 1 }), '{"a":1}');
    });

    test('serializes an array', () => {
      assert.equal(pack([1, 2, 3]), '[1,2,3]');
    });

    test('serializes a string', () => {
      assert.equal(pack('hello'), '"hello"');
    });

    test('serializes null', () => {
      assert.equal(pack(null), 'null');
    });

    test('serializes undefined as null (JSON.stringify fallback)', () => {
      assert.equal(pack(undefined), 'null');
    });

    test('serializes a number', () => {
      assert.equal(pack(42), '42');
    });

    test('serializes a boolean', () => {
      assert.equal(pack(true), 'true');
    });

    test('produces compact JSON (no spaces)', () => {
      const result = pack({ x: 1, y: 2 });
      assert.ok(!result.includes(' '), `Expected compact JSON, got: ${result}`);
    });
  });

  suite('packPretty()', () => {
    test('produces indented JSON', () => {
      const result = packPretty({ a: 1 });
      assert.ok(result.includes('\n'), 'Expected newlines in pretty output');
      assert.ok(result.includes('  '), 'Expected indentation in pretty output');
    });

    test('matches JSON.stringify with 2-space indent', () => {
      const val = { foo: [1, 2], bar: true };
      assert.equal(packPretty(val), JSON.stringify(val, null, 2));
    });

    test('serializes null', () => {
      assert.equal(packPretty(null), 'null');
    });
  });
});

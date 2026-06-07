import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { pack, packPretty, sortKeys } from '../../src/serialize';

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

    test('sorts object keys deterministically', () => {
      const a = { z: 1, a: 2, m: 3 };
      const b = { a: 2, m: 3, z: 1 };
      assert.equal(pack(a), pack(b));
    });

    test('sorts nested object keys recursively', () => {
      const a = { outer: { z: 1, a: 2 }, b: 3 };
      const b = { b: 3, outer: { a: 2, z: 1 } };
      assert.equal(pack(a), pack(b));
    });

    test('sorts keys inside arrays', () => {
      const a = [{ z: 1, a: 2 }];
      const b = [{ a: 2, z: 1 }];
      assert.equal(pack(a), pack(b));
    });

    test('produces same output regardless of key insertion order', () => {
      // Simulates VS Code tool input with unpredictable key order
      const toolInput1 = { query: 'test', limit: 10, offset: 0 };
      const toolInput2 = { offset: 0, query: 'test', limit: 10 };
      assert.equal(pack(toolInput1), pack(toolInput2));
    });
  });

  suite('packPretty()', () => {
    test('produces indented JSON', () => {
      const result = packPretty({ a: 1 });
      assert.ok(result.includes('\n'), 'Expected newlines in pretty output');
      assert.ok(result.includes('  '), 'Expected indentation in pretty output');
    });

    test('sorts object keys deterministically in pretty output', () => {
      const a = { z: 1, a: 2 };
      const b = { a: 2, z: 1 };
      assert.equal(packPretty(a), packPretty(b));
    });

    test('matches JSON.stringify with 2-space indent (sorted)', () => {
      const val = { bar: true, foo: [1, 2] };
      const sorted = { bar: true, foo: [1, 2] }; // already sorted
      assert.equal(packPretty(val), JSON.stringify(sorted, null, 2));
    });

    test('serializes null', () => {
      assert.equal(packPretty(null), 'null');
    });
  });

  suite('sortKeys()', () => {
    test('returns primitives as-is', () => {
      assert.equal(sortKeys(42), 42);
      assert.equal(sortKeys('hello'), 'hello');
      assert.equal(sortKeys(true), true);
      assert.equal(sortKeys(null), null);
    });

    test('sorts top-level object keys', () => {
      const result = sortKeys({ c: 3, a: 1, b: 2 });
      assert.deepEqual(Object.keys(result as object), ['a', 'b', 'c']);
    });

    test('sorts nested object keys recursively', () => {
      const result = sortKeys({ z: { y: 2, x: 1 } });
      const inner = (result as { z: object }).z;
      assert.deepEqual(Object.keys(inner), ['x', 'y']);
    });

    test('preserves array order', () => {
      const result = sortKeys([3, 1, 2]);
      assert.deepEqual(result, [3, 1, 2]);
    });

    test('sorts keys within array elements', () => {
      const result = sortKeys([{ z: 1, a: 2 }]);
      const inner = (result as Array<object>)[0];
      assert.deepEqual(Object.keys(inner), ['a', 'z']);
    });

    test('does not mutate the original object', () => {
      const original = { z: 1, a: 2 };
      const keysBefore = Object.keys(original);
      sortKeys(original);
      assert.deepEqual(Object.keys(original), keysBefore);
    });
  });
});

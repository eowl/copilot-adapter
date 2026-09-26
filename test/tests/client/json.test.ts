import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import {
  normalizeToolArgs,
  repairTruncatedJson,
  sanitizeToolArgs,
} from '../../../src/client/json';

suite('client/json', () => {
  suite('sanitizeToolArgs()', () => {
    test('passes through valid JSON unchanged', () => {
      const input = '{"path":"/tmp/a.txt","n":1}';
      const result = sanitizeToolArgs(input);
      assert.equal(result.kind, 'ok');
      assert.equal(result.value, input);
      assert.equal(result.originalLength, input.length);
    });

    test('passes through empty object', () => {
      const result = sanitizeToolArgs('{}');
      assert.equal(result.kind, 'ok');
      assert.equal(result.value, '{}');
    });

    test('repairs truncation inside a string literal', () => {
      const result = sanitizeToolArgs('{"path":"/tmp/a.tx');
      assert.equal(result.kind, 'repaired');
      assert.doesNotThrow(() => JSON.parse(result.value));
      assert.equal(JSON.parse(result.value).path, '/tmp/a.tx');
    });

    test('repairs a dangling \\u escape (the reported root cause)', () => {
      // Stream cut between `\u` and its four hex digits.
      const result = sanitizeToolArgs('{"text":"hello \\u5');
      assert.equal(result.kind, 'repaired');
      const parsed = JSON.parse(result.value) as { text: string };
      assert.equal(parsed.text, 'hello ');
    });

    test('repairs a \\u escape with too few hex digits', () => {
      const result = sanitizeToolArgs('{"text":"a\\u12"}');
      assert.equal(result.kind, 'repaired');
      assert.doesNotThrow(() => JSON.parse(result.value));
    });

    test('repairs a trailing lone backslash', () => {
      const result = sanitizeToolArgs('{"text":"abc\\');
      assert.equal(result.kind, 'repaired');
      assert.doesNotThrow(() => JSON.parse(result.value));
    });

    test('repairs an unclosed object', () => {
      const result = sanitizeToolArgs('{"a":1,"b":2');
      assert.equal(result.kind, 'repaired');
      assert.deepEqual(JSON.parse(result.value), { a: 1, b: 2 });
    });

    test('repairs an unclosed array', () => {
      const result = sanitizeToolArgs('{"items":[1,2,3');
      assert.equal(result.kind, 'repaired');
      assert.deepEqual(JSON.parse(result.value), { items: [1, 2, 3] });
    });

    test('repairs a trailing comma', () => {
      const result = sanitizeToolArgs('{"a":1,');
      assert.equal(result.kind, 'repaired');
      assert.deepEqual(JSON.parse(result.value), { a: 1 });
    });

    test('replaces unrecoverable input with {}', () => {
      const result = sanitizeToolArgs('}}}not json at all');
      assert.equal(result.kind, 'replaced');
      assert.equal(result.value, '{}');
      assert.equal(result.originalLength, '}}}not json at all'.length);
    });

    test('replaces empty input with {}', () => {
      const result = sanitizeToolArgs('');
      assert.equal(result.kind, 'replaced');
      assert.equal(result.value, '{}');
    });

    test('always yields parseable JSON regardless of input', () => {
      const inputs = [
        '{"a":1}',
        '{"a":"x',
        '{"a":"\\u5',
        '{"a":',
        '{',
        '[',
        'nonsense',
        '',
        '{"a":1,"b":[{"c":"\\u00',
      ];
      for (const input of inputs) {
        const { value } = sanitizeToolArgs(input);
        assert.doesNotThrow(() => JSON.parse(value), `unparseable for input: ${input}`);
      }
    });

    test('preserves valid surrogate pairs', () => {
      const input = JSON.stringify({ emoji: '😀' });
      const result = sanitizeToolArgs(input);
      assert.equal(result.kind, 'ok');
      assert.equal(result.value, input);
    });
  });

  suite('repairTruncatedJson()', () => {
    test('returns undefined for empty string', () => {
      assert.equal(repairTruncatedJson('   '), undefined);
    });

    test('returns undefined for unbalanced closing braces', () => {
      assert.equal(repairTruncatedJson('{"a":1}}'), undefined);
    });
  });

  suite('normalizeToolArgs()', () => {
    test('returns the normalized string only', () => {
      assert.equal(normalizeToolArgs('{"a":1'), '{"a":1}');
      assert.equal(normalizeToolArgs('{"a":1}'), '{"a":1}');
    });
  });
});

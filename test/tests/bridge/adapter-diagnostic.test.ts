import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { findBadEscape } from '../../../src/bridge/adapter';

suite('bridge/adapter findBadEscape()', () => {
  test('returns undefined for clean JSON args', () => {
    assert.equal(findBadEscape('{"path":"/tmp/a.txt","n":1}'), undefined);
  });

  test('returns undefined for valid \\u escapes', () => {
    assert.equal(findBadEscape('{"text":"A\\u0041B"}'), undefined);
  });

  test('returns undefined for valid surrogate pairs', () => {
    assert.equal(findBadEscape('{"emoji":"\\uD83D\\uDE00"}'), undefined);
  });

  test('returns undefined for escaped backslashes', () => {
    assert.equal(findBadEscape('{"path":"C:\\\\tmp\\\\a"}'), undefined);
  });

  test('flags a dangling backslash at EOF', () => {
    const s = '{"text":"abc\\';
    assert.equal(findBadEscape(s), s.length - 1);
  });

  test('flags `\\u` with too few hex digits (the reported root cause)', () => {
    const s = '{"text":"hello\\u5"}';
    assert.equal(findBadEscape(s), s.indexOf('\\u'));
  });

  test('flags `\\u` at end of input', () => {
    const s = '{"text":"hello\\u';
    assert.equal(findBadEscape(s), s.length - 2);
  });

  test('flags `\\u` with non-hex digits', () => {
    const s = '{"text":"\\uZZZZ"}';
    assert.equal(findBadEscape(s), s.indexOf('\\u'));
  });

  test('returns undefined for an empty string', () => {
    assert.equal(findBadEscape(''), undefined);
  });
});

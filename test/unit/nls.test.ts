import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { t } from '../../src/nls';

suite('nls — t()', () => {
  test('returns the key verbatim when the key is unknown', () => {
    const key = 'no.such.key.xyz';
    assert.equal(t(key), key);
  });

  test('returns English for known keys (en is the default locale)', () => {
    // In the test extension host the locale is "en", so en dict is active.
    const result = t('err.http.429');
    assert.ok(
      result.includes('429'),
      `Expected result to contain "429", got: ${result}`,
    );
  });

  test('replaces {0} placeholder', () => {
    const result = t('err.network.dns', 'api.example.com');
    assert.ok(
      result.includes('api.example.com'),
      `Expected placeholder substitution, got: ${result}`,
    );
  });

  test('replaces {0} and {1} placeholders', () => {
    // 'auth.keyInputHinted' has {0} and {1}
    const result = t('auth.keyInputHinted', 'DeepSeek', 'sk-...');
    assert.ok(result.includes('DeepSeek'), `Missing {0} substitution: ${result}`);
    assert.ok(result.includes('sk-...'), `Missing {1} substitution: ${result}`);
  });

  test('handles zero args gracefully (no replacement attempted)', () => {
    const result = t('err.http.401');
    assert.ok(result.includes('401'), `Got: ${result}`);
  });

  test('undefined arg renders as empty string', () => {
    // Pass a single undefined arg for a {0} template
    const result = t('err.network.dns', undefined);
    // The placeholder {0} becomes '' because `String(undefined ?? '')` === ''
    assert.ok(!result.includes('{0}'), `Placeholder was not replaced: ${result}`);
  });
});

import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { DEEPSEEK } from '../../../src/providers/deepseek';

suite('providers/deepseek — DEEPSEEK.requestExtras()', () => {
  // requestExtras is defined on DEEPSEEK; the Provider interface marks it optional
  const requestExtras = DEEPSEEK.requestExtras!.bind(DEEPSEEK);

  test('effort "none" → thinking disabled', () => {
    const result = requestExtras({ reasoningEffort: 'none' }, undefined as never);
    assert.deepEqual(result, { thinking: { type: 'disabled' } });
  });

  test('effort "high" → thinking enabled with high', () => {
    const result = requestExtras({ reasoningEffort: 'high' }, undefined as never);
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('effort "max" → thinking enabled with max', () => {
    const result = requestExtras({ reasoningEffort: 'max' }, undefined as never);
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'max',
    });
  });

  test('unknown effort value defaults to "high"', () => {
    const result = requestExtras({ reasoningEffort: 'medium' }, undefined as never);
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('undefined effort defaults to "high"', () => {
    const result = requestExtras({}, undefined as never);
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('undefined modelConfig defaults to "high"', () => {
    const result = requestExtras(undefined, undefined as never);
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('DEEPSEEK has exactly 2 models', () => {
    assert.equal(DEEPSEEK.models.length, 2);
  });

  test('first model is deepseek-v4-flash', () => {
    assert.equal(DEEPSEEK.models[0].id, 'deepseek-v4-flash');
  });

  test('second model is deepseek-v4-pro', () => {
    assert.equal(DEEPSEEK.models[1].id, 'deepseek-v4-pro');
  });

  test('DEEPSEEK provider id is "deepseek"', () => {
    assert.equal(DEEPSEEK.id, 'deepseek');
  });
});

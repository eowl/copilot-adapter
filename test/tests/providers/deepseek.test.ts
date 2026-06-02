import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { DEEPSEEK, DS_MODELS } from '../../../src/providers/deepseek';

suite('providers/deepseek — DEEPSEEK.requestExtras()', () => {
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
    assert.equal(DS_MODELS.length, 2);
  });

  test('first model is deepseek-v4-flash', () => {
    assert.equal(DS_MODELS[0].id, 'deepseek-v4-flash');
  });

  test('second model is deepseek-v4-pro', () => {
    assert.equal(DS_MODELS[1].id, 'deepseek-v4-pro');
  });

  test('DEEPSEEK provider id is "deepseek"', () => {
    assert.equal(DEEPSEEK.id, 'deepseek');
  });
});

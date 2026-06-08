import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { DEEPSEEK, DS_MODELS } from '../../../src/providers/deepseek';
import type { ModelItem } from '../../../src/providers/types';

suite('providers/deepseek model.requestExtras()', () => {
  const model = DS_MODELS[0] as ModelItem;
  const requestExtras = model.requestExtras!;

  test('model has thinking config with 3 options', () => {
    assert.ok(model.thinking !== undefined);
    assert.equal(model.thinking!.default, 'high');
    assert.equal(model.thinking!.options.length, 3);
  });

  test('each thinking option has requestFields', () => {
    for (const opt of model.thinking!.options) {
      assert.ok(opt.requestFields !== undefined, `option ${opt.value} missing requestFields`);
    }
  });

  test('effort "none": thinking disabled', () => {
    const result = requestExtras({ thinkingMode: 'none' });
    assert.deepEqual(result, { thinking: { type: 'disabled' } });
  });

  test('effort "high": thinking enabled with high', () => {
    const result = requestExtras({ thinkingMode: 'high' });
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('effort "max": thinking enabled with max', () => {
    const result = requestExtras({ thinkingMode: 'max' });
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'max',
    });
  });

  test('unknown effort value defaults to "high"', () => {
    const result = requestExtras({ thinkingMode: 'medium' });
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('undefined effort defaults to "high"', () => {
    const result = requestExtras({});
    assert.deepEqual(result, {
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
    });
  });

  test('undefined modelConfig defaults to "high"', () => {
    const result = requestExtras(undefined);
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

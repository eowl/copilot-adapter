import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MOONSHOT, MS_MODELS } from '../../../src/providers/moonshot';
import { backfillModel } from '../../../src/providers/loader';
import type { ModelItem } from '../../../src/providers/types';

suite('providers/moonshot', () => {
  test('MOONSHOT provider id is "moonshot"', () => {
    assert.equal(MOONSHOT.id, 'moonshot');
  });

  test('has 5 models', () => {
    assert.equal(MS_MODELS.length, 5);
  });

  test('K2.5 has 2-value thinking (adaptive / disabled)', () => {
    const k25 = MS_MODELS.find((m) => m.label === 'Kimi K2.5')!;
    assert.ok(k25.thinkingConfig !== undefined);
    assert.equal(k25.thinkingConfig!.default, 'adaptive');
    assert.equal(k25.thinkingConfig!.options.length, 2);
  });

  test('K2.6 has 3-value thinking (enabled / enabled_keep / disabled)', () => {
    const k26 = MS_MODELS.find((m) => m.label === 'Kimi K2.6')! as ModelItem;
    backfillModel(k26);
    assert.ok(k26.thinkingConfig !== undefined);
    assert.equal(k26.thinkingConfig!.default, 'enabled');
    assert.equal(k26.thinkingConfig!.options.length, 3);

    // enabled_keep to thinking with keep:all
    const result = k26.requestExtras!({ thinkingMode: 'enabled_keep' });
    assert.deepEqual(result, { thinking: { type: 'enabled', keep: 'all' } });
  });

  test('all models use max_completion_tokens', () => {
    for (const m of MS_MODELS) {
      assert.equal((m as ModelItem).maxTokensField, 'max_completion_tokens');
    }
  });
});

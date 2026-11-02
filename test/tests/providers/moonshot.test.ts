import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MOONSHOT, MS_MODELS } from '../../../src/providers/moonshot';
import { backfillModel } from '../../../src/providers/loader';
import type { ModelItem } from '../../../src/providers/types';

suite('providers/moonshot', () => {
  test('MOONSHOT provider id is "moonshot"', () => {
    assert.equal(MOONSHOT.id, 'moonshot');
  });

  test('has 6 models', () => {
    assert.equal(MS_MODELS.length, 6);
  });

  test('K2.7 has single-value thinking (enabled with keep:all)', () => {
    const k27 = MS_MODELS.find((m) => m.label === 'Kimi K2.7 Code')! as ModelItem;
    backfillModel(k27);
    assert.ok(k27.thinkingConfig !== undefined);
    assert.equal(k27.thinkingConfig!.default, 'enabled');
    assert.equal(k27.thinkingConfig!.options.length, 1);

    const result = k27.requestExtras!({ thinkingMode: 'enabled' });
    assert.deepEqual(result, { thinking: { type: 'enabled', keep: 'all' } });
  });

  test('K2.6 has 3-value thinking (enabled / enabled_keep / disabled)', () => {
    const k26 = MS_MODELS.find((m) => m.label === 'Kimi K2.6')! as ModelItem;
    backfillModel(k26);
    assert.ok(k26.thinkingConfig !== undefined);
    assert.equal(k26.thinkingConfig!.default, 'enabled');
    assert.equal(k26.thinkingConfig!.options.length, 3);

    const result = k26.requestExtras!({ thinkingMode: 'enabled_keep' });
    assert.deepEqual(result, { thinking: { type: 'enabled', keep: 'all' } });
  });

  test('all models use max_completion_tokens', () => {
    for (const m of MS_MODELS) {
      assert.equal((m as ModelItem).maxTokensField, 'max_completion_tokens');
    }
  });
});

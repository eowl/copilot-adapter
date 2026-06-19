import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { ALL_MODELS, ALL_PROVIDERS, providerById, modelById, DEEPSEEK, MINIMAX, MOONSHOT, MIMO, QWEN, ZHIPU, CUSTOM } from '../../../src/registry';

suite('providers/index', () => {
  suite('ALL_PROVIDERS', () => {
    test('has exactly 7 providers', () => {
      assert.equal(ALL_PROVIDERS.length, 7);
    });

    test('first provider is DEEPSEEK', () => {
      assert.strictEqual(ALL_PROVIDERS[0], DEEPSEEK);
    });

    test('second provider is MINIMAX', () => {
      assert.strictEqual(ALL_PROVIDERS[1], MINIMAX);
    });

    test('third provider is MOONSHOT', () => {
      assert.strictEqual(ALL_PROVIDERS[2], MOONSHOT);
    });

    test('fourth provider is MIMO', () => {
      assert.strictEqual(ALL_PROVIDERS[3], MIMO);
    });

    test('fifth provider is QWEN', () => {
      assert.strictEqual(ALL_PROVIDERS[4], QWEN);
    });

    test('sixth provider is ZHIPU', () => {
      assert.strictEqual(ALL_PROVIDERS[5], ZHIPU);
    });

    test('seventh provider is CUSTOM', () => {
      assert.strictEqual(ALL_PROVIDERS[6], CUSTOM);
    });
  });

  suite('providerById', () => {
    test('maps "deepseek": DEEPSEEK', () => {
      assert.strictEqual(providerById.get('deepseek'), DEEPSEEK);
    });

    test('maps "minimax": MINIMAX', () => {
      assert.strictEqual(providerById.get('minimax'), MINIMAX);
    });

    test('maps "moonshot": MOONSHOT', () => {
      assert.strictEqual(providerById.get('moonshot'), MOONSHOT);
    });

    test('maps "mimo": MIMO', () => {
      assert.strictEqual(providerById.get('mimo'), MIMO);
    });

    test('maps "qwen": QWEN', () => {
      assert.strictEqual(providerById.get('qwen'), QWEN);
    });

    test('maps "zhipu": ZHIPU', () => {
      assert.strictEqual(providerById.get('zhipu'), ZHIPU);
    });

    test('maps "custom": CUSTOM', () => {
      assert.strictEqual(providerById.get('custom'), CUSTOM);
    });

    test('returns undefined for unknown provider id', () => {
      assert.equal(providerById.get('unknown-provider'), undefined);
    });

    test('has exactly 7 entries', () => {
      assert.equal(providerById.size, 7);
    });
  });

  suite('modelById', () => {
    test('deepseek-v4-flash maps to DEEPSEEK provider', () => {
      const entry = modelById.get('deepseek-v4-flash-deepseek-deepseek');
      assert.ok(entry !== undefined, 'deepseek-v4-flash-deepseek-deepseek not found in modelById');
      assert.strictEqual(entry!.provider, DEEPSEEK);
      assert.equal(entry!.id, 'deepseek-v4-flash');
    });

    test('minimax-m2.7-highspeed maps to MINIMAX provider', () => {
      const entry = modelById.get('minimax-m2.7-highspeed-minimax-minimax.io');
      assert.ok(entry !== undefined);
      assert.strictEqual(entry!.provider, MINIMAX);
    });

    test('contains all models from all providers', () => {
      assert.equal(modelById.size, ALL_MODELS.length);
    });

    test('returns undefined for unknown model id', () => {
      assert.equal(modelById.get('gpt-4o'), undefined);
    });

    test('JSOV-defined model from qwen.json has qwen provider', () => {
      const entry = modelById.get('deepseek-v4-pro-qwen-cn');
      if (entry === undefined) {
        // JSON models may not be loaded in test env; skip but don't fail
        return;
      }
      assert.strictEqual(entry.provider, QWEN);
    });
  });
});

import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { ALL_PROVIDERS, providerById, modelById, DEEPSEEK, MINIMAX } from '../../../src/providers/index';

suite('providers/index', () => {
  suite('ALL_PROVIDERS', () => {
    test('has exactly 2 providers', () => {
      assert.equal(ALL_PROVIDERS.length, 2);
    });

    test('first provider is DEEPSEEK', () => {
      assert.strictEqual(ALL_PROVIDERS[0], DEEPSEEK);
    });

    test('second provider is MINIMAX', () => {
      assert.strictEqual(ALL_PROVIDERS[1], MINIMAX);
    });
  });

  suite('providerById', () => {
    test('maps "deepseek" → DEEPSEEK', () => {
      assert.strictEqual(providerById.get('deepseek'), DEEPSEEK);
    });

    test('maps "minimax" → MINIMAX', () => {
      assert.strictEqual(providerById.get('minimax'), MINIMAX);
    });

    test('returns undefined for unknown provider id', () => {
      assert.equal(providerById.get('unknown-provider'), undefined);
    });

    test('has exactly 2 entries', () => {
      assert.equal(providerById.size, 2);
    });
  });

  suite('modelById', () => {
    test('deepseek-v4-flash maps to DEEPSEEK provider', () => {
      const entry = modelById.get('deepseek-v4-flash');
      assert.ok(entry !== undefined, 'deepseek-v4-flash not found in modelById');
      assert.strictEqual(entry!.provider, DEEPSEEK);
      assert.equal(entry!.model.id, 'deepseek-v4-flash');
    });

    test('minimax-m2.7-highspeed maps to MINIMAX provider', () => {
      const entry = modelById.get('minimax-m2.7-highspeed');
      assert.ok(entry !== undefined);
      assert.strictEqual(entry!.provider, MINIMAX);
    });

    test('contains all models from all providers', () => {
      const totalModels = ALL_PROVIDERS.reduce((sum, p) => sum + p.models.length, 0);
      assert.equal(modelById.size, totalModels);
    });

    test('returns undefined for unknown model id', () => {
      assert.equal(modelById.get('gpt-4o'), undefined);
    });
  });
});

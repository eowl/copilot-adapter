import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { buildChatInfo } from '../../../src/bridge/information';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { stub } from '../../helpers/stubs';
import type { ModelItem } from '../../../src/providers/types';

function makeTestModel(overrides: Partial<ModelItem> = {}): ModelItem {
  return {
    id: 'test-model',
    label: 'Test Model',
    apiId: 'test-model',
    family: 'test-family',
    version: '1',
    maxInputTokens: 1000,
    maxOutputTokens: 500,
    thinking: true,
    imageInput: false,
    maxTools: 10,
    detailKey: 'model.kimi-k2.5.detail',
    source: 'builtin' as const,
    provider: DEEPSEEK,
    ...overrides,
  };
}

/** Stub t() to return the key itself so tests don't need NLS data. */
function stubNls(): () => void {
  return stub(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../../src/nls'),
    't',
    (key: string) => key,
  );
}

suite('bridge/information buildChatInfo', () => {
  let restoreNls: () => void;

  suiteSetup(() => {
    restoreNls = stubNls();
  });

  suiteTeardown(() => {
    restoreNls();
  });

  test('returns model id with provider suffix when idPrefix is empty', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true);

    assert.equal(info.id, 'test-model-deepseek');
    assert.equal(info.name, 'Test Model');
    assert.equal(info.family, 'test-family');
  });

  test('prefixes qualified model id with "PREFIX::" when idPrefix is non-empty', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true, false, '2');

    assert.equal(info.id, '2::test-model-deepseek');
  });

  test('prefixes qualified model id with group alias as prefix', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true, false, 'MyGroup');

    assert.equal(info.id, 'MyGroup::test-model-deepseek');
  });

  test('returns hasKey=true return no warning icon', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true);

    assert.equal(info.statusIcon, undefined);
  });

  test('returns hasKey=false return warning icon', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, false);

    assert.ok(info.statusIcon instanceof vscode.ThemeIcon);
    assert.equal((info.statusIcon as vscode.ThemeIcon).id, 'warning');
  });

  test('hasKey=false return tooltip contains auth.noKeyTooltip', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, false);

    assert.ok(info.tooltip!.includes('auth.noKeyTooltip'));
  });

  test('visionProxy overrides imageInput capability', () => {
    const model = makeTestModel({ imageInput: false });
    const info = buildChatInfo(model, true, true); // hasVisionProxy = true

    assert.equal(info.capabilities!.imageInput, true);
  });

  test('passes through maxInputTokens and maxOutputTokens from model', () => {
    const model = makeTestModel({ maxInputTokens: 888, maxOutputTokens: 444 });
    const info = buildChatInfo(model, true);

    assert.equal(info.maxInputTokens, 888);
    assert.equal(info.maxOutputTokens, 444);
  });

  test('toolCalling passes through maxTools value from model ability', () => {
    const model = makeTestModel({ maxTools: 5 });
    const info = buildChatInfo(model, true);

    assert.equal(info.capabilities!.toolCalling, 5);
  });

  test('multiple calls with same idPrefix produce distinct qualified ids for different models', () => {
    const modelA = makeTestModel({ id: 'model-a', label: 'Model A', family: 'family-a' });
    const modelB = makeTestModel({ id: 'model-b', label: 'Model B', family: 'family-b' });

    const infoA = buildChatInfo(modelA, true, false, '2');
    const infoB = buildChatInfo(modelB, true, false, '2');

    assert.equal(infoA.id, '2::model-a-deepseek');
    assert.equal(infoB.id, '2::model-b-deepseek');
    assert.notEqual(infoA.id, infoB.id);
  });

  test('idPrefix=empty string preserves qualified id without separator', () => {
    const model = makeTestModel({ id: 'some-model' });
    const info = buildChatInfo(model, true, false, '');

    assert.equal(info.id, 'some-model-deepseek');
    assert.ok(!info.id.includes('::'));
  });

  suite('pricing', () => {
    const USD_PRICING = Object.freeze({
      USD: { cacheHitInput: 0.01, cacheMissInput: 0.02, output: 0.03 },
      CNY: { cacheHitInput: 0.07, cacheMissInput: 0.14, output: 0.28 },
    });

    const CNY_ONLY_PRICING = Object.freeze({
      CNY: { cacheHitInput: 1, cacheMissInput: 2, output: 3 },
    });

    test('emits CNY cost fields when currency is CNY', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.inputCost, '¥0.14');
      assert.equal(info.outputCost, '¥0.28');
      assert.equal(info.cacheCost, '¥0.07');
    });

    test('emits USD cost fields when currency is USD', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.inputCost, '$0.02');
      assert.equal(info.outputCost, '$0.03');
      assert.equal(info.cacheCost, '$0.01');
    });

    test('emits string price values with symbol prefix', () => {
      const model = makeTestModel({
        pricing: { CNY: { cacheHitInput: '0.42 / 0.84', cacheMissInput: '2.1 / 4.2', output: '8.4 / 16.8' } },
      });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.inputCost, '¥2.1 / 4.2');
      assert.equal(info.outputCost, '¥8.4 / 16.8');
      assert.equal(info.cacheCost, '¥0.42 / 0.84');
    });

    test('falls back to available currency when preferred currency missing', () => {
      const model = makeTestModel({ pricing: CNY_ONLY_PRICING });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.inputCost, '¥2');
      assert.equal(info.outputCost, '¥3');
      assert.equal(info.cacheCost, '¥1');
    });

    test('emits no cost fields when pricing is undefined', () => {
      const model = makeTestModel({ pricing: undefined });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.inputCost, undefined);
      assert.equal(info.outputCost, undefined);
      assert.equal(info.cacheCost, undefined);
    });

    test('emits no cost fields when pricingCurrency is undefined', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', undefined);

      assert.equal(info.inputCost, undefined);
      assert.equal(info.outputCost, undefined);
      assert.equal(info.cacheCost, undefined);
    });

    test('emits priceCategory when set on model', () => {
      const model = makeTestModel({ pricing: USD_PRICING, priceCategory: 'low' });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.priceCategory, 'low');
    });

    test('emits priceCategory even when pricing is undefined', () => {
      const model = makeTestModel({ pricing: undefined, priceCategory: 'high' });
      const info = buildChatInfo(model, true);

      assert.equal(info.priceCategory, 'high');
      assert.equal(info.inputCost, undefined);
    });

    test('emits priceCategory even when pricingCurrency is undefined', () => {
      const model = makeTestModel({ pricing: USD_PRICING, priceCategory: 'medium' });
      const info = buildChatInfo(model, true, false, '', undefined);

      assert.equal(info.priceCategory, 'medium');
      assert.equal(info.inputCost, undefined);
    });

    test('emits no priceCategory when not set', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.priceCategory, undefined);
    });

    test('emits isBYOK=true and isUserSelectable=true', () => {
      const model = makeTestModel();
      const info = buildChatInfo(model, true);

      assert.equal(info.isBYOK, true);
      assert.equal(info.isUserSelectable, true);
    });
  });
});

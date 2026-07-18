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
    (key: string, ...args: string[]) => [key, ...args].join(': '),
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
      USD: { default: { cacheInput: 0.01, input: 0.02, output: 0.03 } },
      CNY: { default: { cacheInput: 0.07, input: 0.14, output: 0.28 } },
    });

    const CNY_ONLY_PRICING = Object.freeze({
      CNY: { default: { cacheInput: 1, input: 2, output: 3 } },
    });

    test('emits CNY cost fields as numbers when currency is CNY', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.inputCost, 0.14);
      assert.equal(info.outputCost, 0.28);
      assert.equal(info.cacheCost, 0.07);
    });

    test('emits USD cost fields as numbers when currency is USD', () => {
      const model = makeTestModel({ pricing: USD_PRICING });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.inputCost, 0.02);
      assert.equal(info.outputCost, 0.03);
      assert.equal(info.cacheCost, 0.01);
    });

    test('emits cost fields from pricing object', () => {
      const model = makeTestModel({
        pricing: { CNY: { default: { cacheInput: 0.42, input: 2.1, output: 8.4 } } },
      });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.inputCost, 2.1);
      assert.equal(info.outputCost, 8.4);
      assert.equal(info.cacheCost, 0.42);
    });

    test('falls back to available currency when preferred currency missing', () => {
      const model = makeTestModel({ pricing: CNY_ONLY_PRICING });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.equal(info.inputCost, 2);
      assert.equal(info.outputCost, 3);
      assert.equal(info.cacheCost, 1);
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

  suite('category (balance & credits unit)', () => {
    const PRICING = Object.freeze({
      CNY: { default: { cacheInput: 0.07, input: 0.14, output: 0.28 } },
    });

    test('emits category with balance when provided', () => {
      const model = makeTestModel({ pricing: PRICING });
      const info = buildChatInfo(model, true, false, '', 'CNY', '¥19.20');

      assert.ok(info.category!.includes('balance.label'));
      assert.ok(info.category!.includes('¥19.20'));
    });

    test('emits undefined category when balance not provided', () => {
      const model = makeTestModel({ pricing: PRICING });
      const info = buildChatInfo(model, true, false, '');

      assert.equal(info.category, undefined);
    });

    test('emits credits unit when pricing and pricingCurrency present and billing is api', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test', billing: 'api' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('CNY'));
    });

    test('emits credits unit when billing is undefined (defaults to api)', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'USD');

      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('USD'));
    });

    test('does NOT emit credits unit when billing is plan', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test', billing: 'plan' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.category, undefined);
    });

    test('does NOT emit credits unit when pricing is undefined', () => {
      const model = makeTestModel({
        pricing: undefined,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'CNY');

      assert.equal(info.category, undefined);
    });

    test('does NOT emit credits unit when pricingCurrency is undefined', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', undefined);

      assert.equal(info.category, undefined);
    });

    test('emits both balance and credits unit joined by space', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'CNY', '¥19.20');

      assert.ok(info.category!.includes('balance.label'));
      assert.ok(info.category!.includes('¥19.20'));
      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('CNY'));
      // Parts are joined by space, not comma
      assert.ok(info.category!.includes(' '));
      assert.ok(!info.category!.includes(','));
    });

    test('balanceCurrency from API response overrides pricingCurrency', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      // pricingCurrency says USD but balanceCurrency says CNY from API response
      const info = buildChatInfo(model, true, false, '', 'USD', '¥19.20', 'CNY');

      assert.ok(info.category!.includes('balance.label'));
      assert.ok(info.category!.includes('¥19.20'));
      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('CNY'));
      assert.ok(!info.category!.includes('USD'));
    });

    test('balanceCurrency used for credits unit even without balance display', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      // No balance string, but balanceCurrency from API response still drives credits unit
      const info = buildChatInfo(model, true, false, '', 'USD', undefined, 'CNY');

      assert.ok(!info.category!.includes('balance.label'));
      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('CNY'));
    });

    test('emits planUsage in category when provided for plan billing', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test', billing: 'plan' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', undefined, undefined, undefined, '5H: 97/100');

      assert.ok(info.category!.includes('5H: 97/100'));
      // plan billing should NOT emit credits unit
      assert.ok(!info.category!.includes('balance.creditsUnit'));
    });

    test('planUsage joined with balance when both present', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', 'CNY', '¥19.20', undefined, '5H: 97/100');

      assert.ok(info.category!.includes('balance.label'));
      assert.ok(info.category!.includes('¥19.20'));
      assert.ok(info.category!.includes('balance.creditsUnit'));
      assert.ok(info.category!.includes('5H: 97/100'));
    });

    test('planUsage is undefined in category when not provided', () => {
      const model = makeTestModel({
        pricing: PRICING,
        endpoint: { id: 'test-ep', label: 'Test', billing: 'plan' } as ModelItem['endpoint'],
      });
      const info = buildChatInfo(model, true, false, '', undefined, undefined, undefined, undefined);

      assert.equal(info.category, undefined);
    });
  });
});

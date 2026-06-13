import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { validateCustomModelArray } from '../../../src/custom/loader';
import type { CustomModelEntry } from '../../../src/custom/loader';
import type { ThinkingConfig } from '../../../src/providers/types';

function makeEntry(overrides?: Partial<CustomModelEntry>): CustomModelEntry {
  return {
    id: 'my-model',
    label: 'My Model',
    provider: 'qwen',
    endpoint: ['cn'],
    ...overrides,
  };
}

function makeThinkingConfig(): ThinkingConfig {
  return {
    default: 'high',
    options: [
      { value: 'high', label: 'Think', hint: 'deep', requestFields: {} },
      { value: 'disabled', label: 'None', hint: 'fast', requestFields: {} },
    ],
  };
}

suite('custom/loader validateCustomModelArray()', () => {

  test('valid single entry passes', () => {
    assert.deepEqual(validateCustomModelArray([makeEntry()]), []);
  });

  test('valid multiple entries pass', () => {
    assert.deepEqual(
      validateCustomModelArray([makeEntry({ id: 'a' }), makeEntry({ id: 'b' })]),
      [],
    );
  });

  test('valid multiple endpoints passes', () => {
    assert.deepEqual(validateCustomModelArray([makeEntry({ endpoint: ['cn', 'us'] })]), []);
  });

  test('valid single string endpoint passes', () => {
    assert.deepEqual(validateCustomModelArray([makeEntry({ endpoint: 'cn' })]), []);
  });

  test('empty array passes', () => {
    assert.deepEqual(validateCustomModelArray([]), []);
  });

  test('reasoning and imageInput are optional', () => {
    assert.deepEqual(validateCustomModelArray([makeEntry()]), []);
  });

  test('thinking is optional', () => {
    assert.deepEqual(validateCustomModelArray([makeEntry({ thinkingConfig: makeThinkingConfig() })]), []);
  });

  test('non-array fails', () => {
    assert.ok(validateCustomModelArray({}).length > 0);
  });

  test('object instead of array fails', () => {
    assert.ok(validateCustomModelArray({ a: 1 }).length > 0);
  });

  test('missing id fails', () => {
    const m = makeEntry();
    delete (m as unknown as Record<string, unknown>).id;
    const errs = validateCustomModelArray([m]);
    assert.ok(errs.length > 0 && errs[0].includes('[0].id'));
  });

  test('missing label fails', () => {
    const m = makeEntry();
    delete (m as unknown as Record<string, unknown>).label;
    const errs = validateCustomModelArray([m]);
    assert.ok(errs.length > 0 && errs[0].includes('.label'));
  });

  test('missing provider fails', () => {
    const m = makeEntry();
    delete (m as unknown as Record<string, unknown>).provider;
    const errs = validateCustomModelArray([m]);
    assert.ok(errs.length > 0 && errs[0].includes('.provider'));
  });

  test('empty provider fails', () => {
    const errs = validateCustomModelArray([makeEntry({ provider: '' })]);
    assert.ok(errs.length > 0 && errs[0].includes('.provider'));
  });

  test('missing endpoint fails', () => {
    const m = makeEntry();
    delete (m as unknown as Record<string, unknown>).endpoint;
    const errs = validateCustomModelArray([m]);
    assert.ok(errs.length > 0 && errs[0].includes('.endpoint'));
  });

  test('endpoint not string or array fails', () => {
    const errs = validateCustomModelArray([makeEntry({ endpoint: 42 as unknown as string[] })]);
    assert.ok(errs.length > 0 && errs[0].includes('.endpoint'));
  });

  test('empty endpoint string fails', () => {
    const errs = validateCustomModelArray([makeEntry({ endpoint: '' })]);
    assert.ok(errs.length > 0 && errs[0].includes('.endpoint'));
  });

  test('empty endpoint array fails', () => {
    const errs = validateCustomModelArray([makeEntry({ endpoint: [] })]);
    assert.ok(errs.length > 0 && errs[0].includes('.endpoint'));
  });

  test('endpoint array with empty string fails', () => {
    const errs = validateCustomModelArray([makeEntry({ endpoint: ['cn', ''] })]);
    assert.ok(errs.length > 0 && errs[0].includes('.endpoint'));
  });

  // --- Numeric validation ---

  test('non-positive maxInputTokens fails', () => {
    const errs = validateCustomModelArray([makeEntry({ maxInputTokens: 0 })]);
    assert.ok(errs.length > 0 && errs[0].includes('maxInputTokens'));
  });

  test('fractional maxInputTokens fails', () => {
    const errs = validateCustomModelArray([makeEntry({ maxInputTokens: 1.5 })]);
    assert.ok(errs.length > 0 && errs[0].includes('maxInputTokens'));
  });

  test('non-positive maxOutputTokens fails', () => {
    const errs = validateCustomModelArray([makeEntry({ maxOutputTokens: -1 })]);
    assert.ok(errs.length > 0 && errs[0].includes('maxOutputTokens'));
  });

  test('non-positive maxTools fails', () => {
    const errs = validateCustomModelArray([makeEntry({ maxTools: 0 })]);
    assert.ok(errs.length > 0 && errs[0].includes('maxTools'));
  });

  test('non-boolean thinking fails', () => {
    const errs = validateCustomModelArray([makeEntry({ thinking: 'yes' as unknown as boolean })]);
    assert.ok(errs.length > 0 && errs[0].includes('.thinking'));
  });

  test('non-boolean imageInput fails', () => {
    const errs = validateCustomModelArray([makeEntry({ imageInput: 1 as unknown as boolean })]);
    assert.ok(errs.length > 0 && errs[0].includes('.imageInput'));
  });

  test('thinking with missing default fails', () => {
    const errs = validateCustomModelArray([
      makeEntry({
        thinkingConfig: {
          options: [{ value: 'high', label: 'Think', hint: '', requestFields: {} }],
        } as unknown as ThinkingConfig,
      }),
    ]);
    assert.ok(errs.some((e) => e.includes('thinkingConfig.default')));
  });

  test('thinking default not in options fails', () => {
    const errs = validateCustomModelArray([
      makeEntry({
        thinkingConfig: {
          default: 'not-there',
          options: [{ value: 'high', label: 'Think', hint: '', requestFields: {} }],
        } as unknown as ThinkingConfig,
      }),
    ]);
    assert.ok(errs.some((e) => e.includes('default')));
  });

  test('thinking options must be array', () => {
    const errs = validateCustomModelArray([
      makeEntry({
        thinkingConfig: { default: 'high', options: 'not-array' } as unknown as ThinkingConfig,
      }),
    ]);
    assert.ok(errs.some((e) => e.includes('options')));
  });


  test('thinking option missing value fails', () => {
    const errs = validateCustomModelArray([
      makeEntry({
        thinkingConfig: {
          default: 'high',
          options: [
            { value: 'high', label: 'Think', hint: '', requestFields: {} },
            { label: 'NoValue', hint: '', requestFields: {} } as unknown as ThinkingConfig['options'][0],
          ],
        },
      }),
    ]);
    assert.ok(errs.some((e) => e.includes('.value')));
  });

  test('non-object entry fails', () => {
    const errs = validateCustomModelArray(['not-an-object' as unknown as CustomModelEntry]);
    assert.ok(errs.length > 0 && errs[0].includes('[0]'));
  });

  test('multiple entries report errors for each', () => {
    const errs = validateCustomModelArray([makeEntry({ id: '' }), makeEntry({ label: '' })]);
    assert.equal(errs.length, 2);
    assert.ok(errs[0].includes('[0]'));
    assert.ok(errs[1].includes('[1]'));
  });
});

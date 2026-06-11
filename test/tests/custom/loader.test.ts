import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { validateModelJson } from '../../../src/custom/loader';
import type { ModelJsonModule } from '../../../src/providers/loader';
import type { ThinkingConfig } from '../../../src/providers/types';

function makeModule(overrides?: Partial<ModelJsonModule>): ModelJsonModule {
  return {
    providerId: 'qwen',
    endpointId: 'cn',
    models: [
      {
        id: 'my-model',
        label: 'My Model',
        apiId: 'my-model',
        family: 'custom',
        version: '1',
        maxInputTokens: 100_000,
        maxOutputTokens: 50_000,
        ability: { reasoning: true, imageInput: false },
      },
    ],
    ...overrides,
  } as ModelJsonModule;
}

function makeThinking(): ThinkingConfig {
  return {
    default: 'high',
    options: [
      { value: 'high', label: 'Think', hint: 'deep', requestFields: {} },
      { value: 'disabled', label: 'None', hint: 'fast', requestFields: {} },
    ],
  };
}

suite('custom/loader validateModelJson()', () => {

  test('valid minimal module passes', () => {
    const m = makeModule();
    assert.deepEqual(validateModelJson(m), []);
  });

  test('valid module with thinking passes', () => {
    const m = makeModule({ thinking: makeThinking() });
    assert.deepEqual(validateModelJson(m), []);
  });

  test('module without thinking passes', () => {
    const m = makeModule();
    delete (m as unknown as Record<string, unknown>).thinking;
    assert.deepEqual(validateModelJson(m), []);
  });

  test('ability is optional', () => {
    const m = makeModule({
      models: [{ id: 'm', label: 'M', apiId: 'm' }],
    });
    assert.deepEqual(validateModelJson(m), []);
  });

  test('missing providerId fails', () => {
    const m = makeModule();
    delete (m as unknown as Record<string, unknown>).providerId;
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('providerId')));
  });

  test('missing endpointId fails', () => {
    const m = makeModule();
    delete (m as unknown as Record<string, unknown>).endpointId;
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('endpointId')));
  });

  test('empty providerId fails', () => {
    const m = makeModule({ providerId: '' });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('providerId')));
  });

  test('missing models array fails', () => {
    const m = makeModule();
    delete (m as unknown as Record<string, unknown>).models;
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('models')));
  });

  test('missing model id fails', () => {
    const m = makeModule({
      models: [{ label: 'L', apiId: 'a' } as unknown as ModelJsonModule['models'][0]],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('models[0].id'));
  });

  test('missing model label fails', () => {
    const m = makeModule({
      models: [{ id: 'x', apiId: 'a' } as unknown as ModelJsonModule['models'][0]],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('.label'));
  });

  test('missing model apiId fails', () => {
    const m = makeModule({
      models: [{ id: 'x', label: 'L' } as unknown as ModelJsonModule['models'][0]],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('.apiId'));
  });

  test('non-positive maxInputTokens fails', () => {
    const m = makeModule({
      models: [{ id: 'x', label: 'L', apiId: 'a', maxInputTokens: 0 }],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('maxInputTokens'));
  });

  test('fractional maxInputTokens fails', () => {
    const m = makeModule({
      models: [{ id: 'x', label: 'L', apiId: 'a', maxInputTokens: 1.5 }],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('maxInputTokens'));
  });

  test('non-boolean ability.reasoning fails', () => {
    const m = makeModule({
      models: [
        { id: 'x', label: 'L', apiId: 'a', ability: { reasoning: 'yes' } } as unknown as ModelJsonModule['models'][0],
      ],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('reasoning')));
  });

  test('non-object model entry fails', () => {
    const m = makeModule({
      models: ['not-an-object'] as unknown as ModelJsonModule['models'],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('models[0]'));
  });

  test('thinking with missing default fails', () => {
    const m = makeModule({
      thinking: {
        options: [{ value: 'high', label: 'Think', hint: '', requestFields: {} }],
      } as unknown as ThinkingConfig,
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('thinking.default')));
  });

  test('thinking default not in options fails', () => {
    const m = makeModule({
      thinking: {
        default: 'not-there',
        options: [{ value: 'high', label: 'Think', hint: '', requestFields: {} }],
      } as unknown as ThinkingConfig,
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('default')));
  });

  test('thinking options must be array', () => {
    const m = makeModule({
      thinking: { default: 'high', options: 'not-array' } as unknown as ThinkingConfig,
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('options')));
  });

  test('thinking option missing value fails', () => {
    const m = makeModule({
      thinking: {
        default: 'high',
        options: [
          { value: 'high', label: 'Think', hint: '', requestFields: {} },
          { label: 'None', hint: '', requestFields: {} } as unknown as ThinkingConfig['options'][0],
        ],
      },
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('.value')));
  });

  test('thinking option missing label fails', () => {
    const m = makeModule({
      thinking: {
        default: 'high',
        options: [
          { value: 'high', label: 'Think', hint: '', requestFields: {} },
          { value: 'disabled', hint: '', requestFields: {} } as unknown as ThinkingConfig['options'][0],
        ],
      },
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('.label')));
  });

  test('model-level thinking with missing default fails', () => {
    const m = makeModule({
      models: [
        {
          id: 'x',
          label: 'L',
          apiId: 'a',
          thinking: {
            options: [{ value: 'high', label: 'Think', hint: '', requestFields: {} }],
          } as unknown as ThinkingConfig,
        },
      ],
    });
    const errs = validateModelJson(m);
    assert.ok(errs.length > 0);
    assert.ok(errs.some((e) => e.includes('.thinking')));
  });

  test('empty models array passes', () => {
    const m = makeModule({ models: [] });
    assert.deepEqual(validateModelJson(m), []);
  });

  test('multiple models report errors for each', () => {
    const m = makeModule({
      models: [
        { id: '', label: 'L', apiId: 'a' } as unknown as ModelJsonModule['models'][0],
        { id: 'y', label: '', apiId: 'b' } as unknown as ModelJsonModule['models'][0],
      ],
    });
    const errs = validateModelJson(m);
    assert.equal(errs.length, 2);
    assert.ok(errs[0].includes('models[0]'));
    assert.ok(errs[1].includes('models[1]'));
  });
});

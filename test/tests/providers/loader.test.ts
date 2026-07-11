import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { backfillModel } from '../../../src/providers/loader';
import type { ModelItem, ThinkingConfig } from '../../../src/providers/types';

function makeModel(overrides?: Partial<ModelItem>): ModelItem {
  return {
    id: 'test-model',
    label: 'Test',
    apiId: 'test',
    family: 'test',
    version: '1',
    maxInputTokens: 1000,
    maxOutputTokens: 1000,
    ability: { maxTools: 8, imageInput: false, reasoning: true },
    source: 'builtin' as const,
    detailKey: 'model.test.detail',
    provider: { id: 'test', label: 'Test', source: 'builtin' as const,
    detailKey: 'p.detail', url: 'https://example.com' },
    ...overrides,
  } as ModelItem;
}

function adaptiveDisabledThinking(): ThinkingConfig {
  return {
    default: 'adaptive',
    options: [
      { value: 'adaptive', label: 'Think', hint: 'auto',
        requestFields: { enable_thinkingConfig: true } },
      { value: 'disabled', label: 'None', hint: 'no think',
        requestFields: { enable_thinkingConfig: false } },
    ],
  };
}

suite('providers/loader backfillModel()', () => {
  test('does nothing when model already has requestExtras', () => {
    const orig = () => ({ x: 1 });
    const m = makeModel({ requestExtras: orig, thinkingConfig: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.strictEqual(m.requestExtras, orig);
  });

  test('generates requestExtras from thinking config', () => {
    const m = makeModel({ thinkingConfig: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.ok(m.requestExtras !== undefined);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'disabled' }), { enable_thinkingConfig: false });
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'adaptive' }), { enable_thinkingConfig: true });
  });

  test('requestExtras defaults to default option when no match', () => {
    const m = makeModel({ thinkingConfig: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'unknown' }), { enable_thinkingConfig: true });
  });

  test('requestExtras defaults to default option on undefined config', () => {
    const m = makeModel({ thinkingConfig: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!(undefined), { enable_thinkingConfig: true });
  });

  test('generates configSchema from thinking config', () => {
    const m = makeModel({ thinkingConfig: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.ok(m.configSchema !== undefined);
    const schema = m.configSchema!() as Record<string, unknown>;
    assert.ok(schema.properties);
    const props = schema.properties as Record<string, unknown>;
    const thinkingMode = props.thinkingMode as Record<string, unknown>;
    assert.equal(thinkingMode.default, 'adaptive');
    assert.deepEqual(thinkingMode.enum, ['adaptive', 'disabled']);
  });

  test('does nothing when no thinking config', () => {
    const m = makeModel();
    backfillModel(m);
    assert.equal(m.requestExtras, undefined);
    assert.equal(m.configSchema, undefined);
  });

  test('generates createContentParser from thinkingTag', () => {
    const m = makeModel({ thinkingTag: 'think' });
    backfillModel(m);
    assert.ok(m.createContentParser !== undefined);
    const parser = m.createContentParser!();
    assert.ok(parser !== undefined);
  });

  test('does not overwrite existing createContentParser', () => {
    const orig = () => undefined;
    const m = makeModel({ createContentParser: orig, thinkingTag: 'think' });
    backfillModel(m);
    assert.strictEqual(m.createContentParser, orig);
  });
});

suite('providers/loader ThinkingConfig — multi-value (DeepSeek style)', () => {
  const dsThinking: ThinkingConfig = {
    default: 'high',
    options: [
      { value: 'high', label: 'High', hint: 'daily',
        requestFields: { thinkingConfig: { type: 'enabled' }, reasoning_effort: 'high' } },
      { value: 'max', label: 'Max', hint: 'hard problems',
        requestFields: { thinkingConfig: { type: 'enabled' }, reasoning_effort: 'max' } },
      { value: 'none', label: 'None', hint: 'no think',
        requestFields: { thinkingConfig: { type: 'disabled' } } },
    ],
  };

  test('high to thinking enabled + reasoning_effort high', () => {
    const m = makeModel({ thinkingConfig: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'high' }),
      { thinkingConfig: { type: 'enabled' }, reasoning_effort: 'high' });
  });

  test('max to thinking enabled + reasoning_effort max', () => {
    const m = makeModel({ thinkingConfig: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'max' }),
      { thinkingConfig: { type: 'enabled' }, reasoning_effort: 'max' });
  });

  test('none to thinking disabled', () => {
    const m = makeModel({ thinkingConfig: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'none' }),
      { thinkingConfig: { type: 'disabled' } });
  });
});

suite('providers/loader ThinkingConfig — three-value (Moonshot K2.6 style)', () => {
  const k26Thinking: ThinkingConfig = {
    default: 'enabled',
    options: [
      { value: 'enabled', label: 'On', hint: 'standard',
        requestFields: { thinkingConfig: { type: 'enabled' } } },
      { value: 'enabled_keep', label: 'Keep', hint: 'multi-turn',
        requestFields: { thinkingConfig: { type: 'enabled', keep: 'all' } } },
      { value: 'disabled', label: 'Off', hint: 'fastest',
        requestFields: { thinkingConfig: { type: 'disabled' } } },
    ],
  };

  test('enabled_keep to thinking enabled with keep:all', () => {
    const m = makeModel({ thinkingConfig: k26Thinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'enabled_keep' }),
      { thinkingConfig: { type: 'enabled', keep: 'all' } });
  });

  test('disabled to thinking disabled', () => {
    const m = makeModel({ thinkingConfig: k26Thinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'disabled' }),
      { thinkingConfig: { type: 'disabled' } });
  });
});

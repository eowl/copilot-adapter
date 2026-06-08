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
    ability: { maxTools: 8, acceptsImages: false, reasoning: true },
    detailKey: 'model.test.detail',
    provider: { id: 'test', label: 'Test', detailKey: 'p.detail', url: 'https://example.com' },
    ...overrides,
  } as ModelItem;
}

function adaptiveDisabledThinking(): ThinkingConfig {
  return {
    default: 'adaptive',
    options: [
      { value: 'adaptive', label: 'Think', hint: 'auto',
        requestFields: { enable_thinking: true } },
      { value: 'disabled', label: 'None', hint: 'no think',
        requestFields: { enable_thinking: false } },
    ],
  };
}

suite('providers/loader backfillModel()', () => {
  test('does nothing when model already has requestExtras', () => {
    const orig = () => ({ x: 1 });
    const m = makeModel({ requestExtras: orig, thinking: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.strictEqual(m.requestExtras, orig);
  });

  test('generates requestExtras from thinking config', () => {
    const m = makeModel({ thinking: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.ok(m.requestExtras !== undefined);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'disabled' }), { enable_thinking: false });
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'adaptive' }), { enable_thinking: true });
  });

  test('requestExtras defaults to default option when no match', () => {
    const m = makeModel({ thinking: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'unknown' }), { enable_thinking: true });
  });

  test('requestExtras defaults to default option on undefined config', () => {
    const m = makeModel({ thinking: adaptiveDisabledThinking() });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!(undefined), { enable_thinking: true });
  });

  test('generates configSchema from thinking config', () => {
    const m = makeModel({ thinking: adaptiveDisabledThinking() });
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

  test('generates createContentParser from contentTag', () => {
    const m = makeModel({ contentTag: 'think' });
    backfillModel(m);
    assert.ok(m.createContentParser !== undefined);
    const parser = m.createContentParser!();
    assert.ok(parser !== undefined);
  });

  test('does not overwrite existing createContentParser', () => {
    const orig = () => undefined;
    const m = makeModel({ createContentParser: orig, contentTag: 'think' });
    backfillModel(m);
    assert.strictEqual(m.createContentParser, orig);
  });
});

suite('providers/loader ThinkingConfig — multi-value (DeepSeek style)', () => {
  const dsThinking: ThinkingConfig = {
    default: 'high',
    options: [
      { value: 'high', label: 'High', hint: 'daily',
        requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'high' } },
      { value: 'max', label: 'Max', hint: 'hard problems',
        requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'max' } },
      { value: 'none', label: 'None', hint: 'no think',
        requestFields: { thinking: { type: 'disabled' } } },
    ],
  };

  test('high → thinking enabled + reasoning_effort high', () => {
    const m = makeModel({ thinking: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'high' }),
      { thinking: { type: 'enabled' }, reasoning_effort: 'high' });
  });

  test('max → thinking enabled + reasoning_effort max', () => {
    const m = makeModel({ thinking: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'max' }),
      { thinking: { type: 'enabled' }, reasoning_effort: 'max' });
  });

  test('none → thinking disabled', () => {
    const m = makeModel({ thinking: dsThinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'none' }),
      { thinking: { type: 'disabled' } });
  });
});

suite('providers/loader ThinkingConfig — three-value (Moonshot K2.6 style)', () => {
  const k26Thinking: ThinkingConfig = {
    default: 'enabled',
    options: [
      { value: 'enabled', label: 'On', hint: 'standard',
        requestFields: { thinking: { type: 'enabled' } } },
      { value: 'enabled_keep', label: 'Keep', hint: 'multi-turn',
        requestFields: { thinking: { type: 'enabled', keep: 'all' } } },
      { value: 'disabled', label: 'Off', hint: 'fastest',
        requestFields: { thinking: { type: 'disabled' } } },
    ],
  };

  test('enabled_keep → thinking enabled with keep:all', () => {
    const m = makeModel({ thinking: k26Thinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'enabled_keep' }),
      { thinking: { type: 'enabled', keep: 'all' } });
  });

  test('disabled → thinking disabled', () => {
    const m = makeModel({ thinking: k26Thinking });
    backfillModel(m);
    assert.deepEqual(m.requestExtras!({ thinkingMode: 'disabled' }),
      { thinking: { type: 'disabled' } });
  });
});

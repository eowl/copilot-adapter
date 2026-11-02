import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MINIMAX, MM_MODELS } from '../../../src/providers/minimax';
import { ThinkTagParser } from '../../../src/providers/parsers/tag';
import { backfillModel } from '../../../src/providers/loader';
import { resolveTrait } from '../../../src/providers/utils';
import type { ModelItem } from '../../../src/providers/types';

function reasoningModel(): ModelItem {
  const m = MM_MODELS.find((m) => m.thinking)! as ModelItem;
  backfillModel(m);
  return m;
}

suite('providers/minimax model.createContentParser()', () => {
  test('returns a ThinkTagParser for reasoning models', () => {
    const parser = reasoningModel().createContentParser!();
    assert.ok(parser instanceof ThinkTagParser, `Expected ThinkTagParser, got: ${parser}`);
  });

  test('the returned parser processes <think> tags correctly', () => {
    const parser = reasoningModel().createContentParser!()!;
    const events = [...parser.feed('<think>thinking</think>reply'), ...parser.flush()];
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'thinking' },
      { kind: 'content', text: 'reply' },
    ]);
  });
});

suite('providers/minimax model list', () => {
  test('has 2 models', () => {
    assert.equal(MM_MODELS.length, 2);
  });

  test('first model is MiniMax M3', () => {
    assert.equal(MM_MODELS[0].label, 'MiniMax M3');
  });

  test('MINIMAX provider id is "minimax"', () => {
    assert.equal(MINIMAX.id, 'minimax');
  });

  test('M3 model has thinking config', () => {
    const m3 = MM_MODELS.find((m) => m.label === 'MiniMax M3')!;
    backfillModel(m3);
    assert.ok(m3.thinkingConfig !== undefined);
    assert.equal(m3.thinkingConfig!.default, 'adaptive');
    assert.ok(m3.requestExtras !== undefined);
    assert.ok(m3.configSchema !== undefined);
  });

  test('M3 thinking resolves via think tag, not a delta field', () => {
    const m3 = MM_MODELS.find((m) => m.label === 'MiniMax M3')!;
    backfillModel(m3);
    assert.equal(m3.thinkingTag, 'think');
    assert.ok(m3.createContentParser!() instanceof ThinkTagParser);
    assert.equal(resolveTrait(m3, 'thinkingField'), undefined);
  });

  test('M3.1 Flash thinking resolves via reasoning_content field', () => {
    const flash = MM_MODELS.find((m) => m.label === 'MiniMax M3.1 Flash')!;
    backfillModel(flash);
    assert.equal(resolveTrait(flash, 'thinkingField'), 'reasoning_content');
    assert.equal(flash.thinkingTag, undefined);
    assert.equal(flash.createContentParser, undefined);
  });
});

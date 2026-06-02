import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MINIMAX, MM_MODELS } from '../../../src/providers/minimax';
import { ThinkTagParser } from '../../../src/providers/parsers/tag';
import type { Model } from '../../../src/providers/types';

function reasoningModel(): Model {
  return MM_MODELS.find((m) => m.ability.reasoning)! as Model;
}

function nonReasoningModel(): Model {
  return MM_MODELS.find((m) => !m.ability.reasoning)! as Model;
}

suite('providers/minimax — model.requestExtras()', () => {
  const requestExtras = reasoningModel().requestExtras!;

  test('tier "off" → thinking disabled', () => {
    const result = requestExtras({ thinkingBudget: 'off' });
    assert.deepEqual(result, { thinking: { type: 'disabled' } });
  });

  test('tier "standard" → thinking enabled, budget_tokens = 8000', () => {
    const result = requestExtras({ thinkingBudget: 'standard' });
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('tier "deep" → thinking enabled, budget_tokens = 80000', () => {
    const result = requestExtras({ thinkingBudget: 'deep' });
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 80000 } });
  });

  test('unknown tier defaults to "standard"', () => {
    const result = requestExtras({ thinkingBudget: 'extreme' });
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('undefined thinkingBudget defaults to "standard"', () => {
    const result = requestExtras({});
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('non-reasoning model has no requestExtras', () => {
    assert.equal(nonReasoningModel().requestExtras, undefined);
  });
});

suite('providers/minimax — model.createContentParser()', () => {
  test('returns a ThinkTagParser for reasoning models', () => {
    const parser = reasoningModel().createContentParser!();
    assert.ok(parser instanceof ThinkTagParser, `Expected ThinkTagParser, got: ${parser}`);
  });

  test('non-reasoning model has no createContentParser', () => {
    assert.equal(nonReasoningModel().createContentParser, undefined);
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

suite('providers/minimax — model list', () => {
  test('has 9 models', () => {
    assert.equal(MM_MODELS.length, 9);
  });

  test('first model is minimax-text-01', () => {
    assert.equal(MM_MODELS[0].id, 'minimax-text-01');
  });

  test('MINIMAX provider id is "minimax"', () => {
    assert.equal(MINIMAX.id, 'minimax');
  });
});

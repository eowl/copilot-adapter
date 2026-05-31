import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MINIMAX } from '../../../src/providers/minimax';
import { ThinkTagParser } from '../../../src/providers/parsers/tag';
import type { Model } from '../../../src/providers/types';

/** A reasoning-capable model stub */
function reasoningModel(): Model {
  return MINIMAX.models.find((m) => m.ability.reasoning)! as Model;
}

/** A non-reasoning model stub */
function nonReasoningModel(): Model {
  return MINIMAX.models.find((m) => !m.ability.reasoning)! as Model;
}

suite('providers/minimax — MINIMAX.requestExtras()', () => {
  // requestExtras is defined on MINIMAX; the Provider interface marks it optional
  const requestExtras = MINIMAX.requestExtras!.bind(MINIMAX);

  test('tier "off" → thinking disabled', () => {
    const result = requestExtras({ thinkingBudget: 'off' }, reasoningModel());
    assert.deepEqual(result, { thinking: { type: 'disabled' } });
  });

  test('tier "standard" → thinking enabled, budget_tokens = 8000', () => {
    const result = requestExtras({ thinkingBudget: 'standard' }, reasoningModel());
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('tier "deep" → thinking enabled, budget_tokens = 80000', () => {
    const result = requestExtras({ thinkingBudget: 'deep' }, reasoningModel());
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 80000 } });
  });

  test('unknown tier defaults to "standard"', () => {
    const result = requestExtras({ thinkingBudget: 'extreme' }, reasoningModel());
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('undefined thinkingBudget defaults to "standard"', () => {
    const result = requestExtras({}, reasoningModel());
    assert.deepEqual(result, { thinking: { type: 'enabled', budget_tokens: 8000 } });
  });

  test('non-reasoning model → empty object', () => {
    const result = requestExtras({ thinkingBudget: 'deep' }, nonReasoningModel());
    assert.deepEqual(result, {});
  });
});

suite('providers/minimax — MINIMAX.createContentParser()', () => {
  test('returns a ThinkTagParser for reasoning models', () => {
    const parser = MINIMAX.createContentParser!(reasoningModel());
    assert.ok(parser instanceof ThinkTagParser, `Expected ThinkTagParser, got: ${parser}`);
  });

  test('returns undefined for non-reasoning models', () => {
    const parser = MINIMAX.createContentParser!(nonReasoningModel());
    assert.equal(parser, undefined);
  });

  test('the returned parser processes <think> tags correctly', () => {
    const parser = MINIMAX.createContentParser!(reasoningModel())!;
    const events = [...parser.feed('<think>thinking</think>reply'), ...parser.flush()];
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'thinking' },
      { kind: 'content', text: 'reply' },
    ]);
  });
});

suite('providers/minimax — model list', () => {
  test('has 9 models', () => {
    assert.equal(MINIMAX.models.length, 9);
  });

  test('first model is minimax-text-01', () => {
    assert.equal(MINIMAX.models[0].id, 'minimax-text-01');
  });

  test('MINIMAX provider id is "minimax"', () => {
    assert.equal(MINIMAX.id, 'minimax');
  });
});

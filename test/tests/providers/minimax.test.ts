import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MINIMAX, MM_MODELS } from '../../../src/providers/minimax';
import { ThinkTagParser } from '../../../src/providers/parsers/tag';
import type { Model } from '../../../src/providers/types';

function reasoningModel(): Model {
  return MM_MODELS.find((m) => m.ability.reasoning)! as Model;
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
  test('has 8 models', () => {
    assert.equal(MM_MODELS.length, 8);
  });

  test('first model is minimax-m2', () => {
    assert.equal(MM_MODELS[0].id, 'minimax-m2');
  });

  test('MINIMAX provider id is "minimax"', () => {
    assert.equal(MINIMAX.id, 'minimax');
  });
});

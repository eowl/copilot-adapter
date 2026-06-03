import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { QWEN, QWEN_MODELS } from '../../../src/providers/qwen';

suite('providers/qwen — model.requestExtras()', () => {
  const requestExtras = QWEN_MODELS[0].requestExtras!;

  test('thinkingMode "disabled" → enable_thinking false', () => {
    const result = requestExtras({ thinkingMode: 'disabled' });
    assert.deepEqual(result, { enable_thinking: false });
  });

  test('thinkingMode "adaptive" → enable_thinking true', () => {
    const result = requestExtras({ thinkingMode: 'adaptive' });
    assert.deepEqual(result, { enable_thinking: true });
  });

  test('undefined modelConfig defaults to enable_thinking true', () => {
    const result = requestExtras(undefined);
    assert.deepEqual(result, { enable_thinking: true });
  });

  test('unknown thinkingMode defaults to enable_thinking true', () => {
    const result = requestExtras({ thinkingMode: 'whatever' });
    assert.deepEqual(result, { enable_thinking: true });
  });

  test('QWEN provider id is "qwen"', () => {
    assert.equal(QWEN.id, 'qwen');
  });

  test('QWEN endpoint points to DashScope compatible-mode', () => {
    assert.equal(QWEN.endpoint, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
  });

  test('QWEN thinkingField is reasoning_content', () => {
    assert.equal(QWEN.thinkingField, 'reasoning_content');
  });

  test('all QWEN models use max_completion_tokens field', () => {
    for (const m of QWEN_MODELS) {
      assert.equal(m.maxTokensField, 'max_completion_tokens', `${m.id}`);
    }
  });

  test('QWEN exposes the expected model ids', () => {
    assert.deepEqual(
      QWEN_MODELS.map((m) => m.id),
      ['qwen3-max', 'qwen-plus', 'qwen-turbo', 'qwen3-coder-plus'],
    );
  });
});

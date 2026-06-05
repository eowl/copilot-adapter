import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { QWEN, QWEN_BASE_MODELS, QWEN_US_MODELS } from '../../../src/providers/qwen';

suite('providers/qwen model.requestExtras()', () => {
  const requestExtras = QWEN_BASE_MODELS[0].requestExtras!;

  test('thinkingMode "disabled": enable_thinking false', () => {
    const result = requestExtras({ thinkingMode: 'disabled' });
    assert.deepEqual(result, { enable_thinking: false });
  });

  test('thinkingMode "adaptive": enable_thinking true', () => {
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

  test('QWEN url points to DashScope compatible-mode', () => {
    assert.equal(QWEN.url, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
  });

  test('QWEN thinkingField is reasoning_content', () => {
    assert.equal(QWEN.thinkingField, 'reasoning_content');
  });

  test('all QWEN models use max_completion_tokens field', () => {
    for (const m of [...QWEN_BASE_MODELS, ...QWEN_US_MODELS]) {
      assert.equal(m.maxTokensField, 'max_completion_tokens', `${m.id}`);
    }
  });

  test('QWEN exposes the expected base model ids', () => {
    assert.deepEqual(
      QWEN_BASE_MODELS.map((m) => m.id),
      [
        'qwen3.7-max',
        'qwen3.7-plus',
        'qwen3.6-max',
        'qwen3.6-plus',
        'qwen3.6-flash',
        'qwen3.5-plus',
        'qwen3.5-flash',
        'qwen3-max',
        'qwen3-coder-plus',
        'qwen3-coder-flash',
      ],
    );
  });

  test('QWEN_US_MODELS contains only the two US-only models', () => {
    assert.deepEqual(
      QWEN_US_MODELS.map((m) => m.id),
      ['qwen-plus-us', 'qwen-flash-us'],
    );
  });

  test('US-only models carry the "(US only)" label suffix', () => {
    assert.equal(QWEN_US_MODELS.length, 2);
    for (const m of QWEN_US_MODELS) {
      assert.match(m.label, /\(US only\)/);
    }
  });
});

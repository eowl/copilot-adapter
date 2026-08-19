import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { QWEN, QWEN_BASE_MODELS, QWEN_US_MODELS, QWEN_3_7_MAX } from '../../../src/providers/qwen';
import { backfillModel } from '../../../src/providers/loader';
import type { ModelItem } from '../../../src/providers/types';

suite('providers/qwen model.requestExtras()', () => {
  const model = QWEN_3_7_MAX;
  backfillModel(model);
  const requestExtras = model.requestExtras!;

  test('model has thinking config', () => {
    assert.ok(model.thinkingConfig !== undefined);
    assert.equal(model.thinkingConfig!.default, 'adaptive');
    assert.equal(model.thinkingConfig!.options.length, 2);
  });

  test('thinkingMode "disabled": enable_thinking false', () => {
    const result = requestExtras({ thinkingMode: 'disabled' });
    assert.deepEqual(result, { enable_thinking: false });
  });

  test('thinkingMode "adaptive": enable_thinking true', () => {
    const result = requestExtras({ thinkingMode: 'adaptive' });
    assert.deepEqual(result, { enable_thinking: true });
  });

  test('undefined modelConfig does not inject fields', () => {
    const result = requestExtras(undefined);
    assert.deepEqual(result, {});
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
    for (const m of [...QWEN_BASE_MODELS, ...QWEN_US_MODELS].filter((m) => m.family === 'qwen')) {
      assert.equal(m.maxTokensField, 'max_completion_tokens', `${m.id}`);
    }
  });

  test('QWEN exposes the expected base model ids', () => {
    assert.deepEqual(
      QWEN_BASE_MODELS.map((m) => m.id),
      [ 
        'qwen3.8-max',
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
      [ 
        'qwen3.8-max',
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
        'qwen-plus-us', 
        'qwen-flash-us', 
        'qwen3.7-max-us', 
        'qwen3.7-plus-us',
        'deepseek-v4-pro',
        'deepseek-v4-flash',
        'deepseek-v4-pro-0813',
        'deepseek-v4-flash-0731',
        'deepseek-v4-pro-us',
        'deepseek-v4-flash-us',
        'glm-5.2-us',
        'glm-5.2',
        'glm-5.1',
        'kimi-k2.7-code',
      ],
    );
  });

  test('US-only models carry the "(US only)" label suffix', () => {
    const usOnly = QWEN_US_MODELS.filter((m) => m.id.endsWith('-us'));
    assert.ok(usOnly.length > 0);
    for (const m of usOnly) {
      assert.match(m.label, /\(US only\)/, `${m.id}`);
    }
  });

  suite('vision models', () => {
    const visionIds = [
      'qwen3.7-plus',
      'qwen3.6-plus',
      'qwen3.6-flash',
      'qwen3.5-plus',
      'qwen3.5-flash',
    ];

    test('accept images', () => {
      for (const id of visionIds) {
        const m = QWEN_BASE_MODELS.find((x) => x.id === id)!;
        assert.equal(m.imageInput, true, `${id} imageInput`);
      }
    });

    test('do NOT have explicit formatImagePart (auto-provided by prepare.ts)', () => {
      for (const id of visionIds) {
        const m = QWEN_BASE_MODELS.find((x) => x.id === id)!;
        assert.equal(m.formatImagePart, undefined, `${id} formatImagePart should be undefined (auto-fallback)`);
      }
    });

    test('have default imageField (undefined, defaults to \"image_url\" in fallback)', () => {
      for (const id of visionIds) {
        const m = QWEN_BASE_MODELS.find((x) => x.id === id)!;
        assert.equal((m as any).imageField, undefined, `${id} imageField defaults to undefined`);
      }
    });
  });

  suite('non-vision models', () => {
    const nonVisionIds = [
      'qwen3.6-max',
      'qwen3-max',
      'qwen3-coder-plus',
      'qwen3-coder-flash',
    ];

    test('do NOT accept images', () => {
      for (const id of nonVisionIds) {
        const m = QWEN_BASE_MODELS.find((x) => x.id === id)!;
        assert.equal(m.imageInput, false, `${id} imageInput`);
      }
    });
  });
});

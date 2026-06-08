import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { QWEN, QWEN_BASE_MODELS, QWEN_US_MODELS } from '../../../src/providers/qwen';
import type { ModelItem } from '../../../src/providers/types';

suite('providers/qwen model.requestExtras()', () => {
  const model = QWEN_BASE_MODELS[0] as ModelItem;
  const requestExtras = model.requestExtras!;

  test('model has thinking config', () => {
    assert.ok(model.thinking !== undefined);
    assert.equal(model.thinking!.default, 'adaptive');
    assert.equal(model.thinking!.options.length, 2);
  });

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

  test('US-only models do not accept images', () => {
    for (const m of QWEN_US_MODELS) {
      assert.equal(m.ability.acceptsImages, false, `${m.id} acceptsImages`);
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
        assert.equal(m.ability.acceptsImages, true, `${id} acceptsImages`);
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
      'qwen3.7-max',
      'qwen3.6-max',
      'qwen3-max',
      'qwen3-coder-plus',
      'qwen3-coder-flash',
    ];

    test('do NOT accept images', () => {
      for (const id of nonVisionIds) {
        const m = QWEN_BASE_MODELS.find((x) => x.id === id)!;
        assert.equal(m.ability.acceptsImages, false, `${id} acceptsImages`);
      }
    });
  });
});

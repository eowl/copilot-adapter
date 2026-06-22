import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { ZHIPU, ZP_MODELS } from '../../../src/providers/zhipu';
import { backfillModel } from '../../../src/providers/loader';

suite('providers/zhipu', () => {
  const thinkingModel = ZP_MODELS.find((m) => m.label === 'GLM-5.1')!;
  const plainModel = ZP_MODELS.find((m) => m.label === 'GLM-4.5-Air')!;
  backfillModel(thinkingModel);
  backfillModel(plainModel);

  suite('thinking-capable models requestExtras()', () => {
    test('thinking model has thinking config', () => {
      assert.ok(thinkingModel.thinkingConfig !== undefined);
      assert.equal(thinkingModel.thinkingConfig!.default, 'adaptive');
    });

    test('plain model has no thinking config', () => {
      assert.equal(plainModel.thinkingConfig, undefined);
    });

    const requestExtras = thinkingModel.requestExtras!;

    test('thinkingMode "disabled": thinking type disabled', () => {
      assert.deepEqual(requestExtras({ thinkingMode: 'disabled' }), {
        thinking: { type: 'disabled' },
      });
    });

    test('thinkingMode "adaptive": thinking type enabled', () => {
      assert.deepEqual(requestExtras({ thinkingMode: 'adaptive' }), {
        thinking: { type: 'enabled' },
      });
    });

    test('undefined modelConfig defaults to thinking enabled', () => {
      assert.deepEqual(requestExtras(undefined), { thinking: { type: 'enabled' } });
    });

    test('unknown thinkingMode defaults to thinking enabled', () => {
      assert.deepEqual(requestExtras({ thinkingMode: 'whatever' }), {
        thinking: { type: 'enabled' },
      });
    });
  });

  suite('plain models', () => {
    test('have no requestExtras / configSchema', () => {
      assert.equal(plainModel.requestExtras, undefined);
      assert.equal(plainModel.configSchema, undefined);
    });

    test('declare ability.reasoning === false', () => {
      assert.equal(plainModel.thinking, false);
    });
  });

  suite('provider metadata', () => {
    test('id is "zhipu"', () => {
      assert.equal(ZHIPU.id, 'zhipu');
    });

    test('url points to Zhipu paas v4', () => {
      assert.equal(ZHIPU.url, 'https://open.bigmodel.cn/api/paas/v4');
    });

    test('thinkingField is reasoning_content', () => {
      assert.equal(ZHIPU.thinkingField, 'reasoning_content');
    });
  });

  suite('model registry', () => {
    test('exposes the expected ids in screenshot order', () => {
      assert.deepEqual(
        ZP_MODELS.map((m) => m.id),
        [
          'glm-5.2',
          'glm-5.1',
          'glm-5',
          'glm-5-turbo',
          'glm-4.7',
          'glm-4.7-flashx',
          'glm-4.6',
          'glm-4.5-air',
          'glm-4.5-airx',
          'glm-4-long',
          'glm-4-flashx-250414',
          'glm-4.7-flash',
          'glm-4.5-flash',
          'glm-4-flash-250414',
          'glm-5v-turbo',
          'glm-4.6v',
          'glm-ocr',
          'glm-4.1v-thinking-flashx',
          'glm-4.6v-flash',
          'glm-4.1v-thinking-flash',
          'glm-4v-flash',
        ],
      );
    });

    test('thinking-capable models match the documented set', () => {
      const reasoning = ZP_MODELS.filter((m) => m.thinking).map((m) => m.id);
      assert.deepEqual(reasoning, [
        'glm-5.2',
        'glm-5.1',
        'glm-5',
        'glm-5-turbo',
        'glm-4.7',
        'glm-4.6',
        'glm-5v-turbo',
        'glm-4.6v',
        'glm-4.1v-thinking-flashx',
        'glm-4.1v-thinking-flash',
      ]);
    });

    test('vision models accept images', () => {
      const visionIds = [
        'glm-5v-turbo',
        'glm-4.6v',
        'glm-ocr',
        'glm-4.1v-thinking-flashx',
        'glm-4.6v-flash',
        'glm-4.1v-thinking-flash',
        'glm-4v-flash',
      ];
      for (const id of visionIds) {
        const m = ZP_MODELS.find((x) => x.id === id)!;
        assert.equal(m.imageInput, true, `${id} imageInput`);
      }
    });

    test('vision models do NOT have explicit formatImagePart (auto-provided by prepare.ts)', () => {
      const visionIds = [
        'glm-5v-turbo',
        'glm-4.6v',
        'glm-ocr',
        'glm-4.1v-thinking-flashx',
        'glm-4.6v-flash',
        'glm-4.1v-thinking-flash',
        'glm-4v-flash',
      ];
      for (const id of visionIds) {
        const m = ZP_MODELS.find((x) => x.id === id)!;
        assert.equal(m.formatImagePart, undefined, `${id} formatImagePart should be undefined (auto-fallback)`);
      }
    });

    test('vision models have imageField undefined (defaults to \"image_url\")', () => {
      const visionIds = [
        'glm-5v-turbo',
        'glm-4.6v',
        'glm-ocr',
        'glm-4.1v-thinking-flashx',
        'glm-4.6v-flash',
        'glm-4.1v-thinking-flash',
        'glm-4v-flash',
      ];
      for (const id of visionIds) {
        const m = ZP_MODELS.find((x) => x.id === id)!;
        assert.equal((m as any).imageField, undefined, `${id} imageField defaults to undefined`);
      }
    });

    test('text-only models do not accept images', () => {
      const textIds = ZP_MODELS.filter((m) => !m.imageInput).map((m) => m.id);
      assert.deepEqual(textIds, [
        'glm-5.2',
        'glm-5.1',
        'glm-5',
        'glm-5-turbo',
        'glm-4.7',
        'glm-4.7-flashx',
        'glm-4.6',
        'glm-4.5-air',
        'glm-4.5-airx',
        'glm-4-long',
        'glm-4-flashx-250414',
        'glm-4.7-flash',
        'glm-4.5-flash',
        'glm-4-flash-250414',
      ]);
    });
  });
});


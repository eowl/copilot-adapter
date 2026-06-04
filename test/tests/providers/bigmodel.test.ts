import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { BIGMODEL, BM_MODELS } from '../../../src/providers/bigmodel';

suite('providers/bigmodel', () => {
  const thinkingModel = BM_MODELS.find((m) => m.id === 'glm-5.1')!;
  const plainModel = BM_MODELS.find((m) => m.id === 'glm-4.5-air')!;

  suite('thinking-capable models — requestExtras()', () => {
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
      assert.equal(plainModel.ability.reasoning, false);
    });
  });

  suite('provider metadata', () => {
    test('id is "bigmodel"', () => {
      assert.equal(BIGMODEL.id, 'bigmodel');
    });

    test('endpoint points to BigModel paas v4', () => {
      assert.equal(BIGMODEL.endpoint, 'https://open.bigmodel.cn/api/paas/v4');
    });

    test('thinkingField is reasoning_content', () => {
      assert.equal(BIGMODEL.thinkingField, 'reasoning_content');
    });
  });

  suite('model registry', () => {
    test('exposes the expected ids in screenshot order', () => {
      assert.deepEqual(
        BM_MODELS.map((m) => m.id),
        [
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
      const reasoning = BM_MODELS.filter((m) => m.ability.reasoning).map((m) => m.id);
      assert.deepEqual(reasoning, [
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

    test('vision models accept images and provide formatImagePart', () => {
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
        const m = BM_MODELS.find((x) => x.id === id)!;
        assert.equal(m.ability.acceptsImages, true, `${id} acceptsImages`);
        assert.equal(typeof m.formatImagePart, 'function', `${id} formatImagePart`);
      }
    });

    test('text-only models do not accept images', () => {
      const textIds = BM_MODELS.filter((m) => !m.ability.acceptsImages).map((m) => m.id);
      assert.deepEqual(textIds, [
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


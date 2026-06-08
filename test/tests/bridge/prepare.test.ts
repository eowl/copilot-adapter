import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { imagePart } from '../../../src/providers/utils';
import type { ModelItem, ReasoningAbility, NonReasoningAbility } from '../../../src/providers/types';
import type { ModelProvider } from '../../../src/providers/types';

/**
 * Tests the formatImagePart fallback logic used in assembleChatReq():
 *
 *   formatImagePart:
 *     model.formatImagePart ??
 *     (model.ability.imageInput ? imagePart(model.ability.imageField ?? 'image_url') : undefined)
 *
 * This suite validates the expression behavior without needing the full
 * assembleChatReq dependency tree.
 */

function resolveFormatImagePart(model: ModelItem):
  | ((data: Uint8Array, mimeType: string) => Record<string, unknown>)
  | undefined {
  return (
    model.formatImagePart ??
    (model.ability.imageInput ? imagePart(model.ability.imageField ?? 'image_url') : undefined)
  );
}

const fakeProvider: ModelProvider = {
  id: 'fake',
  label: 'Fake',
  detailKey: 'fake.detail',
  url: 'https://fake.example.com',
};

const VISION_ABILITY: ReasoningAbility = {
  reasoning: true,
  imageInput: true,
};

const TEXT_ABILITY: ReasoningAbility = {
  reasoning: true,
  imageInput: false,
};

const NON_REASONING_VISION: NonReasoningAbility = {
  reasoning: false,
  imageInput: true,
};

const fakeData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const fakeMime = 'image/png';

suite('bridge/prepare formatImagePart fallback', () => {
  suite('imageInput: true, no explicit formatImagePart', () => {
    test('default imageField → imagePart("image_url")', () => {
      const model: ModelItem = {
        id: 'm1',
        label: 'M1',
        apiId: 'm1',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: VISION_ABILITY,
        detailKey: 'm1.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      assert.ok(fn, 'should resolve a function');
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_url');
      assert.match((result as any).image_url.url, /^data:image\/png;base64,/);
    });

    test('custom imageField "image" → imagePart("image")', () => {
      const model: ModelItem = {
        id: 'm2',
        label: 'M2',
        apiId: 'm2',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { ...VISION_ABILITY, imageField: 'image' },
        detailKey: 'm2.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      assert.ok(fn, 'should resolve a function');
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image');
      assert.ok((result as any).image?.url !== undefined);
    });

    test('custom imageField "image_file" → imagePart("image_file")', () => {
      const model: ModelItem = {
        id: 'm3',
        label: 'M3',
        apiId: 'm3',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { ...VISION_ABILITY, imageField: 'image_file' },
        detailKey: 'm3.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      assert.ok(fn, 'should resolve a function');
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_file');
      assert.ok((result as any).image_file?.url !== undefined);
    });

    test('non-reasoning vision model also gets fallback', () => {
      const model: ModelItem = {
        id: 'm4',
        label: 'M4',
        apiId: 'm4',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: NON_REASONING_VISION,
        detailKey: 'm4.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      assert.ok(fn, 'non-reasoning vision should still get fallback');
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_url');
    });
  });

  suite('imageInput: false', () => {
    test('no formatImagePart → undefined', () => {
      const model: ModelItem = {
        id: 'tx1',
        label: 'TX1',
        apiId: 'tx1',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: TEXT_ABILITY,
        detailKey: 'tx1.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      assert.equal(fn, undefined);
    });

    test('explicit formatImagePart still honored (override)', () => {
      const customFn = (_data: Uint8Array, _mimeType: string) => ({ type: 'custom' });
      const model: ModelItem = {
        id: 'tx2',
        label: 'TX2',
        apiId: 'tx2',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: TEXT_ABILITY,
        detailKey: 'tx2.detail',
        provider: fakeProvider,
        formatImagePart: customFn,
      };

      const fn = resolveFormatImagePart(model);
      assert.strictEqual(fn, customFn);

      const result = fn!(fakeData, fakeMime);
      assert.deepEqual(result, { type: 'custom' });
    });
  });

  suite('imageInput: true with explicit formatImagePart', () => {
    test('explicit function wins over fallback', () => {
      const customFn = (_data: Uint8Array, _mimeType: string) => ({ type: 'explicit' });
      const model: ModelItem = {
        id: 'ov1',
        label: 'OV1',
        apiId: 'ov1',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: VISION_ABILITY,
        detailKey: 'ov1.detail',
        provider: fakeProvider,
        formatImagePart: customFn,
      };

      const fn = resolveFormatImagePart(model);
      assert.strictEqual(fn, customFn);
      const result = fn!(fakeData, fakeMime);
      assert.deepEqual(result, { type: 'explicit' });
    });
  });

  suite('edge cases', () => {
    test('imageField is empty string, still passed to imagePart', () => {
      const model: ModelItem = {
        id: 'ec1',
        label: 'EC1',
        apiId: 'ec1',
        family: 'fake',
        version: '1',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { ...VISION_ABILITY, imageField: '' },
        detailKey: 'ec1.detail',
        provider: fakeProvider,
      };

      const fn = resolveFormatImagePart(model);
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, '');
    });
  });
});

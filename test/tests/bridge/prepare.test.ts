import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { imagePart } from '../../../src/providers/utils';
import type { ModelItem, ModelProvider } from '../../../src/providers/types';

/**
 * Tests the formatImagePart fallback logic used in assembleChatReq():
 *
 *   formatImagePart:
 *     model.formatImagePart ??
 *     (model.imageInput ? imagePart(model.imageField ?? 'image_url') : undefined)
 */

function resolveFormatImagePart(model: ModelItem):
  | ((data: Uint8Array, mimeType: string) => Record<string, unknown>)
  | undefined {
  return (
    model.formatImagePart ??
    (model.imageInput ? imagePart(model.imageField ?? 'image_url') : undefined)
  );
}

const fakeProvider: ModelProvider = {
  id: 'fake',
  label: 'Fake',
  detailKey: 'fake.detail',
  url: 'https://fake.example.com',
};

const fakeData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const fakeMime = 'image/png';

function makeModel(overrides: Partial<ModelItem>): ModelItem {
  return {
    id: 'm',
    label: 'M',
    apiId: 'm',
    family: 'fake',
    version: '1',
    maxInputTokens: 1000,
    maxOutputTokens: 500,
    thinking: true,
    imageInput: true,
    maxTools: 128,
    source: 'builtin' as const,
    detailKey: 'm.detail',
    provider: fakeProvider,
    ...overrides,
  } as ModelItem;
}

suite('bridge/prepare formatImagePart fallback', () => {
  suite('imageInput: true, no explicit formatImagePart', () => {
    test('default imageField to imagePart("image_url")', () => {
      const model = makeModel({ imageInput: true });
      const fn = resolveFormatImagePart(model);
      assert.ok(fn, 'should resolve a function');
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_url');
      const img = result as Record<string, unknown>;
      assert.ok(typeof img.image_url === 'object');
    });

    test('custom imageField "image"', () => {
      const model = makeModel({ imageInput: true, imageField: 'image' });
      const fn = resolveFormatImagePart(model);
      assert.ok(fn);
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image');
    });

    test('custom imageField "image_file"', () => {
      const model = makeModel({ imageInput: true, imageField: 'image_file' });
      const fn = resolveFormatImagePart(model);
      assert.ok(fn);
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_file');
    });

    test('non-thinking vision model also gets fallback', () => {
      const model = makeModel({ thinking: false, imageInput: true });
      const fn = resolveFormatImagePart(model);
      assert.ok(fn);
      const result = fn!(fakeData, fakeMime);
      assert.equal(result.type, 'image_url');
    });
  });

  suite('imageInput: false', () => {
    test('no formatImagePart to undefined', () => {
      const model = makeModel({ imageInput: false });
      const fn = resolveFormatImagePart(model);
      assert.equal(fn, undefined);
    });

    test('explicit formatImagePart still honored (override)', () => {
      const customFn = (_data: Uint8Array, _mimeType: string) => ({ type: 'custom' });
      const model = makeModel({ imageInput: false, formatImagePart: customFn });
      const fn = resolveFormatImagePart(model);
      assert.strictEqual(fn, customFn);
      const result = fn!(fakeData, fakeMime);
      assert.deepEqual(result, { type: 'custom' });
    });
  });

  suite('imageInput: true with explicit formatImagePart', () => {
    test('explicit function wins over fallback', () => {
      const customFn = (_data: Uint8Array, _mimeType: string) => ({ type: 'explicit' });
      const model = makeModel({ imageInput: true, formatImagePart: customFn });
      const fn = resolveFormatImagePart(model);
      assert.strictEqual(fn, customFn);
      const result = fn!(fakeData, fakeMime);
      assert.deepEqual(result, { type: 'explicit' });
    });
  });

  suite('imageInput: undefined treated as false (text model)', () => {
    test('undefined imageInput resolves to no fallback', () => {
      const model = makeModel({ imageInput: false });
      const fn = resolveFormatImagePart(model);
      assert.equal(fn, undefined);
    });
  });
});

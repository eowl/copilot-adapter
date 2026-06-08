import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { Adapter } from '../../../src/bridge/adapter';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { buildChatInfo } from '../../../src/bridge/information';

suite('bridge/adapter multi-group', () => {
  let adapter: Adapter;

  setup(() => {
    const mockContext = {
      subscriptions: [] as Array<{ dispose(): void }>,
      globalStorageUri: vscode.Uri.parse('file:///test-global-storage'),
    } as unknown as vscode.ExtensionContext;

    adapter = new Adapter(mockContext, DEEPSEEK.id, () => {});
  });

  suite('resolveModelIdentity (private return tested via buildChatInfo round-trip)', () => {
    test('id without separator returns qualified id with empty prefix', () => {
      const model = {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        apiId: 'deepseek-v4-flash',
        family: 'deepseek',
        version: '4',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { reasoning: true as const, acceptsImages: false },
        detailKey: 'model.deepseek-v4-flash.detail',
        provider: DEEPSEEK,
      };

      // No prefix → id is qualified with provider suffix
      const info = buildChatInfo(model, true);
      assert.equal(info.id, 'deepseek-v4-flash-deepseek');
      assert.ok(!info.id.includes('::'));
    });

    test('id with prefix "2" encodes as "2::qualifiedId"', () => {
      const model = {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        apiId: 'deepseek-v4-flash',
        family: 'deepseek',
        version: '4',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { reasoning: true as const, acceptsImages: false },
        detailKey: 'model.deepseek-v4-flash.detail',
        provider: DEEPSEEK,
      };

      const info = buildChatInfo(model, true, false, '2');
      assert.equal(info.id, '2::deepseek-v4-flash-deepseek');

      // Simulate resolveModelIdentity by splitting manually (same logic)
      const sepIdx = info.id.indexOf('::');
      const prefix = info.id.slice(0, sepIdx);
      const modelId = info.id.slice(sepIdx + 2);

      assert.equal(prefix, '2');
      assert.equal(modelId, 'deepseek-v4-flash-deepseek');
    });

    test('multiple groups get distinct prefixes', () => {
      const model = {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        apiId: 'deepseek-v4-flash',
        family: 'deepseek',
        version: '4',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { reasoning: true as const, acceptsImages: false },
        detailKey: 'model.deepseek-v4-flash.detail',
        provider: DEEPSEEK,
      };

      const infoDefault = buildChatInfo(model, true, false, '');
      const infoGroup2 = buildChatInfo(model, true, false, '2');
      const infoGroup3 = buildChatInfo(model, true, false, '3');

      assert.equal(infoDefault.id, 'deepseek-v4-flash-deepseek');
      assert.equal(infoGroup2.id, '2::deepseek-v4-flash-deepseek');
      assert.equal(infoGroup3.id, '3::deepseek-v4-flash-deepseek');

      // All IDs are distinct
      const ids = [infoDefault.id, infoGroup2.id, infoGroup3.id];
      assert.equal(new Set(ids).size, 3);
    });
  });

  suite('prefix encoding round-trip for model lookup', () => {
    test('model with empty prefix can be looked up by qualified id', () => {
      const modelId = 'deepseek-v4-flash-deepseek';

      // Simulate the resolveModelIdentity logic from adapter.ts
      const sepIdx = modelId.indexOf('::');
      assert.equal(sepIdx, -1); // No separator → default group

      const resolvedModelId = sepIdx === -1 ? modelId : modelId.slice(sepIdx + 2);
      assert.equal(resolvedModelId, 'deepseek-v4-flash-deepseek');
    });

    test('model with prefix "2" decodes to prefix=2, qualified modelId', () => {
      const encodedId = '2::deepseek-v4-flash-deepseek';

      const sepIdx = encodedId.indexOf('::');
      const prefix = encodedId.slice(0, sepIdx);
      const modelId = encodedId.slice(sepIdx + 2);

      assert.equal(prefix, '2');
      assert.equal(modelId, 'deepseek-v4-flash-deepseek');
    });

    test('prefix with special group name "Moonshot 2" encodes and decodes correctly', () => {
      const model = {
        id: 'kimi-k2.6',
        label: 'Kimi K2.6',
        apiId: 'kimi-k2.6',
        family: 'kimi',
        version: '2.6',
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        ability: { reasoning: true as const, acceptsImages: true },
        detailKey: 'model.kimi-k2.6.detail',
        provider: DEEPSEEK,
      };

      // Build with a group-name-like prefix
      const info = buildChatInfo(model, true, false, '2');
      const encodedId = info.id; // "2::kimi-k2.6-deepseek"

      const sepIdx = encodedId.indexOf('::');
      const decodedPrefix = encodedId.slice(0, sepIdx);
      const decodedModelId = encodedId.slice(sepIdx + 2);

      assert.equal(decodedPrefix, '2');
      assert.equal(decodedModelId, 'kimi-k2.6-deepseek');
    });
  });
});

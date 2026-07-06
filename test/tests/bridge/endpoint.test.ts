import assert from 'node:assert/strict';
import { suite, test, beforeEach } from 'mocha';
import * as vscode from 'vscode';
import { MIMO } from '../../../src/providers/mimo';
import { MIMO_MODELS } from '../../../src/providers/mimo/models';
import { MIMO_ENDPOINTS } from '../../../src/providers/mimo/endpoints';
import * as registry from '../../../src/registry';
import { resolveTrait, getEndpoint, composeModelEndpoint, modelKey } from '../../../src/providers/utils';
import type { ModelItem, ModelProvider } from '../../../src/providers/types';
import type { ReqOptions } from '../../../src/bridge/information';

/**
 * Sanity: verify that MIMO endpoints array was set up correctly
 * after import-time composition (composeModelEndpoint then composeModelProvider).
 */
suite('bridge/endpoint MIMO composition', () => {
  test('MIMO provider has all 4 endpoints', () => {
    assert.ok(MIMO.endpoints);
    assert.equal(MIMO.endpoints!.length, 4);
  });

  test('each endpoint has a unique id and url', () => {
    const ids = MIMO.endpoints!.map((ep) => ep.id);
    const urls = MIMO.endpoints!.map((ep) => ep.url);
    assert.equal(new Set(ids).size, 4);
    assert.equal(new Set(urls).size, 4);
  });

  test('default endpoint is "mimo" with api.xiaomimimo.com', () => {
    const first = MIMO.endpoints![0];
    assert.equal(first.id, 'mimo');
    assert.equal(first.url, 'https://api.xiaomimimo.com/v1');
  });

  test('token-plan-cn endpoint has correct url', () => {
    const ep = MIMO.endpoints!.find((e) => e.id === 'mimo-token-plan-cn');
    assert.ok(ep);
    assert.equal(ep!.url, 'https://token-plan-cn.xiaomimimo.com/v1');
  });
});

suite('bridge/endpoint model-to-endpoint binding', () => {
  test('ALL_MODELS contains distinct entries per endpoint for MIMO', () => {
    const mimoModels = registry.ALL_MODELS.filter(
      (m) => m.provider.id === 'mimo',
    );
    // 4 endpoints × 2 models = 8
    assert.equal(mimoModels.length, 8);
  });

  test('each model entry has correct endpoint url via resolveTrait', () => {
    const mimoModels = registry.ALL_MODELS.filter(
      (m) => m.provider.id === 'mimo',
    );

    for (const m of mimoModels) {
      const url = resolveTrait(m, 'url');
      assert.ok(url, `model ${m.id} (endpoint ${m.endpoint?.id}) should have a url`);
      // URL should match the endpoint's own url
      assert.equal(url, m.endpoint?.url);
    }
  });

  test('model from "mimo-token-plan-cn" endpoint resolves to correct URL', () => {
    const cnModels = registry.ALL_MODELS.filter(
      (m) => m.provider.id === 'mimo' && m.endpoint?.id === 'mimo-token-plan-cn',
    );
    assert.equal(cnModels.length, 2, 'should have 2 models under mimo-token-plan-cn');

    for (const m of cnModels) {
      assert.equal(
        resolveTrait(m, 'url'),
        'https://token-plan-cn.xiaomimimo.com/v1',
        `model ${m.id} should resolve to token-plan-cn url`,
      );
    }
  });

  test('modelKey is unique across endpoints for same model id', () => {
    const keys = registry.ALL_MODELS
      .filter((m) => m.provider.id === 'mimo')
      .map((m) => modelKey(m));

    // 4 endpoints × 2 models = 8 unique keys
    assert.equal(keys.length, 8);
    assert.equal(new Set(keys).size, 8);
  });
});

suite('bridge/endpoint URL resolution (resolveTrait + getEndpoint)', () => {
  // Build a clean model with a specific endpoint for testing
  function makeModel(endpointId: string): ModelItem {
    const ep = MIMO.endpoints!.find((e) => e.id === endpointId);
    assert.ok(ep, `endpoint ${endpointId} should exist`);

    // Clone a MIMO model and assign the chosen endpoint
    const base = MIMO_MODELS[0];
    return {
      ...base,
      source: 'builtin' as const,
      provider: MIMO,
      endpoint: { ...ep },
    } as ModelItem;
  }

  test('resolveTrait returns endpoint.url for a model with endpoint set', () => {
    const m = makeModel('mimo-token-plan-cn');
    assert.equal(resolveTrait(m, 'url'), 'https://token-plan-cn.xiaomimimo.com/v1');
  });

  test('resolveTrait ?? getEndpoint: resolveTrait wins when endpoint is set', () => {
    const m = makeModel('mimo-token-plan-sgp');
    // resolveTrait returns the endpoint url
    const url = resolveTrait(m, 'url') ?? getEndpoint(MIMO, 'mimo-token-plan-cn');
    assert.equal(url, 'https://token-plan-sgp.xiaomimimo.com/v1');
  });

  test('getEndpoint with valid endpoint id returns correct url', () => {
    assert.equal(
      getEndpoint(MIMO, 'mimo-token-plan-cn'),
      'https://token-plan-cn.xiaomimimo.com/v1',
    );
    assert.equal(
      getEndpoint(MIMO, 'mimo-token-plan-sgp'),
      'https://token-plan-sgp.xiaomimimo.com/v1',
    );
    assert.equal(
      getEndpoint(MIMO, 'mimo-token-plan-ams'),
      'https://token-plan-ams.xiaomimimo.com/v1',
    );
  });

  test('getEndpoint with undefined falls back to first endpoint', () => {
    assert.equal(
      getEndpoint(MIMO, undefined),
      'https://api.xiaomimimo.com/v1',
    );
  });

  test('getEndpoint with empty string falls back to first endpoint', () => {
    assert.equal(
      getEndpoint(MIMO, ''),
      'https://api.xiaomimimo.com/v1',
    );
  });

  test('getEndpoint with full URL returns it directly', () => {
    const url = 'https://custom.example.com/v1';
    assert.equal(getEndpoint(MIMO, url), url);
  });

  test('getEndpoint with unknown id falls back to first endpoint', () => {
    assert.equal(
      getEndpoint(MIMO, 'nonexistent'),
      'https://api.xiaomimimo.com/v1',
    );
  });
});

suite('bridge/endpoint provideLanguageModelChatInformation filtering', () => {
  // Simulate the endpoint resolution logic from adapter.ts
  function filterVisibleModels(
    providerId: string,
    secretsApiEndpoint: string | undefined,
    groupCfgApiEndpoint: string | undefined,
  ): { count: number; endpointIds: string[] } {
    const provider = registry.providerById.get(providerId);
    assert.ok(provider);

    const providerModels = registry.ALL_MODELS.filter(
      (m) => m.provider.id === providerId,
    );

    const effectiveEndpoint = secretsApiEndpoint ?? groupCfgApiEndpoint;
    const activeEndpointId = effectiveEndpoint
      ? provider.endpoints?.find((e) => e.id === effectiveEndpoint)?.id
        ?? provider.endpoints?.[0]?.id
      : provider.endpoints?.[0]?.id;

    const visible =
      activeEndpointId
        ? providerModels.filter((m) => m.endpoint?.id === activeEndpointId)
        : providerModels;

    const endpointIds = [...new Set(visible.map((m) => m.endpoint?.id ?? ''))];
    return { count: visible.length, endpointIds };
  }

  test('secrets.apiEndpoint wins over groupCfg.apiEndpoint', () => {
    // secrets says token-plan-cn, groupCfg says mimo (default)
    const result = filterVisibleModels('mimo', 'mimo-token-plan-cn', 'mimo');
    assert.equal(result.count, 2);
    assert.deepEqual(result.endpointIds, ['mimo-token-plan-cn']);
  });

  test('falls back to groupCfg when secrets is undefined', () => {
    const result = filterVisibleModels('mimo', undefined, 'mimo-token-plan-sgp');
    assert.equal(result.count, 2);
    assert.deepEqual(result.endpointIds, ['mimo-token-plan-sgp']);
  });

  test('falls back to first endpoint when both are undefined', () => {
    const result = filterVisibleModels('mimo', undefined, undefined);
    assert.equal(result.count, 2);
    assert.deepEqual(result.endpointIds, ['mimo']);
  });

  test('falls back to first endpoint when both are empty string', () => {
    const result = filterVisibleModels('mimo', '', '');
    assert.equal(result.count, 2);
    assert.deepEqual(result.endpointIds, ['mimo']);
  });

  test('each endpoint returns exactly 2 models', () => {
    for (const epId of ['mimo', 'mimo-token-plan-cn', 'mimo-token-plan-sgp', 'mimo-token-plan-ams']) {
      const result = filterVisibleModels('mimo', epId, undefined);
      assert.equal(
        result.count,
        2,
        `endpoint ${epId} should have 2 models`,
      );
      assert.deepEqual(result.endpointIds, [epId]);
    }
  });
});

suite('bridge/endpoint provideLanguageModelChatResponse URL assembly', () => {
  test('apiUrl matches endpoint url when model has correct endpoint', () => {
    // Simulate the URL resolution from provideLanguageModelChatResponse
    const cnModels = registry.ALL_MODELS.filter(
      (m) => m.provider.id === 'mimo' && m.endpoint?.id === 'mimo-token-plan-cn',
    );

    for (const model of cnModels) {
      const modelProvider = model.provider;
      // secrets.apiEndpoint may be anything; resolveTrait should win
      const apiUrl =
        resolveTrait(model, 'url') ?? getEndpoint(modelProvider, 'mimo');
      assert.equal(
        apiUrl,
        'https://token-plan-cn.xiaomimimo.com/v1',
        `model ${model.id} should send to token-plan-cn`,
      );
    }
  });

  test('apiUrl falls back to getEndpoint when model has no endpoint url', () => {
    // Model without endpoint set (simulating edge case)
    const model: ModelItem = {
      ...MIMO_MODELS[0],
      source: 'builtin' as const,
      provider: MIMO,
      endpoint: undefined,
    } as ModelItem;

    // resolveTrait(model, 'url'): model.url (undefined), then model.endpoint?.url (undefined),
    // then model.provider.url = 'https://api.xiaomimimo.com/v1'
    const apiUrl = resolveTrait(model, 'url') ?? getEndpoint(MIMO, 'mimo-token-plan-cn');
    // resolveTrait finds provider.url first
    assert.equal(apiUrl, 'https://api.xiaomimimo.com/v1');
  });

  test('forwardStream receives correct URL from ReadyReq (unit-level)', async () => {
    // Test that assembleChatReq passes url through to ReadyReq
    const { assembleChatReq } = await import('../../../src/bridge/prepare');
    const { VisionModelPicker } = await import('../../../src/vision/model');

    // Pick a model from mimo-token-plan-cn
    const model = registry.ALL_MODELS.find(
      (m) => m.provider.id === 'mimo' && m.endpoint?.id === 'mimo-token-plan-cn',
    );
    assert.ok(model);

    const apiUrl = resolveTrait(model!, 'url') ?? getEndpoint(MIMO, undefined);
    assert.equal(apiUrl, 'https://token-plan-cn.xiaomimimo.com/v1');

    // Build a mock picker
    const picker = {
      resolve: async () => undefined,
      reset: () => {},
    } as unknown as InstanceType<typeof VisionModelPicker>;

    const token = new vscode.CancellationTokenSource().token;
    const msg = vscode.LanguageModelChatMessage.User('Hello');

    const ready = await assembleChatReq({
      messages: [msg],
      options: { toolMode: vscode.LanguageModelChatToolMode.Auto } as ReqOptions,
      model: model!,
      apiKey: 'test-key',
      token,
      picker,
      url: apiUrl,
    });

    assert.equal(ready.url, 'https://token-plan-cn.xiaomimimo.com/v1');
    assert.equal(ready.model.endpoint?.id, 'mimo-token-plan-cn');
  });
});

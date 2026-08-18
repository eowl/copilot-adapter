import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { composeModelProvider, composeModelEndpoint, getEndpoint, resolveEndpoint, resolveTrait, hasEndpointPlaceholder, resolveRequestUrl, imagePart } from '../../../src/providers/utils';
import { DEFAULT_ENDPOINT_URLS } from '../../../src/providers/endpoints';
import { MINIMAX } from '../../../src/providers/minimax';
import { ZHIPU } from '../../../src/providers/zhipu';
import { MOONSHOT } from '../../../src/providers/moonshot';
import { QWEN, QWEN_ENDPOINTS } from '../../../src/providers/qwen';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import type { ModelItem, ModelProvider } from '../../../src/providers/types';

interface EndpointCase {
  label: string;
  provider: ModelProvider;
  apiEndpoint?: string;
  expected: string;
}

const cases: EndpointCase[] = [
  {
    label: 'MiniMax: no overrides returns first endpoint url',
    provider: MINIMAX,
    expected: DEFAULT_ENDPOINT_URLS.minimax,
  },
  {
    label: 'BigModel: no overrides returns first endpoint url',
    provider: ZHIPU,
    expected: DEFAULT_ENDPOINT_URLS.zhipu,
  },
  {
    label: 'Moonshot: no overrides returns first endpoint url',
    provider: MOONSHOT,
    expected: DEFAULT_ENDPOINT_URLS.moonshot,
  },
  {
    label: 'Qwen: no overrides returns first endpoint url',
    provider: QWEN,
    expected: 'https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  },
  {
    label: 'DeepSeek: no overrides returns first endpoint url',
    provider: DEEPSEEK,
    expected: DEFAULT_ENDPOINT_URLS.deepseek,
  },

  {
    label: 'MiniMax: apiEndpoint minimaxi.com resolves via endpoint key',
    provider: MINIMAX,
    apiEndpoint: 'minimaxi.com',
    expected: 'https://api.minimaxi.com/v1',
  },
  {
    label: 'MiniMax: apiEndpoint minimax.io resolves via endpoint key',
    provider: MINIMAX,
    apiEndpoint: 'minimax.io',
    expected: 'https://api.minimax.io/v1',
  },
  {
    label: 'BigModel: apiEndpoint bigmodel resolves via endpoint key',
    provider: ZHIPU,
    apiEndpoint: 'bigmodel',
    expected: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint bigmodel-coding resolves via endpoint key',
    provider: ZHIPU,
    apiEndpoint: 'bigmodel-coding',
    expected: 'https://open.bigmodel.cn/api/coding/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai resolves via endpoint key',
    provider: ZHIPU,
    apiEndpoint: 'z.ai',
    expected: 'https://api.z.ai/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai-coding resolves via endpoint key',
    provider: ZHIPU,
    apiEndpoint: 'z.ai-coding',
    expected: 'https://api.z.ai/api/coding/paas/v4',
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.cn resolves via endpoint key',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.cn',
    expected: 'https://api.moonshot.cn/v1',
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.ai resolves via endpoint key',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.ai',
    expected: 'https://api.moonshot.ai/v1',
  },

  // Qwen text-input mode: URL containing `dashscope-us` should match the US endpoint via `match`
  {
    label: 'Qwen: full US URL matches US endpoint via matchStr',
    provider: QWEN,
    apiEndpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    expected: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
  },

  // Unknown / empty apiEndpoint falls back to first endpoint url
  {
    label: 'MiniMax: unknown apiEndpoint falls back to first endpoint url',
    provider: MINIMAX,
    apiEndpoint: 'unknown-entry',
    expected: DEFAULT_ENDPOINT_URLS.minimax,
  },
  {
    label: 'MiniMax: empty apiEndpoint falls back to first endpoint url',
    provider: MINIMAX,
    apiEndpoint: '',
    expected: DEFAULT_ENDPOINT_URLS.minimax,
  },
];

suite('getEndpoint priority resolution', () => {
  for (const t of cases) {
    test(t.label, () => {
      assert.equal(getEndpoint(t.provider, t.apiEndpoint), t.expected);
    });
  }
});

suite('resolveEndpoint', () => {
  test('returns ModelEndpoint by exact key match (BigModel)', () => {
    const ep = resolveEndpoint(ZHIPU, 'z.ai-coding');
    assert.equal(ep?.id, 'z.ai-coding');
    assert.equal(ep?.url, 'https://api.z.ai/api/coding/paas/v4');
  });

  test('returns Qwen US endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://abc.us-east-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.id, 'us');
  });

  test('returns Qwen SGP endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://abc.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.id, 'sgp');
  });

  test('returns Qwen EU endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://xyz.eu-central-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.id, 'eu');
  });

  test('returns Qwen CN endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://ws-xxx.cn-beijing.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.id, 'cn');
  });

  test('returns Qwen token-plan endpoint by match (more specific than cn)', () => {
    const ep = resolveEndpoint(QWEN, 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.id, 'token-plan');
  });

  test('returns undefined when no endpoint matches', () => {
    const ep = resolveEndpoint(MINIMAX, 'totally-unknown');
    assert.equal(ep, undefined);
  });

  test('returns undefined when provider has no endpoints', () => {
    const fake = { id: 'x', endpoints: undefined } as unknown as ModelProvider;
    assert.equal(resolveEndpoint(fake, 'whatever'), undefined);
  });
});

suite('hasEndpointPlaceholder', () => {
  test('detects {workspace} placeholder', () => {
    assert.equal(
      hasEndpointPlaceholder('https://{workspace}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1'),
      true,
    );
  });

  test('detects {WorkspaceId} placeholder', () => {
    assert.equal(
      hasEndpointPlaceholder('https://{WorkspaceId}.ap-northeast-1.maas.aliyuncs.com/compatible-mode/v1'),
      true,
    );
  });

  test('returns false for a plain URL', () => {
    assert.equal(hasEndpointPlaceholder('https://dashscope.aliyuncs.com/compatible-mode/v1'), false);
  });

  test('returns false for a URL with no braces', () => {
    assert.equal(hasEndpointPlaceholder('https://api.deepseek.com'), false);
  });
});

suite('resolveRequestUrl', () => {
  const cnModel = QWEN_ENDPOINTS[0].models![0] as ModelItem;

  test('user-typed full URL wins over the model trait', () => {
    const url = resolveRequestUrl(cnModel, 'https://s.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(url, 'https://s.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1');
  });

  test('falls back to resolveTrait when no full URL is provided', () => {
    const url = resolveRequestUrl(cnModel, undefined);
    assert.equal(url, 'https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1');
  });
});

suite('composeModelProvider / composeModelEndpoint', () => {
  test('composeModelEndpoint returns ModelEndpoint with model back-refs', () => {
    const m1 = { id: 'm1' } as unknown as ModelItem;
    const m2 = { id: 'm2' } as unknown as ModelItem;
    const ep = composeModelEndpoint(
      { id: 'a', label: 'A', url: 'https://a.example.com' },
      [m1, m2],
    );
    assert.equal(ep.models!.length, 2);
    assert.equal(ep.models![0].endpoint?.id, 'a');
    assert.equal(ep.models![1].endpoint?.id, 'a');
  });

  test('composeModelProvider wires endpoints with provider back-refs', () => {
    const modelProvider = { id: 'fake' } as unknown as ModelProvider;
    const m = { id: 'm1' } as unknown as ModelItem;
    const ep = composeModelEndpoint({ id: 'a', label: 'A', url: 'https://a.example.com' }, [m]);

    composeModelProvider(modelProvider, [ep]);

    assert.equal(modelProvider.endpoints?.length, 1);
    assert.equal(modelProvider.endpoints?.[0].provider, modelProvider);
  });
});

suite('Endpoint.models visibility', () => {
  test('Qwen US endpoint includes US-only models', () => {
    const us = QWEN.endpoints?.find((s) => s.id === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen-plus-us'), 'US endpoint should contain qwen-plus-us');
    assert.ok(usIds.includes('qwen-flash-us'), 'US endpoint should contain qwen-flash-us');
  });

  test('Qwen CN endpoint does NOT include US-only models', () => {
    const cn = QWEN.endpoints?.find((s) => s.id === 'cn');
    const cnIds = cn?.models!.map((m) => m.id) ?? [];
    assert.ok(!cnIds.includes('qwen-plus-us'), 'CN endpoint should not contain qwen-plus-us');
    assert.ok(!cnIds.includes('qwen-flash-us'), 'CN endpoint should not contain qwen-flash-us');
    assert.ok(cnIds.length > 0, 'CN endpoint should have base models');
  });

  test('Qwen US endpoint includes base models', () => {
    const us = QWEN.endpoints?.find((s) => s.id === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen3.7-max'), 'US endpoint should contain shared base model');
  });

  test('Qwen default endpoint includes ALL models (base + US-only)', () => {
    const def = QWEN.endpoints?.find((s) => s.id === 'default');
    assert.ok(def, 'Qwen should have a default endpoint');
    const defIds = def?.models!.map((m) => m.id) ?? [];
    assert.ok(defIds.includes('qwen3.7-max'), 'default endpoint should contain base model');
    assert.ok(defIds.includes('qwen-plus-us'), 'default endpoint should contain US-only model');
    assert.ok(defIds.includes('qwen-flash-us'), 'default endpoint should contain US-only model');
  });

  test('Qwen default endpoint has no matchStr (never substring-matched)', () => {
    const def = QWEN.endpoints?.find((s) => s.id === 'default');
    assert.ok(def, 'Qwen should have a default endpoint');
    assert.equal(def?.matchStr, undefined, 'default endpoint must not define matchStr');
  });

  test('resolveEndpoint does not match default for an unmatchable URL', () => {
    const ep = resolveEndpoint(QWEN, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep, undefined, 'unmatchable URL should not resolve to any endpoint');
  });
});

suite('Qwen activeEndpointId (leaving apiEndpoint empty vs unknown URL)', () => {
  // Mirror the exact logic from adapter.ts provideLanguageModelChatInformation:
  //   resolvedEndpoint = effectiveEndpoint ? resolveEndpoint(...) : undefined
  //   defaultEndpointId = endpoints.find(e => e.id === 'default')?.id
  //   activeEndpointId = effectiveEndpoint
  //     ? (resolvedEndpoint?.id ?? defaultEndpointId ?? endpoints[0].id)
  //     : (defaultEndpointId ?? endpoints[0].id)
  function activeEndpointId(effectiveEndpoint: string | undefined): string | undefined {
    const resolved = effectiveEndpoint
      ? resolveEndpoint(QWEN, effectiveEndpoint)
      : undefined;
    const defaultEndpointId = QWEN.endpoints?.find((e) => e.id === 'default')?.id;
    return effectiveEndpoint
      ? (resolved?.id ?? defaultEndpointId ?? QWEN.endpoints?.[0]?.id)
      : (defaultEndpointId ?? QWEN.endpoints?.[0]?.id);
  }

  test('leaving apiEndpoint empty defaults to the "default" endpoint (dashscope)', () => {
    assert.equal(activeEndpointId(undefined), 'default');
  });

  test('empty string also defaults to the "default" endpoint', () => {
    assert.equal(activeEndpointId(''), 'default');
  });

  test('an unmatchable URL falls back to the "default" endpoint', () => {
    assert.equal(
      activeEndpointId('https://dashscope.aliyuncs.com/compatible-mode/v1'),
      'default',
    );
  });

  test('a matchable URL resolves to its own endpoint (not default)', () => {
    assert.equal(
      activeEndpointId('https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'),
      'token-plan',
    );
    assert.equal(
      activeEndpointId('https://ws-xxx.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'),
      'cn',
    );
  });
});

suite('resolveTrait model > endpoint > provider chain', () => {
  test('returns model value when defined on model', () => {
    const modelProvider = { tokenRatio: 1.0 } as unknown as ModelProvider;
    const modelEndpoint = { tokenRatio: 2.0 } as unknown as ModelItem['endpoint'];
    const modelItem = { tokenRatio: 3.0, provider: modelProvider, endpoint: modelEndpoint } as unknown as ModelItem;
    assert.equal(resolveTrait(modelItem, 'tokenRatio'), 3.0);
  });

  test('falls back to endpoint when model lacks the trait', () => {
    const modelProvider = { tokenRatio: 1.0 } as unknown as ModelProvider;
    const modelEndpoint = { tokenRatio: 2.0 } as unknown as ModelItem['endpoint'];
    const modelItem = { provider: modelProvider, endpoint: modelEndpoint } as unknown as ModelItem;
    assert.equal(resolveTrait(modelItem, 'tokenRatio'), 2.0);
  });

  test('falls back to provider when neither model nor endpoint defines the trait', () => {
    const modelProvider = { tokenRatio: 1.0 } as unknown as ModelProvider;
    const modelEndpoint = {} as unknown as ModelItem['endpoint'];
    const modelItem = { provider: modelProvider, endpoint: modelEndpoint } as unknown as ModelItem;
    assert.equal(resolveTrait(modelItem, 'tokenRatio'), 1.0);
  });

  test('returns undefined when no level defines the trait', () => {
    const modelProvider = {} as unknown as ModelProvider;
    const modelEndpoint = {} as unknown as ModelItem['endpoint'];
    const modelItem = { provider: modelProvider, endpoint: modelEndpoint } as unknown as ModelItem;
    assert.equal(resolveTrait(modelItem, 'tokenRatio'), undefined);
  });
});

suite('ModelProvider/ModelEndpoint composition invariants', () => {
  test('every model has an endpoint back-reference', () => {
    for (const mp of [MINIMAX, MOONSHOT, ZHIPU, QWEN, DEEPSEEK]) {
      for (const me of mp.endpoints ?? []) {
        for (const mi of me.models!) {
          assert.ok(mi.endpoint, `${mi.id} must have an endpoint back-reference`);
        }
      }
    }
  });

  test('MiniMax endpoints share identical models', () => {
    const ids0 = MINIMAX.endpoints?.[0].models!.map((mi: ModelItem) => mi.id);
    const ids1 = MINIMAX.endpoints?.[1].models!.map((mi: ModelItem) => mi.id);
    assert.deepEqual(ids0, ids1);
  });

  test('every endpoint has provider back-reference', () => {
    for (const mp of [MINIMAX, MOONSHOT, ZHIPU, QWEN, DEEPSEEK]) {
      for (const me of mp.endpoints ?? []) {
        assert.equal(me.provider, mp, `endpoint ${me.id}.provider must point at owner`);
      }
    }
  });

  test('every model has provider set by composeModelProvider', () => {
    for (const mp of [MINIMAX, MOONSHOT, ZHIPU, QWEN, DEEPSEEK]) {
      for (const me of mp.endpoints ?? []) {
        for (const mi of me.models!) {
          assert.equal(mi.provider, mp, `${mi.id}.provider must equal its owning provider`);
        }
      }
    }
  });

  test('DeepSeek has a single endpoint even though it has no variants', () => {
    assert.equal(DEEPSEEK.endpoints?.length, 1);
    assert.equal(DEEPSEEK.endpoints?.[0].id, 'deepseek');
  });
});

suite('imagePart()', () => {
  const fakeData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const fakeMime = 'image/png';

  test('default imageField is "image_url"', () => {
    const fn = imagePart();
    const result = fn(fakeData, fakeMime);
    assert.equal(result.type, 'image_url');
    assert.ok(typeof (result as any).image_url?.url === 'string');
    assert.match((result as any).image_url.url, /^data:image\/png;base64,/);
  });

  test('custom imageField "image"', () => {
    const fn = imagePart('image');
    const result = fn(fakeData, fakeMime);
    assert.equal(result.type, 'image');
    assert.ok(typeof (result as any).image?.url === 'string');
    assert.match((result as any).image.url, /^data:image\/png;base64,/);
  });

  test('base64 encodes correctly', () => {
    const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const fn = imagePart();
    const result = fn(data, 'text/plain');
    assert.ok((result as any).image_url.url.includes('SGVsbG8='));
  });

  test('different mimetypes produce correct data URIs', () => {
    const data = new Uint8Array([0x42]); // 'B'

    const pngFn = imagePart();
    const pngResult = pngFn(data, 'image/png');
    assert.match((pngResult as any).image_url.url, /^data:image\/png;base64,/);

    const jpgResult = pngFn(data, 'image/jpeg');
    assert.match((jpgResult as any).image_url.url, /^data:image\/jpeg;base64,/);
  });

  test('returns a NEW function each call (stateless)', () => {
    const fn1 = imagePart();
    const fn2 = imagePart();
    assert.notStrictEqual(fn1, fn2);

    const data = new Uint8Array([0x00]);
    const r1 = fn1(data, 'image/gif');
    const r2 = fn2(data, 'image/gif');
    assert.deepEqual(r1, r2);
  });

  test('empty data produces valid base64 empty string', () => {
    const fn = imagePart();
    const result = fn(new Uint8Array(0), 'image/png');
    assert.equal((result as any).image_url.url, 'data:image/png;base64,');
  });
});

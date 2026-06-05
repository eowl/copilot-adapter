import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { composeProvider, composeEndpoint, getEndpoint, resolveEndpoint, resolveTrait } from '../../../src/providers/utils';
import { DEFAULT_ENDPOINT_URLS } from '../../../src/providers/endpoints';
import { MINIMAX } from '../../../src/providers/minimax';
import { BIGMODEL } from '../../../src/providers/bigmodel';
import { MOONSHOT } from '../../../src/providers/moonshot';
import { QWEN } from '../../../src/providers/qwen';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { stub } from '../../helpers/stubs';
import type { Model, Provider } from '../../../src/providers/types';

function stubProviderEndpoint(value: string | undefined, providerId: string): () => void {
  const mockConfig = {
    get<T>(section: string, defaultValue?: T): T {
      if (section === 'providerEndpoints') {
        const map: Record<string, string> = {};
        if (value !== undefined) map[providerId] = value;
        return map as T;
      }

      return defaultValue as T;
    },
    has: () => false,
    inspect: () => undefined,
    update: () => Promise.resolve(),
  } as unknown as vscode.WorkspaceConfiguration;

  return stub(vscode.workspace, 'getConfiguration', () => mockConfig);
}

function stubNoGlobalOverride(): () => void {
  return stubProviderEndpoint('', 'any');
}

interface EndpointCase {
  label: string;
  provider: Provider;
  apiEndpoint?: string;
  globalOverride?: string;
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
    provider: BIGMODEL,
    expected: DEFAULT_ENDPOINT_URLS.bigmodel,
  },
  {
    label: 'Moonshot: no overrides returns first endpoint url',
    provider: MOONSHOT,
    expected: DEFAULT_ENDPOINT_URLS.moonshot,
  },
  {
    label: 'Qwen: no overrides returns first endpoint url',
    provider: QWEN,
    expected: DEFAULT_ENDPOINT_URLS.qwen,
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
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel',
    expected: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint bigmodel-coding resolves via endpoint key',
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel-coding',
    expected: 'https://open.bigmodel.cn/api/coding/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai resolves via endpoint key',
    provider: BIGMODEL,
    apiEndpoint: 'z.ai',
    expected: 'https://api.z.ai/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai-coding resolves via endpoint key',
    provider: BIGMODEL,
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

  // Global providerEndpoints override beats everything
  {
    label: 'MiniMax: global override wins over apiEndpoint',
    provider: MINIMAX,
    apiEndpoint: 'minimax.io',
    globalOverride: 'https://custom-proxy.example.com/v1',
    expected: 'https://custom-proxy.example.com/v1',
  },
  {
    label: 'DeepSeek: global override wins over default',
    provider: DEEPSEEK,
    globalOverride: 'https://ds-proxy.internal/v1',
    expected: 'https://ds-proxy.internal/v1',
  },
  {
    label: 'Qwen: global override wins over apiEndpoint URL',
    provider: QWEN,
    apiEndpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    globalOverride: 'https://qwen-gateway.example.com/v1',
    expected: 'https://qwen-gateway.example.com/v1',
  },
];

suite('getEndpoint priority resolution', () => {
  let restore: () => void;

  afterEach(() => restore?.());

  for (const t of cases) {
    test(t.label, () => {
      if (t.globalOverride !== undefined) {
        restore = stubProviderEndpoint(t.globalOverride, t.provider.id);
      } else {
        restore = stubNoGlobalOverride();
      }

      assert.equal(getEndpoint(t.provider, t.apiEndpoint), t.expected);
    });
  }
});

suite('resolveEndpoint', () => {
  test('returns Endpoint by exact key match (BigModel)', () => {
    const ep = resolveEndpoint(BIGMODEL, 'z.ai-coding');
    assert.equal(ep?.key, 'z.ai-coding');
    assert.equal(ep?.url, 'https://api.z.ai/api/coding/paas/v4');
  });

  test('returns Qwen US endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://dashscope-us.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.key, 'us');
  });

  test('returns Qwen SGP endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://abc.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.key, 'sgp');
  });

  test('returns Qwen EU endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://xyz.eu-central-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.key, 'eu');
  });

  test('returns Qwen CN endpoint by match', () => {
    const ep = resolveEndpoint(QWEN, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
    assert.equal(ep?.key, 'cn');
  });

  test('returns undefined when no endpoint matches', () => {
    const ep = resolveEndpoint(MINIMAX, 'totally-unknown');
    assert.equal(ep, undefined);
  });

  test('returns undefined when provider has no endpoints', () => {
    const fake = { id: 'x', endpoints: undefined } as unknown as Provider;
    assert.equal(resolveEndpoint(fake, 'whatever'), undefined);
  });
});

suite('composeProvider / composeEndpoint', () => {
  test('composeEndpoint returns Endpoint with model back-refs', () => {
    const m1 = { id: 'm1' } as unknown as Model;
    const m2 = { id: 'm2' } as unknown as Model;
    const ep = composeEndpoint(
      { key: 'a', label: 'A', url: 'https://a.example.com' },
      [m1, m2],
    );
    assert.equal(ep.models!.length, 2);
    assert.equal(m1.endpoint?.key, 'a');
    assert.equal(m2.endpoint?.key, 'a');
  });

  test('composeProvider wires endpoints with provider back-refs', () => {
    const provider = { id: 'fake' } as unknown as Provider;
    const m = { id: 'm1' } as unknown as Model;
    const ep = composeEndpoint({ key: 'a', label: 'A', url: 'https://a.example.com' }, [m]);

    composeProvider(provider, [ep]);

    assert.equal(provider.endpoints?.length, 1);
    assert.equal(provider.endpoints?.[0].provider, provider);
  });
});

suite('Endpoint.models visibility', () => {
  test('Qwen US endpoint includes US-only models', () => {
    const us = QWEN.endpoints?.find((s) => s.key === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen-plus-us'), 'US endpoint should contain qwen-plus-us');
    assert.ok(usIds.includes('qwen-flash-us'), 'US endpoint should contain qwen-flash-us');
  });

  test('Qwen CN endpoint does NOT include US-only models', () => {
    const cn = QWEN.endpoints?.find((s) => s.key === 'cn');
    const cnIds = cn?.models!.map((m) => m.id) ?? [];
    assert.ok(!cnIds.includes('qwen-plus-us'), 'CN endpoint should not contain qwen-plus-us');
    assert.ok(!cnIds.includes('qwen-flash-us'), 'CN endpoint should not contain qwen-flash-us');
    assert.ok(cnIds.length > 0, 'CN endpoint should have base models');
  });

  test('Qwen US endpoint includes base models', () => {
    const us = QWEN.endpoints?.find((s) => s.key === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen3.7-max'), 'US endpoint should contain shared base model');
  });
});

suite('resolveTrait model > endpoint > provider chain', () => {
  test('returns model value when defined on model', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const endpoint = { tokenRatio: 2.0 } as unknown as Model['endpoint'];
    const model = { tokenRatio: 3.0, provider, endpoint } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 3.0);
  });

  test('falls back to endpoint when model lacks the trait', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const endpoint = { tokenRatio: 2.0 } as unknown as Model['endpoint'];
    const model = { provider, endpoint } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 2.0);
  });

  test('falls back to provider when neither model nor endpoint defines the trait', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const endpoint = {} as unknown as Model['endpoint'];
    const model = { provider, endpoint } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 1.0);
  });

  test('returns undefined when no level defines the trait', () => {
    const provider = {} as unknown as Provider;
    const endpoint = {} as unknown as Model['endpoint'];
    const model = { provider, endpoint } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), undefined);
  });
});

suite('Provider/Endpoint composition invariants', () => {
  test('every model has an endpoint back-reference', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const ep of p.endpoints ?? []) {
        for (const m of ep.models!) {
          assert.ok(m.endpoint, `${m.id} must have an endpoint back-reference`);
        }
      }
    }
  });

  test('MiniMax endpoints share identical models', () => {
    const ids0 = MINIMAX.endpoints?.[0].models!.map((m: Model) => m.id);
    const ids1 = MINIMAX.endpoints?.[1].models!.map((m: Model) => m.id);
    assert.deepEqual(ids0, ids1);
  });

  test('every endpoint has provider back-reference', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const ep of p.endpoints ?? []) {
        assert.equal(ep.provider, p, `endpoint ${ep.key}.provider must point at owner`);
      }
    }
  });

  test('every model has provider set by composeProvider', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const ep of p.endpoints ?? []) {
        for (const m of ep.models!) {
          assert.equal(m.provider, p, `${m.id}.provider must equal its owning provider`);
        }
      }
    }
  });

  test('DeepSeek has a single endpoint even though it has no variants', () => {
    assert.equal(DEEPSEEK.endpoints?.length, 1);
    assert.equal(DEEPSEEK.endpoints?.[0].key, 'deepseek');
  });
});

import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { MIMO, MIMO_MODELS } from '../../../src/providers/mimo';
import { MIMO_ENDPOINTS } from '../../../src/providers/mimo/endpoints';
import { backfillModel } from '../../../src/providers/loader';
import type { ModelItem } from '../../../src/providers/types';

function proModel(): ModelItem {
  return MIMO_MODELS.find((m) => m.id === 'mimo-v2.5-pro')! as ModelItem;
}

function baseModel(): ModelItem {
  return MIMO_MODELS.find((m) => m.id === 'mimo-v2.5')! as ModelItem;
}

suite('providers/mimo model list', () => {
  test('MIMO_MODELS has exactly 2 models', () => {
    assert.equal(MIMO_MODELS.length, 2);
  });

  test('first model is mimo-v2.5-pro', () => {
    assert.equal(MIMO_MODELS[0].id, 'mimo-v2.5-pro');
    assert.equal(MIMO_MODELS[0].label, 'MIMO V2.5 Pro');
  });

  test('second model is mimo-v2.5', () => {
    assert.equal(MIMO_MODELS[1].id, 'mimo-v2.5');
    assert.equal(MIMO_MODELS[1].label, 'MIMO V2.5');
  });

  test('MIMO provider id is "mimo"', () => {
    assert.equal(MIMO.id, 'mimo');
  });

  test('MIMO provider label is "Xiaomi MIMO"', () => {
    assert.equal(MIMO.label, 'Xiaomi MIMO');
  });

  test('both models belong to MIMO provider', () => {
    for (const m of MIMO_MODELS) {
      assert.equal(m.provider.id, 'mimo');
    }
  });

  test('both models are in mimo family', () => {
    for (const m of MIMO_MODELS) {
      assert.equal(m.family, 'mimo');
    }
  });

  test('pro model has imageInput=false, base model has imageInput=true', () => {
    assert.equal(proModel().imageInput, false);
    assert.equal(baseModel().imageInput, true);
  });

  test('both models support thinking', () => {
    for (const m of MIMO_MODELS) {
      assert.equal(m.thinking, true);
    }
  });

  test('both models have maxTokensField "max_completion_tokens"', () => {
    for (const m of MIMO_MODELS) {
      assert.equal(m.maxTokensField, 'max_completion_tokens');
    }
  });

  test('both models allow up to 128 tools', () => {
    for (const m of MIMO_MODELS) {
      assert.equal(m.maxTools, 128);
    }
  });
});

suite('providers/mimo model.requestExtras()', () => {
  const model = proModel();
  backfillModel(model);
  const requestExtras = model.requestExtras!;

  test('model has thinking config with 2 options', () => {
    assert.ok(model.thinkingConfig !== undefined);
    assert.equal(model.thinkingConfig!.default, 'enabled');
    assert.equal(model.thinkingConfig!.options.length, 2);
  });

  test('each thinking option has requestFields', () => {
    for (const opt of model.thinkingConfig!.options) {
      assert.ok(
        opt.requestFields !== undefined,
        `option ${opt.value} missing requestFields`,
      );
    }
  });

  test('thinkingMode "enabled": thinking type enabled', () => {
    const result = requestExtras({ thinkingMode: 'enabled' });
    assert.deepEqual(result, { thinking: { type: 'enabled' } });
  });

  test('thinkingMode "disabled": thinking type disabled', () => {
    const result = requestExtras({ thinkingMode: 'disabled' });
    assert.deepEqual(result, { thinking: { type: 'disabled' } });
  });

  test('unknown thinkingMode defaults to "enabled"', () => {
    const result = requestExtras({ thinkingMode: 'unknown' });
    assert.deepEqual(result, { thinking: { type: 'enabled' } });
  });

  test('undefined thinkingMode defaults to "enabled"', () => {
    const result = requestExtras({});
    assert.deepEqual(result, { thinking: { type: 'enabled' } });
  });

  test('undefined modelConfig defaults to "enabled"', () => {
    const result = requestExtras(undefined);
    assert.deepEqual(result, { thinking: { type: 'enabled' } });
  });

  test('both models have same thinking extras behavior', () => {
    for (const m of MIMO_MODELS) {
      backfillModel(m);
      const extras = m.requestExtras!;
      assert.deepEqual(extras({ thinkingMode: 'enabled' }), {
        thinking: { type: 'enabled' },
      });
      assert.deepEqual(extras({ thinkingMode: 'disabled' }), {
        thinking: { type: 'disabled' },
      });
    }
  });
});

suite('providers/mimo model.configSchema()', () => {
  const pro = proModel();
  backfillModel(pro);
  test('pro model has config schema with thinkingMode enum', () => {
    const schema = pro.configSchema!();
    assert.ok(schema !== undefined);
    const props = (schema as Record<string, unknown>).properties as Record<string, unknown>;
    assert.ok(props.thinkingMode !== undefined);
    const tm = props.thinkingMode as Record<string, unknown>;
    assert.deepEqual(tm.enum, ['enabled', 'disabled']);
    assert.equal(tm.default, 'enabled');
    assert.equal(tm.type, 'string');
  });

  test('base model has config schema', () => {
    const bm = baseModel();
    backfillModel(bm);
    const schema = bm.configSchema!();
    assert.ok(schema !== undefined);
  });
});

suite('providers/mimo provider traits', () => {
  test('tokenRatio is 4.0', () => {
    assert.equal(MIMO.tokenRatio, 4.0);
  });

  test('thinkingField is "reasoning_content"', () => {
    assert.equal(MIMO.thinkingField, 'reasoning_content');
  });

  test('apiKeyHint is "sk-... or tp-..."', () => {
    assert.equal(MIMO.apiKeyHint, 'sk-... or tp-...');
  });

  test('provider url is default mimo endpoint', () => {
    assert.equal(MIMO.url, 'https://api.xiaomimimo.com/v1');
  });

  test('usageSchema maps prompt/completion/total tokens', () => {
    assert.equal(MIMO.usageSchema?.prompt_tokens, 'prompt_tokens');
    assert.equal(MIMO.usageSchema?.completion_tokens, 'completion_tokens');
    assert.equal(MIMO.usageSchema?.total_tokens, 'total_tokens');
  });

  test('usageSchema maps cached_tokens and reasoning_tokens', () => {
    assert.equal(
      MIMO.usageSchema?.prompt_tokens_details?.cached_tokens,
      'prompt_tokens_details.cached_tokens',
    );
    assert.equal(
      MIMO.usageSchema?.completion_tokens_details?.reasoning_tokens,
      'completion_tokens_details.reasoning_tokens',
    );
  });

  test('links.apiHost is "api.xiaomimimo.com"', () => {
    assert.equal(MIMO.links?.apiHost, 'api.xiaomimimo.com');
  });
});

suite('providers/mimo endpoints', () => {
  test('MIMO_ENDPOINTS has exactly 4 entries', () => {
    assert.equal(MIMO_ENDPOINTS.length, 4);
  });

  test('endpoint ids contain "mimo", "mimo-token-plan-cn", "mimo-token-plan-sgp", "mimo-token-plan-ams"', () => {
    const ids = MIMO_ENDPOINTS.map((ep) => ep.id);
    assert.ok(ids.includes('mimo'));
    assert.ok(ids.includes('mimo-token-plan-cn'));
    assert.ok(ids.includes('mimo-token-plan-sgp'));
    assert.ok(ids.includes('mimo-token-plan-ams'));
  });

  test('all endpoints have url set', () => {
    for (const ep of MIMO_ENDPOINTS) {
      assert.ok(ep.url, `endpoint ${ep.id} should have a url`);
      assert.ok(ep.url!.startsWith('https://'), `endpoint ${ep.id} url should be https`);
    }
  });

  test('token-plan endpoints have distinct urls', () => {
    const urls = MIMO_ENDPOINTS
      .filter((ep) => ep.id.startsWith('mimo-token-plan-'))
      .map((ep) => ep.url);
    assert.equal(new Set(urls).size, 3);
  });

  test('each endpoint has the same 2 models', () => {
    for (const ep of MIMO_ENDPOINTS) {
      assert.equal(ep.models?.length, 2);
    }
  });

  test('all endpoints share the same model ids', () => {
    const expectedIds = MIMO_MODELS.map((m) => m.id).sort();
    for (const ep of MIMO_ENDPOINTS) {
      const ids = ep.models?.map((m) => m.id).sort();
      assert.deepEqual(ids, expectedIds, `endpoint ${ep.id} model ids mismatch`);
    }
  });
});

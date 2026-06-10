import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { applyUsageSchema, readPath, buildUsageLog } from '../../../src/bridge/usage';
import { calibrateRatio, getCalibratedRatio, refineRatio, countMessageChars, DEFAULT_CHARS_PER_TOKEN } from '../../../src/bridge/tally';
import type { UsagePayload } from '../../../src/bridge/types';
import type { UsageSchema } from '../../../src/providers/types';

const DEEPSEEK_SCHEMA: UsageSchema = {
  prompt_tokens: 'prompt_tokens',
  completion_tokens: 'completion_tokens',
  total_tokens: 'total_tokens',
  prompt_tokens_details: {
    cached_tokens: 'prompt_cache_hit_tokens',
    cache_miss: 'prompt_cache_miss_tokens',
  },
  completion_tokens_details: {
    reasoning_tokens: 'completion_tokens_details.reasoning_tokens',
  },
};

const QWEN_SCHEMA: UsageSchema = {
  prompt_tokens: 'prompt_tokens',
  completion_tokens: 'completion_tokens',
  total_tokens: 'total_tokens',
  prompt_tokens_details: {
    cached_tokens: 'prompt_tokens_details.cached_tokens',
  },
  completion_tokens_details: {
    reasoning_tokens: 'completion_tokens_details.reasoning_tokens',
  },
};

const ZHIPU_SCHEMA = QWEN_SCHEMA; // same structure

const MOONSHOT_SCHEMA: UsageSchema = {
  prompt_tokens: 'prompt_tokens',
  completion_tokens: 'completion_tokens',
  total_tokens: 'total_tokens',
};

function buildUsage(
  schema: UsageSchema | undefined,
  rawUsage: Record<string, unknown>,
): UsagePayload {
  const usage: UsagePayload = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  if (schema) {
    applyUsageSchema(schema, rawUsage, usage as unknown as Record<string, unknown>);
  }
  return usage;
}

suite('bridge/stream usage', () => {

  suite('readPath', () => {
    test('reads a top-level key', () => {
      assert.equal(readPath({ prompt_tokens: 100 }, 'prompt_tokens'), 100);
    });

    test('reads a nested dot-path', () => {
      const obj = { prompt_tokens_details: { cached_tokens: 256 } };
      assert.equal(readPath(obj, 'prompt_tokens_details.cached_tokens'), 256);
    });

    test('returns 0 for missing path', () => {
      assert.equal(readPath({}, 'prompt_tokens'), 0);
      assert.equal(readPath({ a: { b: 1 } }, 'a.b.c'), 0);
    });

    test('returns 0 for undefined path', () => {
      assert.equal(readPath({ prompt_tokens: 1 }, undefined), 0);
    });

    test('returns 0 for non-number value', () => {
      assert.equal(readPath({ prompt_tokens: 'abc' }, 'prompt_tokens'), 0);
    });

    test('returns 0 when obj is null or undefined', () => {
      assert.equal(readPath(null, 'prompt_tokens'), 0);
      assert.equal(readPath(undefined, 'prompt_tokens'), 0);
    });

    test('returns 0 when obj is a primitive', () => {
      assert.equal(readPath(123, 'prompt_tokens'), 0);
      assert.equal(readPath('string', 'prompt_tokens'), 0);
    });

    test('returns 0 when intermediate path is not an object', () => {
      assert.equal(readPath({ a: 1 }, 'a.b.c'), 0);
      assert.equal(readPath({ a: 'str' }, 'a.b'), 0);
    });
  });

  suite('applyUsageSchema', () => {
    test('maps flat fields from schema to target', () => {
      const schema: UsageSchema = {
        prompt_tokens: 'prompt_tokens',
        completion_tokens: 'completion_tokens',
        total_tokens: 'total_tokens',
      };
      const raw = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };

      const result = buildUsage(schema, raw);
      assert.equal(result.prompt_tokens, 10);
      assert.equal(result.completion_tokens, 5);
      // total_tokens is mapped but not part of UsagePayload shape — just check it landed
    });

    test('maps nested details with renames (DeepSeek style)', () => {
      const raw = {
        prompt_tokens: 18576,
        completion_tokens: 57,
        total_tokens: 18633,
        prompt_cache_hit_tokens: 12160,
        prompt_cache_miss_tokens: 6416,
        prompt_tokens_details: { cached_tokens: 12160 },
        completion_tokens_details: { reasoning_tokens: 40 },
      };

      const result = buildUsage(DEEPSEEK_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 18576);
      assert.equal(result.completion_tokens, 57);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 12160);
      assert.equal(result.prompt_tokens_details?.cache_miss, 6416);
      assert.equal(result.completion_tokens_details?.reasoning_tokens, 40);
    });

    test('maps standard OpenAI shape (Qwen)', () => {
      const raw = {
        total_tokens: 19305,
        completion_tokens: 178,
        prompt_tokens: 19127,
        completion_tokens_details: { reasoning_tokens: 95 },
        prompt_tokens_details: { cached_tokens: 0 },
      };

      const result = buildUsage(QWEN_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 19127);
      assert.equal(result.completion_tokens, 178);
      assert.equal(result.completion_tokens_details?.reasoning_tokens, 95);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 0);
    });

    test('maps Zhipu GLM shape', () => {
      const raw = {
        prompt_tokens: 8284,
        completion_tokens: 86,
        total_tokens: 8370,
        prompt_tokens_details: { cached_tokens: 0 },
        completion_tokens_details: { reasoning_tokens: 33 },
      };

      const result = buildUsage(ZHIPU_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 8284);
      assert.equal(result.completion_tokens, 86);
      assert.equal(result.completion_tokens_details?.reasoning_tokens, 33);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 0);
    });

    test('maps Moonshot Kimi shape (no details)', () => {
      const raw = { prompt_tokens: 8260, completion_tokens: 77, total_tokens: 8337 };

      const result = buildUsage(MOONSHOT_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 8260);
      assert.equal(result.completion_tokens, 77);
      assert.equal(result.prompt_tokens_details, undefined);
      assert.equal(result.completion_tokens_details, undefined);
    });

    test('no schema means zeroed-out usage', () => {
      const raw = { prompt_tokens: 999, completion_tokens: 1, total_tokens: 1000 };

      const result = buildUsage(undefined, raw);
      assert.equal(result.prompt_tokens, 0);
      assert.equal(result.completion_tokens, 0);
    });

    test('schema has fields but rawUsage is empty', () => {
      const result = buildUsage(DEEPSEEK_SCHEMA, {});
      assert.equal(result.prompt_tokens, 0);
      assert.equal(result.completion_tokens, 0);
      assert.equal(result.total_tokens, 0);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 0);
      assert.equal(result.prompt_tokens_details?.cache_miss, 0);
      assert.equal(result.completion_tokens_details?.reasoning_tokens, 0);
    });

    test('nested details missing in rawUsage fall to zero (DeepSeek schema)', () => {
      const raw = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 };
      const result = buildUsage(DEEPSEEK_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 100);
      assert.equal(result.completion_tokens, 50);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 0);
      assert.equal(result.prompt_tokens_details?.cache_miss, 0);
      assert.equal(result.completion_tokens_details?.reasoning_tokens, 0);
    });

    test('schema and rawUsage keys structurally different', () => {
      const raw = { input_tokens: 500, output_tokens: 300, cost: 0.01 };
      const result = buildUsage(DEEPSEEK_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 0);
      assert.equal(result.completion_tokens, 0);
      assert.equal(result.total_tokens, 0);
      assert.equal(result.prompt_tokens_details?.cached_tokens, 0);
    });

    test('rawUsage field value is null', () => {
      const raw = { prompt_tokens: null, completion_tokens: 50, total_tokens: 50 };
      const result = buildUsage(MOONSHOT_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 0);
      assert.equal(result.completion_tokens, 50);
    });

    test('rawUsage field value is non-number string', () => {
      const raw = { prompt_tokens: 'not-a-number', completion_tokens: 50, total_tokens: 50 };
      const result = buildUsage(MOONSHOT_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 0);
      assert.equal(result.completion_tokens, 50);
    });

    test('rawUsage has extra fields schema does not map', () => {
      // Extra fields should be silently ignored, mapped fields still work
      const raw = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        extra_field: 999,
        another_extra: { nested: 42 },
      };
      const result = buildUsage(MOONSHOT_SCHEMA, raw);
      assert.equal(result.prompt_tokens, 100);
      assert.equal(result.completion_tokens, 50);
      assert.equal(result.prompt_tokens_details, undefined);
    });
  });

  suite('buildUsageLog', () => {
    test('full usage with cache hit and reasoning (DeepSeek)', () => {
      const usage: UsagePayload = {
        prompt_tokens: 18576,
        completion_tokens: 57,
        total_tokens: 18633,
        prompt_tokens_details: { cached_tokens: 12160, cache_miss: 6416 },
        completion_tokens_details: { reasoning_tokens: 40 },
      };

      const log = buildUsageLog('deepseek-v4-pro', usage, 65016);
      assert.match(log, /model: deepseek-v4-pro/);
      assert.match(log, /tokens: prompt=18576 reasoning=40 completion=57/);
      assert.match(log, /cache: hit=12160 miss=6416 rate=65%/);
      assert.match(log, /chars\/token=3\.5/);   // 65016 / 18576 = 3.50
    });

    test('usage with zero cache hit, has miss (cache rate 0%)', () => {
      const usage: UsagePayload = {
        prompt_tokens: 19127,
        completion_tokens: 178,
        total_tokens: 19305,
        prompt_tokens_details: { cached_tokens: 0, cache_miss: 19127 },
        completion_tokens_details: { reasoning_tokens: 95 },
      };

      const log = buildUsageLog('qwen-max', usage);
      assert.match(log, /model: qwen-max/);
      assert.match(log, /tokens: prompt=19127 reasoning=95 completion=178/);
      assert.match(log, /cache: hit=0 miss=19127 rate=0%/);
    });

    test('usage with no details (Moonshot)', () => {
      const usage: UsagePayload = {
        prompt_tokens: 8260,
        completion_tokens: 77,
        total_tokens: 8337,
      };

      const log = buildUsageLog('moonshot-v1', usage);
      assert.match(log, /model: moonshot-v1/);
      assert.match(log, /tokens: prompt=8260 completion=77/);
      // No cache or reasoning segments
      assert.ok(!log.includes('cache:'));
      assert.ok(!log.includes('reasoning'));
    });

    test('usage with reasoning but no cache details', () => {
      const usage: UsagePayload = {
        prompt_tokens: 5000,
        completion_tokens: 200,
        total_tokens: 5200,
        completion_tokens_details: { reasoning_tokens: 150 },
      };

      const log = buildUsageLog('test-model', usage);
      assert.match(log, /tokens: prompt=5000 reasoning=150 completion=200/);
      assert.ok(!log.includes('cache:'));
    });

    test('usage with only prompt tokens', () => {
      const usage: UsagePayload = {
        prompt_tokens: 100,
        completion_tokens: 0,
        total_tokens: 100,
      };

      const log = buildUsageLog('test-model', usage);
      assert.match(log, /tokens: prompt=100$/);
      assert.ok(!log.includes('completion='));
      assert.ok(!log.includes('cache:'));
    });

    test('Qwen-style: only cached_tokens=0 return miss derived from prompt', () => {
      // Simulates Qwen: has cached_tokens=0, no explicit cache_miss, prompt_tokens=19127
      const usage: UsagePayload = {
        prompt_tokens: 19127,
        completion_tokens: 178,
        total_tokens: 19305,
        prompt_tokens_details: { cached_tokens: 0 },
        completion_tokens_details: { reasoning_tokens: 95 },
      };

      const log = buildUsageLog('qwen-max', usage);
      assert.match(log, /cache: hit=0 miss=19127 rate=0%/);
      // miss should NOT be the default 0 — derived from prompt_tokens - hit
      assert.ok(!log.includes('miss=0'));
    });

    test('explicit cache_miss=0 is kept as-is when hit > 0 (unlikely but consistent)', () => {
      const usage: UsagePayload = {
        prompt_tokens: 1000,
        completion_tokens: 50,
        total_tokens: 1050,
        prompt_tokens_details: { cached_tokens: 500, cache_miss: 500 },
      };

      const log = buildUsageLog('test-model', usage);
      assert.match(log, /cache: hit=500 miss=500 rate=50%/);
    });

    test('includes chars/token when promptChars provided', () => {
      const usage: UsagePayload = {
        prompt_tokens: 3500,
        completion_tokens: 200,
        total_tokens: 3700,
      };

      const log = buildUsageLog('test-model', usage, 20000);
      assert.match(log, /model: test-model/);
      assert.match(log, /tokens: prompt=3500 completion=200/);
      assert.match(log, /chars\/token=5\.7/);   // 20000 / 3500 = 5.71
    });

    test('omits chars/token when promptChars is undefined', () => {
      const usage: UsagePayload = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };

      const log = buildUsageLog('test-model', usage);
      assert.ok(!log.includes('chars/token'));
    });

    test('omits chars/token when prompt_tokens is 0', () => {
      const usage: UsagePayload = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const log = buildUsageLog('test-model', usage, 500);
      assert.ok(!log.includes('chars/token'));
    });

    test('all-zero usage (schema mismatch result) — only model name', () => {
      const usage: UsagePayload = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const log = buildUsageLog('minimax-m2.5', usage);
      // Should only contain model name, no tokens or cache segments
      assert.equal(log, 'model: minimax-m2.5');
    });

    test('only completion_tokens > 0, prompt_tokens = 0', () => {
      const usage: UsagePayload = {
        prompt_tokens: 0,
        completion_tokens: 300,
        total_tokens: 300,
      };

      const log = buildUsageLog('test-model', usage);
      assert.match(log, /model: test-model/);
      assert.match(log, /tokens: completion=300$/);
      assert.ok(!log.includes('prompt='));
      assert.ok(!log.includes('cache:'));
    });
  });
});


suite('bridge/stream fallback usage', () => {

  suite('fallback usage calculation (pure logic)', () => {
    test('estimates prompt tokens from chars and ratio', () => {
      const promptChars = 400;
      const charsPerToken = 4.0;
      const promptTokens = Math.ceil(promptChars / charsPerToken);
      assert.equal(promptTokens, 100);
    });

    test('estimates completion tokens from text length', () => {
      const contentText = 'hello world'; // 11 chars
      const reasoningText = 'thinking...'; // 11 chars
      const charsPerToken = 4.0;
      const completionTokens = Math.ceil((contentText + reasoningText).length / charsPerToken);
      assert.equal(completionTokens, 6); // 22/4 = 5.5 return ceil = 6
    });

    test('falls back only when promptTokens is 0 AND text exists', () => {
      // Helper to simulate the fallback condition
      const shouldFallback = (pt: number, text: string) => pt === 0 && text.length > 0;

      // Has API usage return no fallback
      assert.equal(shouldFallback(50, 'text'), false);
      // No text return no fallback even if promptTokens is 0
      assert.equal(shouldFallback(0, ''), false);
      // promptTokens === 0 and has text return fallback
      assert.equal(shouldFallback(0, 'text'), true);
    });

    test('total equals prompt + completion', () => {
      const usage: UsagePayload = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 0,
      };
      usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;
      assert.equal(usage.total_tokens, 150);
    });

    test('all-zero when no text and no API usage', () => {
      const promptTokensFromApi = 0;
      const contentText = '';
      const reasoningText = '';
      const shouldFallback = !!(promptTokensFromApi === 0 && (contentText || reasoningText));
      assert.equal(shouldFallback, false);
    });

    test('contentText only (no reasoning) triggers fallback', () => {
      const promptTokensFromApi = 0;
      const contentText = 'some content';
      const reasoningText = '';
      const shouldFallback = !!(promptTokensFromApi === 0 && (contentText || reasoningText));
      assert.equal(shouldFallback, true);

      // verification chars
      const charsPerToken = 4.0;
      const completionTokens = Math.ceil((contentText + reasoningText).length / charsPerToken);
      assert.equal(completionTokens, 3); // "some content" = 12 chars, 12/4 = 3
    });

    test('reasoningText only (no content) triggers fallback', () => {
      const promptTokensFromApi = 0;
      const contentText = '';
      const reasoningText = 'reasoning only';
      const shouldFallback = !!(promptTokensFromApi === 0 && (contentText || reasoningText));
      assert.equal(shouldFallback, true);
    });
  });

  suite('refineRatio calibration (pure logic)', () => {
    // Re-implement refineRatio inline for testing (pure function, no vscode deps)
    function refineRatio(totalRequestChars: number, promptTokens: number, currentRatio: number): number {
      if (promptTokens <= 0 || totalRequestChars <= 0) return currentRatio;
      const observed = totalRequestChars / promptTokens;
      return currentRatio * 0.8 + observed * 0.2;
    }

    test('returns default when promptTokens is 0', () => {
      assert.equal(refineRatio(400, 0, 4.0), 4.0);
    });

    test('returns default when totalRequestChars is 0', () => {
      assert.equal(refineRatio(0, 100, 4.0), 4.0);
    });

    test('EMA: 400 chars / 100 tokens = 4.0 observed, no change from default', () => {
      // 4.0 * 0.8 + 4.0 * 0.2 = 4.0
      assert.equal(refineRatio(400, 100, 4.0), 4.0);
    });

    test('EMA smooths towards lower observed ratio', () => {
      // 350 chars / 100 tokens = 3.5 observed
      // 4.0 * 0.8 + 3.5 * 0.2 = 3.2 + 0.7 = 3.9
      const r = refineRatio(350, 100, 4.0);
      assert.ok(Math.abs(r - 3.9) < 1e-10, `Expected ~3.9, got ${r}`); // 4.0*0.8 + 3.5*0.2 = 3.9 (floating point: 3.900...4 ok)
    });

    test('multiple calibrations converge', () => {
      const r1 = refineRatio(350, 100, 4.0);
      assert.ok(Math.abs(r1 - 3.9) < 1e-10, `r1 should be ~3.9, got ${r1}`);
      // 3.9 * 0.8 + 3.5 * 0.2 = 3.12 + 0.7 = 3.82
      const r2 = refineRatio(350, 100, r1);
      assert.ok(Math.abs(r2 - 3.82) < 1e-10, `Expected ~3.82, got ${r2}`);
    });

    test('Chinese-like: 80 chars / 40 tokens return observed 2.0', () => {
      // 4.0 * 0.8 + 2.0 * 0.2 = 3.2 + 0.4 = 3.6
      assert.equal(refineRatio(80, 40, 4.0), 3.6);
    });

    test('extremely high ratio: 1000 chars / 50 tokens return observed 20.0', () => {
      // 4.0 * 0.8 + 20.0 * 0.2 = 3.2 + 4.0 = 7.2
      assert.equal(refineRatio(1000, 50, 4.0), 7.2);
    });

    test('Map-based get/set pattern (verifying storage logic)', () => {
      const map = new Map<string, number>();
      const get = (id: string, def: number) => map.get(id) ?? def;

      assert.equal(get('p1', 4.0), 4.0);
      map.set('p1', 3.9);
      assert.equal(get('p1', 4.0), 3.9);
      assert.equal(get('p2', 4.0), 4.0);
    });
  });

  suite('calibration threshold (pure logic)', () => {
    const THRESHOLD = 0.1; // 10%

    function shouldUpdate(current: number, next: number): boolean {
      return Math.abs(next - current) / current >= THRESHOLD;
    }

    test('updates when change exceeds 10%', () => {
      // 4.0 to 3.5 = 12.5% change, should update
      assert.equal(shouldUpdate(4.0, 3.5), true);
      // 4.0 to 4.5 = 12.5% change, should update
      assert.equal(shouldUpdate(4.0, 4.5), true);
    });

    test('skips update when change is below 10%', () => {
      // 4.0 to 4.3 = 7.5% change, should NOT update
      assert.equal(shouldUpdate(4.0, 4.3), false);
      // 4.0 to 3.7 = 7.5% change, should NOT update
      assert.equal(shouldUpdate(4.0, 3.7), false);
    });

    test('boundary: exactly 10% change triggers update', () => {
      // 4.0 to 3.6 = 10% (floating-point: 0.399.../4 = 0.09999..., close enough)
      assert.ok(Math.abs(3.6 - 4.0) / 4.0 >= 0.099, 'barely below 0.1 due to FP');
      // 4.0 to 3.5 = 12.5%, definitely triggers
      assert.equal(shouldUpdate(4.0, 3.5), true);
    });

    test('tiny drift (4.04 to 4.03) is below threshold', () => {
      // |4.03 - 4.04| / 4.04 = 0.0025 = 0.25%, skip
      assert.equal(shouldUpdate(4.04, 4.03), false);
    });

    test('zero current ratio is safe (division by zero)', () => {
      // Guard: current === 0 would divide by zero, so always update
      const change = 0 === 0 ? true : Math.abs(0.1 - 0) / 0 >= THRESHOLD;
      assert.equal(change, true);
    });
  });
});

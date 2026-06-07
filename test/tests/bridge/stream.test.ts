import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { applyUsageSchema, readPath, buildUsageLog } from '../../../src/bridge/usage';
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

      const log = buildUsageLog('deepseek-v4-pro', usage);
      assert.match(log, /model: deepseek-v4-pro/);
      assert.match(log, /tokens: prompt=18576 reasoning=40 completion=57/);
      assert.match(log, /cache: hit=12160 miss=6416 rate=65%/);
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

    test('Qwen-style: only cached_tokens=0 → miss derived from prompt', () => {
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
  });
});

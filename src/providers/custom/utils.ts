import type { ModelItem, ThinkingConfig } from '../types';
import { CUSTOM } from './provider';
import type { CustomModelConfig } from './types';
import { backfillModel } from '../loader';
import { MODEL_THINKING_MAP, DEFAULT_REASONING_LEVELS } from '../defines';

/**
 * Build {@link ModelItem} entries from custom provider's models[] configuration array.
 */
export function buildCustomModels(configs: readonly CustomModelConfig[]): ModelItem[] {
  const result: ModelItem[] = [];
  /** Counter appended to endpoint id so modelKey({same id, same url})+modelKey are unique. */
  let seq = 0;

  for (const cfg of configs) {
    const thinkingConfig = resolveThinkingConfig(cfg);
    seq++;

    const model: ModelItem = {
      id: cfg.id,
      label: cfg.name,
      apiId: cfg.id,
      family: 'custom',
      version: 'custom',
      maxInputTokens: cfg.maxInputTokens,
      maxOutputTokens: cfg.maxOutputTokens,
      detailKey: `Custom model: ${cfg.id}`,
      thinking: cfg.thinking ?? thinkingConfig !== undefined,
      thinkingTag: cfg.thinkingTag,
      thinkingConfig,
      imageInput: cfg.vision,
      maxTools: cfg.maxTools ?? (cfg.toolCalling ? 128 : undefined),
      source: 'custom',
      provider: CUSTOM,
      url: cfg.url,
      // Virtual endpoint so modelKey produces a unique key even when id+url match
      endpoint: { id: `ep${seq}`, label: '', url: cfg.url } as ModelItem['endpoint'],
    };

    backfillModel(model);

    result.push(model);
  }

  return result;
}

/**
 * Resolve `supportsReasoningEffort` from a custom model config into a
 * {@link ThinkingConfig}.
 *
 * Resolution order:
 * 1. If `supportsReasoningEffort` is explicitly set, use it as-is.
 * 2. If the model has `thinking: true` and its `id` matches a known model,
 *    use the pre-built vendor-specific config.
 * 3. If the model has `thinking: true` but no match, fall back to a generic
 *    chat-completions `reasoning_effort` config.
 */
function resolveThinkingConfig(cfg: CustomModelConfig): ThinkingConfig | undefined {
  if (cfg.supportsReasoningEffort) {
    return expandThinkingConfig(cfg.supportsReasoningEffort, cfg.reasoningEffortFormat);
  }

  if (cfg.thinking !== true) return undefined;

  const mapped = MODEL_THINKING_MAP.get(cfg.id);
  if (mapped) return mapped;

  return expandThinkingConfig(DEFAULT_REASONING_LEVELS, cfg.reasoningEffortFormat);
}
function expandThinkingConfig(
  raw: readonly string[] | ThinkingConfig,
  fmt?: 'chat-completions' | 'responses',
): ThinkingConfig {
  if (!Array.isArray(raw)) return raw as ThinkingConfig;

  const levels = raw as readonly string[];
  const format = fmt ?? 'chat-completions';

  const options = levels.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
    hint: '',
    requestFields:
      format === 'responses' ? { reasoning: { effort: level } } : { reasoning_effort: level },
  }));

  return { default: levels[0], options };
}

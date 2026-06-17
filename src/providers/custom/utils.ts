import type { ModelItem, ThinkingConfig } from '../types';
import { CUSTOM } from './provider';
import type { CustomModelConfig } from './types';
import { backfillModel } from '../loader';

/**
 * Build {@link ModelItem} entries from custom provider's models[] configuration array.
 */
export function buildCustomModels(configs: readonly CustomModelConfig[]): ModelItem[] {
  const result: ModelItem[] = [];

  for (const cfg of configs) {
    const thinkingConfig = resolveThinkingConfig(cfg);

    const model: ModelItem = {
      id: cfg.id,
      label: cfg.name,
      apiId: cfg.id,
      family: 'custom',
      version: '',
      maxInputTokens: cfg.maxInputTokens,
      maxOutputTokens: cfg.maxOutputTokens,
      detailKey: `Custom model: ${cfg.id}`,
      thinking: cfg.thinking ?? thinkingConfig !== undefined,
      thinkingConfig,
      imageInput: cfg.vision,
      maxTools: cfg.toolCalling ? undefined : 0,
      source: 'custom',
      provider: CUSTOM,
      url: cfg.url,
    };

    backfillModel(model);

    result.push(model);
  }

  return result;
}

/**
 * Resolve `supportsReasoningEffort` from a custom model config into a
 * {@link ThinkingConfig}. Handles both the simple string-array form and the
 * full {@link ThinkingConfig} object form.
 */
function resolveThinkingConfig(cfg: CustomModelConfig): ThinkingConfig | undefined {
  const raw = cfg.supportsReasoningEffort;
  if (!raw) return undefined;

  // Full ThinkingConfig form: already has options with requestFields etc.
  if (!Array.isArray(raw)) {
    return raw as ThinkingConfig;
  }

  // Simple string-array form: auto-expand each into a ThinkingOption.
  const levels = raw as readonly string[];
  if (levels.length === 0) return undefined;

  const fmt = cfg.reasoningEffortFormat ?? 'chat-completions';

  const options = levels.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
    hint: '',
    requestFields:
      fmt === 'responses'
        ? { reasoning: { effort: level } }
        : { reasoning_effort: level },
  }));

  return {
    default: levels[0],
    options,
  };
}

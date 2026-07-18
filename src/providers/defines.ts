import type { ThinkingConfig } from './types';

export const DEEPSEEK_THINKING: ThinkingConfig = {
  default: 'high',
  options: [
    {
      value: 'high',
      label: 'think.high',
      hint: 'think.high.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'high' },
    },
    {
      value: 'max',
      label: 'think.max',
      hint: 'think.max.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'max' },
    },
    {
      value: 'none',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const QWEN_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    {
      value: 'adaptive',
      label: 'think.adaptive',
      hint: 'think.adaptive.hint',
      requestFields: { enable_thinking: true },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { enable_thinking: false },
    },
  ],
};

export const ZHIPU_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    {
      value: 'adaptive',
      label: 'think.adaptive',
      hint: 'think.adaptive.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

// GLM-5.2 exposes reasoning_effort (high/max) on top of the thinking switch,
// mirroring DeepSeek's effort levels.
export const ZHIPU_GLM52_THINKING: ThinkingConfig = {
  default: 'high',
  options: [
    {
      value: 'high',
      label: 'think.high',
      hint: 'think.high.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'high' },
    },
    {
      value: 'max',
      label: 'think.max',
      hint: 'think.max.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'max' },
    },
    {
      value: 'none',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MINIMAX_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    {
      value: 'adaptive',
      label: 'think.adaptive',
      hint: 'think.adaptive.hint',
      requestFields: { thinking: { type: 'adaptive' } },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MOONSHOT_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    {
      value: 'adaptive',
      label: 'think.adaptive',
      hint: 'think.adaptive.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MOONSHOT_K26_THINKING: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'think.enabled',
      hint: 'think.enabled.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'enabled_keep',
      label: 'think.enabledKeep',
      hint: 'think.enabledKeep.hint',
      requestFields: { thinking: { type: 'enabled', keep: 'all' } },
    },
    {
      value: 'disabled',
      label: 'think.disabled',
      hint: 'think.disabled.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MOONSHOT_K27_THINKING: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'model.kimi.think.enabledAlways',
      hint: 'model.kimi.think.enabledAlways.hint',
      requestFields: { thinking: { type: 'enabled', keep: 'all' } },
    },
  ],
};

export const MOONSHOT_K3_THINKING: ThinkingConfig = {
  default: 'max',
  options: [
    {
      value: 'max',
      label: 'model.kimi.reasoningEffort.max',
      hint: 'model.kimi.reasoningEffort.max.hint',
      requestFields: { reasoning_effort: 'max' },
    },
  ],
};

export const MOONSHOT_KIMI_CODE_THINKING: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'think.enabled',
      hint: 'think.enabled.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'disabled',
      label: 'think.disabled',
      hint: 'think.disabled.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MOONSHOT_KIMI_CODE_K3_THINKING: ThinkingConfig = {
  default: 'max',
  options: [
    {
      value: 'max',
      label: 'think.max',
      hint: 'think.max.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'max' },
    },
    {
      value: 'high',
      label: 'think.high',
      hint: 'think.high.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'high' },
    },
    {
      value: 'low',
      label: 'think.low',
      hint: 'think.low.hint',
      requestFields: { thinking: { type: 'enabled' }, reasoning_effort: 'low' },
    },
    {
      value: 'none',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const ANTHROPIC_THINKING: ThinkingConfig = {
  default: 'high',
  options: [
    {
      value: 'high',
      label: 'High',
      hint: 'Extended thinking with 16K token budget',
      requestFields: { thinking: { type: 'enabled', budget_tokens: 16000 } },
    },
    {
      value: 'disabled',
      label: 'Disabled',
      hint: 'No extended thinking',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const DEFAULT_REASONING_LEVELS: readonly string[] = ['minimal', 'low', 'medium', 'high'];

export const DEFAULT_THINKING: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'think.enabled',
      hint: 'think.enabled.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

export const MIMO_THINKING: ThinkingConfig = DEFAULT_THINKING;
export const VOLCENGINE_THINKING: ThinkingConfig = DEFAULT_THINKING;

export const MODEL_THINKING_MAP: ReadonlyMap<string, ThinkingConfig> = new Map([
  // DeepSeek
  ['deepseek-v4-pro', DEEPSEEK_THINKING],
  ['deepseek-v4-flash', DEEPSEEK_THINKING],

  // Qwen
  ['qwen3.7-max', QWEN_THINKING],
  ['qwen3.7-plus', QWEN_THINKING],
  ['qwen3.6-max', QWEN_THINKING],
  ['qwen3.6-plus', QWEN_THINKING],

  // Zhipu / GLM
  ['glm-5.2', ZHIPU_GLM52_THINKING],
  ['glm-5.1', ZHIPU_THINKING],
  ['glm-5.1-vision', ZHIPU_THINKING],

  // Moonshot / Kimi
  ['kimi-k2.7-code', MOONSHOT_K27_THINKING],
  ['kimi-k2.6', MOONSHOT_K26_THINKING],
  ['kimi-k2.5', MOONSHOT_THINKING],

  // MiniMax
  ['MiniMax-M3.1', MINIMAX_THINKING],
  ['MiniMax-M3', MINIMAX_THINKING],
  ['MiniMax-M2.5', MINIMAX_THINKING],
  ['MiniMax-M2.1', MINIMAX_THINKING],
  ['MiniMax-M2', MINIMAX_THINKING],

  // MIMO
  ['mimo-v2.5-pro', MIMO_THINKING],
  ['mimo-v2.5', MIMO_THINKING],

  // Anthropic / Claude
  ['claude-opus-4-5-20250301', ANTHROPIC_THINKING],
  ['claude-sonnet-4-20250514', ANTHROPIC_THINKING],
]);

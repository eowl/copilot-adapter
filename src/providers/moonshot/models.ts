import type { ModelItem, ReasoningAbility, ThinkingConfig } from '../types';
import { MOONSHOT } from './provider';

const MS_THINKING: ThinkingConfig = {
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

const MS_K26_THINKING: ThinkingConfig = {
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

const MS_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: true,
  reasoning: true,
};

const MS_BASE = {
  family: 'kimi' as const,
  ability: MS_ABILITY,
  provider: MOONSHOT,
  thinking: MS_THINKING,
  maxTokensField: 'max_completion_tokens',
};

const MS_K26_BASE = {
  family: 'kimi' as const,
  ability: MS_ABILITY,
  provider: MOONSHOT,
  thinking: MS_K26_THINKING,
  maxTokensField: 'max_completion_tokens',
};

export const MS_MODELS: readonly ModelItem[] = [
  {
    ...MS_K26_BASE,
    id: 'kimi-k2.6',
    label: 'Kimi K2.6',
    apiId: 'kimi-k2.6',
    version: '2.6',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.6.detail',
  },
  {
    ...MS_BASE,
    id: 'kimi-k2.5',
    label: 'Kimi K2.5',
    apiId: 'kimi-k2.5',
    version: '2.5',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.5.detail',
  },
];

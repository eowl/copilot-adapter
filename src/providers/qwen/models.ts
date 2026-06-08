import type { ModelItem, ReasoningAbility, ThinkingConfig } from '../types';
import { QWEN } from './provider';

const QWEN_THINKING: ThinkingConfig = {
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

const QWEN_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

const QWEN_VISION_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: true,
  reasoning: true,
};

const QWEN_BASE = {
  family: 'qwen' as const,
  maxTokensField: 'max_completion_tokens',
  ability: QWEN_ABILITY,
  provider: QWEN,
  thinking: QWEN_THINKING,
};

const QWEN_VISION_BASE = {
  family: 'qwen' as const,
  maxTokensField: 'max_completion_tokens',
  ability: QWEN_VISION_ABILITY,
  provider: QWEN,
  thinking: QWEN_THINKING,
};

export const QWEN_BASE_MODELS: readonly ModelItem[] = [
  {
    ...QWEN_BASE,
    id: 'qwen3.7-max',
    label: 'Qwen3.7 Max',
    apiId: 'qwen3.7-max',
    version: '3.7',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.7-max.detail',
  },
  {
    ...QWEN_VISION_BASE,
    id: 'qwen3.7-plus',
    label: 'Qwen3.7 Plus',
    apiId: 'qwen3.7-plus',
    version: '3.7',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.7-plus.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen3.6-max',
    label: 'Qwen3.6 Max',
    apiId: 'qwen3.6-max',
    version: '3.6',
    maxInputTokens: 240_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.6-max.detail',
  },
  {
    ...QWEN_VISION_BASE,
    id: 'qwen3.6-plus',
    label: 'Qwen3.6 Plus',
    apiId: 'qwen3.6-plus',
    version: '3.6',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.6-plus.detail',
  },
  {
    ...QWEN_VISION_BASE,
    id: 'qwen3.6-flash',
    label: 'Qwen3.6 Flash',
    apiId: 'qwen3.6-flash',
    version: '3.6',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.6-flash.detail',
  },
  {
    ...QWEN_VISION_BASE,
    id: 'qwen3.5-plus',
    label: 'Qwen3.5 Plus',
    apiId: 'qwen3.5-plus',
    version: '3.5',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.5-plus.detail',
  },
  {
    ...QWEN_VISION_BASE,
    id: 'qwen3.5-flash',
    label: 'Qwen3.5 Flash',
    apiId: 'qwen3.5-flash',
    version: '3.5',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3.5-flash.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen3-max',
    label: 'Qwen3 Max',
    apiId: 'qwen3-max',
    version: '3',
    maxInputTokens: 252_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3-max.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen3-coder-plus',
    label: 'Qwen3 Coder Plus',
    apiId: 'qwen3-coder-plus',
    version: '3',
    maxInputTokens: 997_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3-coder-plus.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen3-coder-flash',
    label: 'Qwen3 Coder Flash',
    apiId: 'qwen3-coder-flash',
    version: '3',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3-coder-flash.detail',
  },
];

export const QWEN_US_MODELS: readonly ModelItem[] = [
  {
    ...QWEN_BASE,
    id: 'qwen-plus-us',
    label: 'Qwen Plus (US only)',
    apiId: 'qwen-plus-us',
    version: '3',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen-plus-us.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen-flash-us',
    label: 'Qwen Flash (US only)',
    apiId: 'qwen-flash-us',
    version: '3',
    maxInputTokens: 991_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen-flash-us.detail',
  },
];

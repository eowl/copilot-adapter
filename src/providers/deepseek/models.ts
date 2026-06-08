import type { ModelItem, ReasoningAbility, ThinkingConfig } from '../types';
import { DEEPSEEK } from './provider';

const DS_THINKING: ThinkingConfig = {
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

const DS_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

const DS_BASE = {
  family: 'deepseek' as const,
  ability: DS_ABILITY,
  provider: DEEPSEEK as ModelItem['provider'],
  thinking: DS_THINKING,
};

export const DS_MODELS: readonly ModelItem[] = [
  {
    ...DS_BASE,
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    apiId: 'deepseek-v4-flash',
    version: '4',
    maxInputTokens: 616_000,
    maxOutputTokens: 384_000,
    detailKey: 'model.deepseek-v4-flash.detail',
  },
  {
    ...DS_BASE,
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    apiId: 'deepseek-v4-pro',
    version: '4',
    maxInputTokens: 616_000,
    maxOutputTokens: 384_000,
    detailKey: 'model.deepseek-v4-pro.detail',
  },
];

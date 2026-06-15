import type { ModelItem, ThinkingConfig } from '../types';
import { DEEPSEEK } from './provider';

const DS_THINKING_CONFIG: ThinkingConfig = {
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

const DS_BASE = {
  family: 'deepseek',
  provider: DEEPSEEK,
  thinking: true,
  imageInput: false,
  maxTools: 128,
  thinkingConfig: DS_THINKING_CONFIG,
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
] as ModelItem[];

import type { ModelItem } from '../types';
import { DEEPSEEK } from './provider';
import { DEEPSEEK_THINKING } from '../defines';

const DS_BASE = {
  family: 'deepseek',
  provider: DEEPSEEK,
  thinking: true,
  imageInput: false,
  maxTools: 128,
  thinkingConfig: DEEPSEEK_THINKING,
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

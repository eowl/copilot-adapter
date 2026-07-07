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

export const DEEPSEEK_V4_PRO: ModelItem = {
  ...DS_BASE,
  id: 'deepseek-v4-pro',
  label: 'DeepSeek V4 Pro',
  apiId: 'deepseek-v4-pro',
  version: '4',
  maxInputTokens: 616_000,
  maxOutputTokens: 384_000,
  detailKey: 'model.deepseek-v4-pro.detail',
  pricing: {
    USD: { cacheHitInput: 0.003625, cacheMissInput: 0.435, output: 0.87 },
    CNY: { cacheHitInput: 0.025, cacheMissInput: 3, output: 6 },
  },
  priceCategory: 'low',
} as ModelItem;

export const DEEPSEEK_V4_FLASH: ModelItem = {
  ...DS_BASE,
  id: 'deepseek-v4-flash',
  label: 'DeepSeek V4 Flash',
  apiId: 'deepseek-v4-flash',
  version: '4',
  maxInputTokens: 616_000,
  maxOutputTokens: 384_000,
  detailKey: 'model.deepseek-v4-flash.detail',
  pricing: {
    USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
    CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
  },
  priceCategory: 'low',
} as ModelItem;

export const DS_MODELS: readonly ModelItem[] = [DEEPSEEK_V4_PRO, DEEPSEEK_V4_FLASH] as ModelItem[];

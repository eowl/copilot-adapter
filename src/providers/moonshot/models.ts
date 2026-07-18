import type { ModelItem } from '../types';
import { MOONSHOT } from './provider';
import {
  MOONSHOT_THINKING,
  MOONSHOT_K26_THINKING,
  MOONSHOT_K27_THINKING,
  MOONSHOT_K3_THINKING,
  MOONSHOT_KIMI_CODE_THINKING,
  MOONSHOT_KIMI_CODE_K3_THINKING,
} from '../defines';

const MS_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MOONSHOT_THINKING,
  maxTokensField: 'max_completion_tokens',
};

const MS_K26_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MOONSHOT_K26_THINKING,
  maxTokensField: 'max_completion_tokens',
};

const MS_K27_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MOONSHOT_K27_THINKING,
  maxTokensField: 'max_completion_tokens',
};

const MS_K3_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MOONSHOT_K3_THINKING,
  maxTokensField: 'max_completion_tokens',
};

export const MS_KIMI_K3: ModelItem = {
  ...MS_K3_BASE,
  id: 'kimi-k3',
  label: 'Kimi K3',
  version: '3',
  maxInputTokens: 917_504,
  maxOutputTokens: 131_072,
  detailKey: 'model.kimi-k3.detail',
  pricing: {
    CNY: { default: { cacheInput: 2, input: 20, output: 100 } },
    USD: { default: { cacheInput: 0.3, input: 3, output: 15 } },
  },
  priceCategory: 'high',
} as ModelItem;

export const MS_KIMI_K2_7_CODE: ModelItem = {
  ...MS_K27_BASE,
  id: 'kimi-k2.7-code',
  label: 'Kimi K2.7 Code',
  version: '2.7',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.7-code.detail',
  pricing: {
    CNY: { default: { cacheInput: 1.3, input: 6.5, output: 27.0 } },
    USD: { default: { cacheInput: 0.19, input: 0.95, output: 4.0 } },
  },
  priceCategory: 'high',
} as ModelItem;

export const MS_KIMI_K2_7_CODE_HIGHSPEED: ModelItem = {
  ...MS_K27_BASE,
  id: 'kimi-k2.7-code-highspeed',
  label: 'Kimi K2.7 Code High-Speed',
  version: '2.7',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.7-code.detail',
  pricing: {
    CNY: { default: { cacheInput: 2.6, input: 13.0, output: 54.0 } },
    USD: { default: { cacheInput: 0.38, input: 1.9, output: 8.0 } },
  },
  priceCategory: 'very_high',
} as ModelItem;

export const MS_KIMI_K2_6: ModelItem = {
  ...MS_K26_BASE,
  id: 'kimi-k2.6',
  label: 'Kimi K2.6',
  version: '2.6',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.6.detail',
  pricing: {
    CNY: { default: { cacheInput: 1.1, input: 6.5, output: 27.0 } },
    USD: { default: { cacheInput: 0.16, input: 0.95, output: 4.0 } },
  },
  priceCategory: 'high',
} as ModelItem;

export const MS_KIMI_K2_5: ModelItem = {
  ...MS_BASE,
  id: 'kimi-k2.5',
  label: 'Kimi K2.5',
  version: '2.5',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.5.detail',
  pricing: {
    CNY: { default: { cacheInput: 0.7, input: 4.0, output: 21.0 } },
    USD: { default: { cacheInput: 0.1, input: 0.6, output: 3.0 } },
  },
  priceCategory: 'high',
} as ModelItem;

export const MS_KC_KIMI_K3: ModelItem = {
  ...MS_KIMI_K3,
  id: 'k3',
  label: 'Kimi Code K3',
  thinkingConfig: MOONSHOT_KIMI_CODE_K3_THINKING,
} as ModelItem;

export const MS_KC_KIMI_K2_7_CODE: ModelItem = {
  ...MS_KIMI_K2_7_CODE,
  id: 'kimi-for-coding',
  label: 'Kimi Code K2.7',
  thinkingConfig: MOONSHOT_KIMI_CODE_THINKING,
} as ModelItem;

export const MS_KC_KIMI_K2_7_CODE_HIGHSPEED: ModelItem = {
  ...MS_KIMI_K2_7_CODE_HIGHSPEED,
  id: 'kimi-for-coding-highspeed',
  label: 'Kimi Code K2.7 High-Speed',
  thinkingConfig: MOONSHOT_KIMI_CODE_THINKING,
} as ModelItem;

export const MS_MODELS: readonly ModelItem[] = [
  MS_KIMI_K3,
  MS_KIMI_K2_7_CODE,
  MS_KIMI_K2_7_CODE_HIGHSPEED,
  MS_KIMI_K2_6,
  MS_KIMI_K2_5,
] as ModelItem[];

export const MS_KC_MODELS: readonly ModelItem[] = [
  MS_KC_KIMI_K3,
  MS_KC_KIMI_K2_7_CODE,
  MS_KC_KIMI_K2_7_CODE_HIGHSPEED,
] as ModelItem[];

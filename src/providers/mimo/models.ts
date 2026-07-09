import type { ModelItem } from '../types';
import { MIMO } from './provider';
import { MIMO_THINKING } from '../defines';

const MIMO_BASE = {
  family: 'mimo',
  provider: MIMO,
  thinking: true,
  imageInput: false,
  maxTools: 128,
  thinkingConfig: MIMO_THINKING,
  maxTokensField: 'max_completion_tokens',
};

export const MIMO_MODELS: readonly ModelItem[] = [
  {
    ...MIMO_BASE,
    id: 'mimo-v2.5-pro',
    label: 'MIMO V2.5 Pro',
    apiId: 'mimo-v2.5-pro',
    version: '2.5',
    maxInputTokens: 896_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.mimo-v2.5-pro.detail',
    pricing: {
      USD: { default: { cacheInput: 0.0036, input: 0.435, output: 0.87 } },
      CNY: { default: { cacheInput: 0.025, input: 3.0, output: 6.0 } },
    },
    priceCategory: 'low',
  },
  {
    ...MIMO_BASE,
    id: 'mimo-v2.5',
    label: 'MIMO V2.5',
    apiId: 'mimo-v2.5',
    version: '2.5',
    maxInputTokens: 896_000,
    maxOutputTokens: 128_000,
    imageInput: true,
    detailKey: 'model.mimo-v2.5.detail',
    pricing: {
      USD: { default: { cacheInput: 0.0028, input: 0.14, output: 0.28 } },
      CNY: { default: { cacheInput: 0.02, input: 1.0, output: 2.0 } },
    },
    priceCategory: 'low',
  },
] as ModelItem[];

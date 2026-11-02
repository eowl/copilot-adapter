import type { ModelItem } from '../types';
import { MINIMAX } from './provider';
import { MINIMAX_THINKING, MINIMAX_THINKING_WITH_REASONING } from '../defines';

const MM_BASE = {
  family: 'minimax',
  maxInputTokens: 204_800,
  maxOutputTokens: 196_608,
  provider: MINIMAX,
  thinking: true,
  imageInput: false,
  maxTools: 64,
  thinkingTag: 'think',
  thinkingConfig: MINIMAX_THINKING,
};

const MM_M3_BASE = {
  family: 'minimax',
  maxInputTokens: 204_800,
  maxOutputTokens: 196_608,
  provider: MINIMAX,
  thinking: true,
  imageInput: true,
  maxTools: 64,
  thinkingConfig: MINIMAX_THINKING,
};

export const MM_M3_1_FLASH: ModelItem = {
  ...MM_M3_BASE,
  id: 'minimax-m3.1-flash',
  label: 'MiniMax M3.1 Flash',
  apiId: 'MiniMax-M3.1-Flash',
  maxTokensField: 'max_completion_tokens',
  version: '3',
  maxInputTokens: 1_000_000,
  maxOutputTokens: 40960,
  detailKey: 'model.minimax-m3.1-flash.detail',
  pricing: {
    CNY: {
      default: {
        cacheInput: 0.1,
        input: 1,
        output: 4,
      },
    },
    USD: {
      default: {
        cacheInput: 0.015,
        input: 0.15,
        output: 0.6,
      },
    },
  },
  priceCategory: 'low',
  thinkingField: 'reasoning_content',
  thinkingConfig: MINIMAX_THINKING_WITH_REASONING,
};

export const MM_M3: ModelItem = {
  ...MM_M3_BASE,
  id: 'minimax-m3',
  label: 'MiniMax M3',
  thinkingTag: 'think',
  maxTokensField: 'max_completion_tokens',
  apiId: 'MiniMax-M3',
  version: '3',
  maxInputTokens: 1_000_000,
  maxOutputTokens: 40960,
  detailKey: 'model.minimax-m3.detail',
  pricing: {
    CNY: {
      default: {
        // <= 512k
        cacheInput: 0.42,
        input: 2.1,
        output: 8.4,
      },
      longContext: {
        // 512K~1M
        cacheInput: 0.84,
        input: 4.2,
        output: 16.8,
      },
    },
    USD: {
      default: {
        // <= 512k
        cacheInput: 0.06,
        input: 0.3,
        output: 1.2,
      },
      longContext: {
        // 512K~1M
        cacheInput: 0.12,
        input: 0.6,
        output: 2.4,
      },
    },
  },
  priceCategory: 'low',
};

export const MM_M2_7: ModelItem = {
  ...MM_BASE,
  id: 'minimax-m2.7',
  label: 'MiniMax M2.7',
  apiId: 'MiniMax-M2.7',
  version: '2.7',
  detailKey: 'model.minimax-m2.7.detail',
  pricing: {
    CNY: {
      default: {
        cacheInput: 0.42,
        input: 2.1,
        output: 8.4,
      },
    },
    USD: {
      default: {
        cacheInput: 0.06,
        input: 0.3,
        output: 1.2,
      },
    },
  },
  priceCategory: 'low',
};

export const MM_M2_5: ModelItem = {
  ...MM_BASE,
  id: 'minimax-m2.5',
  label: 'MiniMax M2.5',
  apiId: 'MiniMax-M2.5',
  version: '2.5',
  detailKey: 'model.minimax-m2.5.detail',
};

export const MM_MODELS: readonly ModelItem[] = [MM_M3, MM_M3_1_FLASH];

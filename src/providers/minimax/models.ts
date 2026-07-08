import type { ModelItem } from '../types';
import { MINIMAX } from './provider';
import { MINIMAX_THINKING } from '../defines';

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
  contentTag: 'think',
};

const MM_M3_BASE = {
  family: 'minimax',
  maxInputTokens: 204_800,
  maxOutputTokens: 196_608,
  provider: MINIMAX,
  thinking: true,
  imageInput: true,
  maxTools: 64,
  thinkingTag: 'think',
  thinkingConfig: MINIMAX_THINKING,
  contentTag: 'think',
};

export const MM_M3: ModelItem = {
  ...MM_M3_BASE,
  id: 'minimax-m3',
  label: 'MiniMax M3',
  maxTokensField: 'max_completion_tokens',
  apiId: 'MiniMax-M3',
  version: '3',
  maxInputTokens: 1_000_000,
  maxOutputTokens: 40960,
  detailKey: 'model.minimax-m3.detail',
  pricing: {
    USD: {
      default: { // <= 512k
        cacheInput: 0.06,
        input: 0.3,
        output: 1.2,
      },
      longContext: { // 512K~1M
        cacheInput: 0.12,
        input: 0.6,
        output: 2.4,
      }
    },
    CNY: {
      default: { // <= 512k
        cacheInput: 0.42,
        input: 2.1,
        output: 8.4,
      },
      longContext: { // 512K~1M
        cacheInput: 0.84,
        input: 4.2,
        output: 16.8,
      }
    },
  },
  priceCategory: 'low',
} as ModelItem;

export const MM_M2_7: ModelItem = {
  ...MM_BASE,
  id: 'minimax-m2.7',
  label: 'MiniMax M2.7',
  apiId: 'MiniMax-M2.7',
  version: '2.7',
  detailKey: 'model.minimax-m2.7.detail',
  pricing: {
    USD: {
      default: {
        cacheInput: 0.06,
        input: 0.3,
        output: 1.2,
      },
    },
    CNY: {
      default: {
        cacheInput: 0.42,
        input: 2.1,
        output: 8.4,
      },
    },
  },
  priceCategory: 'low',
} as ModelItem;

export const MM_MODELS: readonly ModelItem[] = [
  {
    ...MM_BASE,
    id: 'minimax-m2',
    label: 'MiniMax M2',
    apiId: 'MiniMax-M2',
    version: '2',
    detailKey: 'model.minimax-m2.detail',
  },
  {
    ...MM_BASE,
    id: 'minimax-m2.1',
    label: 'MiniMax M2.1',
    apiId: 'MiniMax-M2.1',
    version: '2.1',
    detailKey: 'model.minimax-m2.1.detail',
  },
  {
    ...MM_BASE,
    id: 'minimax-m2.1-highspeed',
    label: 'MiniMax M2.1 Highspeed',
    apiId: 'MiniMax-M2.1-highspeed',
    version: '2.1',
    detailKey: 'model.minimax-m2.1-highspeed.detail',
  },
  {
    ...MM_BASE,
    id: 'minimax-m2.5',
    label: 'MiniMax M2.5',
    apiId: 'MiniMax-M2.5',
    version: '2.5',
    detailKey: 'model.minimax-m2.5.detail',
  },
  {
    ...MM_BASE,
    id: 'minimax-m2.5-highspeed',
    label: 'MiniMax M2.5 Highspeed',
    apiId: 'MiniMax-M2.5-highspeed',
    version: '2.5',
    detailKey: 'model.minimax-m2.5-highspeed.detail',
  },
  MM_M2_7,
  {
    ...MM_BASE,
    id: 'minimax-m2.7-highspeed',
    label: 'MiniMax M2.7 Highspeed',
    apiId: 'MiniMax-M2.7-highspeed',
    version: '2.7',
    detailKey: 'model.minimax-m2.7-highspeed.detail',
    pricing: {
      USD: {
        default: {
          cacheInput: 0.06,
          input: 0.6,
          output: 2.4,
        },
      },
      CNY: {
        default: {
          cacheInput: 0.42,
          input: 4.2,
          output: 16.8,
        },
      },
    },
  },
  MM_M3,
] as ModelItem[];

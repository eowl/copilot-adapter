import type { ModelItem } from '../types';
import { MOONSHOT } from './provider';
import { MOONSHOT_THINKING, MOONSHOT_K26_THINKING, MOONSHOT_K27_THINKING } from '../defines';

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

export const MS_K2_7_CODE: ModelItem = {
  ...MS_K27_BASE,
  id: 'kimi-k2.7-code',
  label: 'Kimi K2.7 Code',
  apiId: 'kimi-k2.7-code',
  version: '2.7',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.7-code.detail',
} as ModelItem;

export const MS_K2_6: ModelItem = {
  ...MS_K26_BASE,
  id: 'kimi-k2.6',
  label: 'Kimi K2.6',
  apiId: 'kimi-k2.6',
  version: '2.6',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.6.detail',
} as ModelItem;

export const MS_K2_5: ModelItem = {
  ...MS_BASE,
  id: 'kimi-k2.5',
  label: 'Kimi K2.5',
  apiId: 'kimi-k2.5',
  version: '2.5',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.kimi-k2.5.detail',
} as ModelItem;

export const MS_MODELS: readonly ModelItem[] = [
  MS_K2_6,
  MS_K2_5,
  MS_K2_7_CODE,
  {
    ...MS_K27_BASE,
    id: 'kimi-k2.7-code-highspeed',
    label: 'Kimi K2.7 High-Speed',
    apiId: 'kimi-k2.7-code-highspeed',
    version: '2.7',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.7-code-highspeed.detail',
  },
] as ModelItem[];

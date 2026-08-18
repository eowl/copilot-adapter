import type { ModelItem } from '../types';
import { QWEN } from './provider';
import { QWEN_THINKING, QWEN_3_8_MAX_THINKING } from '../defines';

const QWEN_BASE = {
  family: 'qwen',
  maxTokensField: 'max_completion_tokens',
  provider: QWEN,
  thinking: true,
  imageInput: false,
  maxTools: 128,
  thinkingConfig: QWEN_THINKING,
};

const QWEN_VISION_BASE = {
  family: 'qwen',
  maxTokensField: 'max_completion_tokens',
  provider: QWEN,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: QWEN_THINKING,
};

export const QWEN_3_8_MAX: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3.8-max',
  label: 'Qwen3.8 Max',
  version: '3.8',
  maxInputTokens: 991_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.qwen3.8-max.detail',
  thinkingConfig: QWEN_3_8_MAX_THINKING,
};

export const QWEN_3_7_MAX: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3.7-max',
  label: 'Qwen3.7 Max',
  version: '3.7',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.7-max.detail',
};

export const QWEN_3_7_PLUS: ModelItem = {
  ...QWEN_VISION_BASE,
  id: 'qwen3.7-plus',
  label: 'Qwen3.7 Plus',
  version: '3.7',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.7-plus.detail',
};

export const QWEN_3_6_MAX: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3.6-max',
  label: 'Qwen3.6 Max',
  version: '3.6',
  maxInputTokens: 240_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.6-max.detail',
};

export const QWEN_3_6_PLUS: ModelItem = {
  ...QWEN_VISION_BASE,
  id: 'qwen3.6-plus',
  label: 'Qwen3.6 Plus',
  version: '3.6',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.6-plus.detail',
};

export const QWEN_3_6_FLASH: ModelItem = {
  ...QWEN_VISION_BASE,
  id: 'qwen3.6-flash',
  label: 'Qwen3.6 Flash',
  version: '3.6',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.6-flash.detail',
};

export const QWEN_3_5_PLUS: ModelItem = {
  ...QWEN_VISION_BASE,
  id: 'qwen3.5-plus',
  label: 'Qwen3.5 Plus',
  version: '3.5',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.5-plus.detail',
};

export const QWEN_3_5_FLASH: ModelItem = {
  ...QWEN_VISION_BASE,
  id: 'qwen3.5-flash',
  label: 'Qwen3.5 Flash',
  version: '3.5',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3.5-flash.detail',
};

export const QWEN_3_MAX: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3-max',
  label: 'Qwen3 Max',
  version: '3',
  maxInputTokens: 252_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3-max.detail',
};

export const QWEN_3_CODER_PLUS: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3-coder-plus',
  label: 'Qwen3 Coder Plus',
  version: '3',
  maxInputTokens: 997_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3-coder-plus.detail',
};

export const QWEN_3_CODER_FLASH: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen3-coder-flash',
  label: 'Qwen3 Coder Flash',
  version: '3',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen3-coder-flash.detail',
};

export const QWEN_PLUS_US: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen-plus-us',
  label: 'Qwen Plus (US only)',
  version: '3',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen-plus-us.detail',
};

export const QWEN_FLASH_US: ModelItem = {
  ...QWEN_BASE,
  id: 'qwen-flash-us',
  label: 'Qwen Flash (US only)',
  version: '3',
  maxInputTokens: 991_000,
  maxOutputTokens: 65_536,
  detailKey: 'model.qwen-flash-us.detail',
};

export const QWEN_BASE_MODELS: readonly ModelItem[] = [
  QWEN_3_8_MAX,
  QWEN_3_7_MAX,
  QWEN_3_7_PLUS,
  QWEN_3_6_MAX,
  QWEN_3_6_PLUS,
  QWEN_3_6_FLASH,
  QWEN_3_5_PLUS,
  QWEN_3_5_FLASH,
  QWEN_3_MAX,
  QWEN_3_CODER_PLUS,
  QWEN_3_CODER_FLASH,
];

export const QWEN_US_MODELS: readonly ModelItem[] = [
  QWEN_PLUS_US,
  QWEN_FLASH_US,
];

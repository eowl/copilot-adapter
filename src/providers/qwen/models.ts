import type { ModelItem } from '../types';
import { QWEN } from './provider';
import { QWEN_THINKING, QWEN_3_8_MAX_THINKING } from '../defines';
import { DEEPSEEK_V4_PRO, DEEPSEEK_V4_FLASH, DEEPSEEK_V4_PRO_0813, DEEPSEEK_V4_FLASH_0731 } from '../deepseek/models';
import { ZHIPU_GLM_5_2, ZHIPU_GLM_5_1 } from '../zhipu/models';
import { MM_M3, MM_M2_7, MM_M2_5 } from '../minimax/models';
import { MS_KIMI_K2_7_CODE, MS_KIMI_K2_6, MS_KIMI_K2_5, MS_KIMI_K3 } from '../moonshot/models';
import { MIMO_V2_5_PRO } from '../mimo/models';

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

export const QWEN_3_7_PLUS_US: ModelItem = {
  ...QWEN_3_7_PLUS,
  id: 'qwen3.7-plus-us',
  label: 'Qwen3.7 Plus (US only)',
  detailKey: 'model.qwen3.7-plus-us.detail',
};

export const QWEN_3_7_MAX_US: ModelItem = {
  ...QWEN_3_7_MAX,
  id: 'qwen3.7-max-us',
  label: 'Qwen3.7 Max (US only)',
  detailKey: 'model.qwen3.7-max-us.detail',
};

export const DEEPSEEK_V4_PRO_US: ModelItem = {
  ...DEEPSEEK_V4_PRO,
  id: 'deepseek-v4-pro-us',
  label: 'DeepSeek V4 Pro (US only)',
  detailKey: 'model.deepseek-v4-pro.detail',
}

export const DEEPSEEK_V4_FLASH_US: ModelItem = {
  ...DEEPSEEK_V4_FLASH,
  id: 'deepseek-v4-flash-us',
  label: 'DeepSeek V4 Flash (US only)',
  detailKey: 'model.deepseek-v4-flash.detail',
}

export const ZHIPU_GLM_5_2_US: ModelItem = {
  ...ZHIPU_GLM_5_2,
  id: 'glm-5.2-us',
  label: 'GLM-5.2 (US only)',
  detailKey: 'model.glm-5.2.detail',
}

export const ALI_THIRD_PARTY_MM_M3: ModelItem = {
  ...MM_M3,
  id: 'MiniMax/MiniMax-M3',
  label: 'MiniMax-M3(Third Party)',
}

export const ALI_THIRD_PARTY_MM_M2_7: ModelItem = {
  ...MM_M2_7,
  id: 'MiniMax/MiniMax-M2.7',
  label: 'MiniMax-M2.7(Third Party)',
}

export const ALI_THIRD_PARTY_MM_M2_5: ModelItem = {
  ...MM_M2_5,
  id: 'MiniMax/MiniMax-M2.5',
  label: 'MiniMax-M2.5(Third Party)',
}

export const ALI_THIRD_PARTY_MS_KIMI_K3: ModelItem = {
  ...MS_KIMI_K3,
  id: 'kimi/kimi-k3',
  label: 'Kimi-K3(Third Party)',
}

export const ALI_THIRD_PARTY_MS_KIMI_K2_5: ModelItem = {
  ...MS_KIMI_K3,
  id: 'kimi/kimi-k2.5',
  label: 'Kimi-K2.5(Third Party)',
}

export const ALI_THIRD_PARTY_MS_KIMI_K2_6: ModelItem = {
  ...MS_KIMI_K3,
  id: 'kimi/kimi-k2.6',
  label: 'Kimi-K2.6(Third Party)',
}

export const ALI_THIRD_PARTY_MS_KIMI_K2_7_CODE: ModelItem = {
  ...MS_KIMI_K3,
  id: 'kimi/kimi-k2.7-code',
  label: 'Kimi-K2.7-Code(Third Party)',
}

export const ALI_THIRD_PARTY_ZHIPU_GLM_5_2: ModelItem = {
  ...ZHIPU_GLM_5_2,
  id: 'ZHIPU/GLM-5.2',
  label: 'GLM-5.2(Third Party)',
}

export const ALI_THIRD_PARTY_ZHIPU_GLM_5_1: ModelItem = {
  ...ZHIPU_GLM_5_1,
  id: 'ZHIPU/GLM-5.1',
  label: 'GLM-5.1(Third Party)',
}

export const ALI_THIRD_PARTY_MIMO_V2_5_PRO: ModelItem = {
  ...MIMO_V2_5_PRO,
  id: 'xiaomi/mimo-v2.5-pro',
  label: 'MIMO-V2.5-PRO(Third Party)',
}

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

export const ALI_DIRECT_SUPPLY_MODELS: readonly ModelItem[] = [
  DEEPSEEK_V4_PRO,
  DEEPSEEK_V4_FLASH,
  DEEPSEEK_V4_PRO_0813,
  DEEPSEEK_V4_FLASH_0731,
  ZHIPU_GLM_5_2,
  ZHIPU_GLM_5_1,
  MS_KIMI_K2_7_CODE,
  MS_KIMI_K2_6,
  MS_KIMI_K2_5,
];

export const ALI_THIRD_PARTY_MODELS: readonly ModelItem[] = [
  ALI_THIRD_PARTY_MM_M3,
  ALI_THIRD_PARTY_MM_M2_7,
  ALI_THIRD_PARTY_MM_M2_5,
  ALI_THIRD_PARTY_MS_KIMI_K2_5,
  ALI_THIRD_PARTY_MS_KIMI_K2_6,
  ALI_THIRD_PARTY_MS_KIMI_K2_7_CODE,
  ALI_THIRD_PARTY_ZHIPU_GLM_5_2,
  ALI_THIRD_PARTY_ZHIPU_GLM_5_1,
  ALI_THIRD_PARTY_MIMO_V2_5_PRO,
];

export const QWEN_CN_MODELS: readonly ModelItem[] = [
  ...QWEN_BASE_MODELS,
  ...ALI_DIRECT_SUPPLY_MODELS,
  ...ALI_THIRD_PARTY_MODELS,
]

export const QWEN_SGP_MODELS: readonly ModelItem[] = [
  ...QWEN_BASE_MODELS,
  DEEPSEEK_V4_PRO,
  DEEPSEEK_V4_FLASH,
  ZHIPU_GLM_5_2,
  ZHIPU_GLM_5_1,
  MS_KIMI_K2_7_CODE,
]

export const QWEN_DE_MODELS: readonly ModelItem[] = [
  ...QWEN_BASE_MODELS,
  DEEPSEEK_V4_PRO,
  DEEPSEEK_V4_FLASH,
  ZHIPU_GLM_5_2,
  ZHIPU_GLM_5_1,
  MS_KIMI_K2_7_CODE,
]

export const QWEN_JP_MODELS: readonly ModelItem[] = [
  ...QWEN_BASE_MODELS,
  DEEPSEEK_V4_PRO,
  DEEPSEEK_V4_FLASH,
  ZHIPU_GLM_5_2,
  ZHIPU_GLM_5_1,
  MS_KIMI_K2_7_CODE,
]

export const QWEN_US_MODELS: readonly ModelItem[] = [
  ...QWEN_BASE_MODELS,
  QWEN_PLUS_US,
  QWEN_FLASH_US,
  DEEPSEEK_V4_PRO_US,
  DEEPSEEK_V4_FLASH_US,
  ZHIPU_GLM_5_2_US,
];

import type { ModelItem, NonReasoningAbility, ReasoningAbility, ThinkingConfig } from '../types';
import { ZHIPU } from './provider';

const BM_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    {
      value: 'adaptive',
      label: 'think.adaptive',
      hint: 'think.adaptive.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'disabled',
      label: 'think.none',
      hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

const BM_REASONING_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

const BM_PLAIN_ABILITY: NonReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: false,
};

const BM_VISION_REASONING_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: true,
  reasoning: true,
};

const BM_VISION_PLAIN_ABILITY: NonReasoningAbility = {
  maxTools: 128,
  acceptsImages: true,
  reasoning: false,
};

const BM_THINK_BASE = {
  family: 'glm' as const,
  ability: BM_REASONING_ABILITY,
  provider: ZHIPU,
  thinking: BM_THINKING,
};

const BM_PLAIN_BASE = {
  family: 'glm' as const,
  ability: BM_PLAIN_ABILITY,
  provider: ZHIPU,
};

const BM_VISION_THINK_BASE = {
  family: 'glm' as const,
  ability: BM_VISION_REASONING_ABILITY,
  provider: ZHIPU,
  thinking: BM_THINKING,
};

const BM_VISION_PLAIN_BASE = {
  family: 'glm' as const,
  ability: BM_VISION_PLAIN_ABILITY,
  provider: ZHIPU,
};

export const ZP_MODELS: readonly ModelItem[] = [
  {
    ...BM_THINK_BASE,
    id: 'glm-5.1',
    label: 'GLM-5.1',
    apiId: 'glm-5.1',
    version: '5.1',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-5.1.detail',
  },
  {
    ...BM_THINK_BASE,
    id: 'glm-5',
    label: 'GLM-5',
    apiId: 'glm-5',
    version: '5',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-5.detail',
  },
  {
    ...BM_THINK_BASE,
    id: 'glm-5-turbo',
    label: 'GLM-5-Turbo',
    apiId: 'glm-5-turbo',
    version: '5',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-5-turbo.detail',
  },
  {
    ...BM_THINK_BASE,
    id: 'glm-4.7',
    label: 'GLM-4.7',
    apiId: 'glm-4.7',
    version: '4.7',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-4.7.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4.7-flashx',
    label: 'GLM-4.7-FlashX',
    apiId: 'glm-4.7-flashx',
    version: '4.7',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-4.7-flashx.detail',
  },
  {
    ...BM_THINK_BASE,
    id: 'glm-4.6',
    label: 'GLM-4.6',
    apiId: 'glm-4.6',
    version: '4.6',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-4.6.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4.5-air',
    label: 'GLM-4.5-Air',
    apiId: 'glm-4.5-air',
    version: '4.5',
    maxInputTokens: 128_000,
    maxOutputTokens: 96_000,
    detailKey: 'model.glm-4.5-air.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4.5-airx',
    label: 'GLM-4.5-AirX',
    apiId: 'glm-4.5-airx',
    version: '4.5',
    maxInputTokens: 128_000,
    maxOutputTokens: 96_000,
    detailKey: 'model.glm-4.5-airx.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4-long',
    label: 'GLM-4-Long',
    apiId: 'glm-4-long',
    version: '4',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 4_096,
    detailKey: 'model.glm-4-long.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4-flashx-250414',
    label: 'GLM-4-FlashX-250414',
    apiId: 'glm-4-flashx-250414',
    version: '4',
    maxInputTokens: 128_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.glm-4-flashx-250414.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4.7-flash',
    label: 'GLM-4.7-Flash',
    apiId: 'glm-4.7-flash',
    version: '4.7',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-4.7-flash.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4.5-flash',
    label: 'GLM-4.5-Flash',
    apiId: 'glm-4.5-flash',
    version: '4.5',
    maxInputTokens: 128_000,
    maxOutputTokens: 96_000,
    detailKey: 'model.glm-4.5-flash.detail',
  },
  {
    ...BM_PLAIN_BASE,
    id: 'glm-4-flash-250414',
    label: 'GLM-4-Flash-250414',
    apiId: 'glm-4-flash-250414',
    version: '4',
    maxInputTokens: 128_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.glm-4-flash-250414.detail',
  },
  {
    ...BM_VISION_THINK_BASE,
    id: 'glm-5v-turbo',
    label: 'GLM-5V-Turbo',
    apiId: 'glm-5v-turbo',
    version: '5',
    maxInputTokens: 200_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.glm-5v-turbo.detail',
  },
  {
    ...BM_VISION_THINK_BASE,
    id: 'glm-4.6v',
    label: 'GLM-4.6V',
    apiId: 'glm-4.6v',
    version: '4.6',
    maxInputTokens: 128_000,
    maxOutputTokens: 32_768,
    detailKey: 'model.glm-4.6v.detail',
  },
  {
    ...BM_VISION_PLAIN_BASE,
    id: 'glm-ocr',
    label: 'GLM-OCR',
    apiId: 'glm-ocr',
    version: '4',
    maxInputTokens: 128_000,
    maxOutputTokens: 4_096,
    detailKey: 'model.glm-ocr.detail',
  },
  {
    ...BM_VISION_THINK_BASE,
    id: 'glm-4.1v-thinking-flashx',
    label: 'GLM-4.1V-Thinking-FlashX',
    apiId: 'glm-4.1v-thinking-flashx',
    version: '4.1',
    maxInputTokens: 64_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.glm-4.1v-thinking-flashx.detail',
  },
  {
    ...BM_VISION_PLAIN_BASE,
    id: 'glm-4.6v-flash',
    label: 'GLM-4.6V-Flash',
    apiId: 'glm-4.6v-flash',
    version: '4.6',
    maxInputTokens: 128_000,
    maxOutputTokens: 32_768,
    detailKey: 'model.glm-4.6v-flash.detail',
  },
  {
    ...BM_VISION_THINK_BASE,
    id: 'glm-4.1v-thinking-flash',
    label: 'GLM-4.1V-Thinking-Flash',
    apiId: 'glm-4.1v-thinking-flash',
    version: '4.1',
    maxInputTokens: 64_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.glm-4.1v-thinking-flash.detail',
  },
  {
    ...BM_VISION_PLAIN_BASE,
    id: 'glm-4v-flash',
    label: 'GLM-4V-Flash',
    apiId: 'glm-4v-flash',
    version: '4',
    maxInputTokens: 16_384,
    maxOutputTokens: 1_024,
    detailKey: 'model.glm-4v-flash.detail',
  },
];

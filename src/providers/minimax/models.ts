import type { ModelItem, ReasoningAbility, ThinkingConfig } from '../types';
import { MINIMAX } from './provider';

const MM_THINKING: ThinkingConfig = {
  default: 'adaptive',
  options: [
    { value: 'adaptive', label: 'think.adaptive', hint: 'think.adaptive.hint',
      requestFields: { thinking: { type: 'enabled' } } },
    { value: 'disabled', label: 'think.none', hint: 'think.none.hint',
      requestFields: { thinking: { type: 'disabled' } } },
  ],
};

const MM_ABILITY: ReasoningAbility = {
  maxTools: 64,
  acceptsImages: false,
  reasoning: true,
  thinkTag: 'think',
};

const MM_M3_ABILITY: ReasoningAbility = {
  maxTools: 64,
  acceptsImages: true,
  reasoning: true,
  thinkTag: 'think',
};

const MM_M2 = {
  family: 'minimax' as const,
  maxInputTokens: 204_800,
  maxOutputTokens: 196_608,
  ability: MM_ABILITY,
  provider: MINIMAX,
  contentTag: 'think',
};

export const MM_MODELS: readonly ModelItem[] = [
  {
    ...MM_M2,
    id: 'minimax-m2',
    label: 'MiniMax M2',
    apiId: 'MiniMax-M2',
    version: '2',
    detailKey: 'model.minimax-m2.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.1',
    label: 'MiniMax M2.1',
    apiId: 'MiniMax-M2.1',
    version: '2.1',
    detailKey: 'model.minimax-m2.1.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.1-highspeed',
    label: 'MiniMax M2.1 Highspeed',
    apiId: 'MiniMax-M2.1-highspeed',
    version: '2.1',
    detailKey: 'model.minimax-m2.1-highspeed.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.5',
    label: 'MiniMax M2.5',
    apiId: 'MiniMax-M2.5',
    version: '2.5',
    detailKey: 'model.minimax-m2.5.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.5-highspeed',
    label: 'MiniMax M2.5 Highspeed',
    apiId: 'MiniMax-M2.5-highspeed',
    version: '2.5',
    detailKey: 'model.minimax-m2.5-highspeed.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.7',
    label: 'MiniMax M2.7',
    apiId: 'MiniMax-M2.7',
    version: '2.7',
    detailKey: 'model.minimax-m2.7.detail',
  },
  {
    ...MM_M2,
    id: 'minimax-m2.7-highspeed',
    label: 'MiniMax M2.7 Highspeed',
    apiId: 'MiniMax-M2.7-highspeed',
    version: '2.7',
    detailKey: 'model.minimax-m2.7-highspeed.detail',
  },
  {
    family: 'minimax' as const,
    id: 'minimax-m3',
    label: 'MiniMax M3',
    maxTokensField: 'max_completion_tokens',
    apiId: 'MiniMax-M3',
    version: '3',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 40960,
    ability: MM_M3_ABILITY,
    detailKey: 'model.minimax-m3.detail',
    provider: MINIMAX,
    thinking: MM_THINKING,
    contentTag: 'think',
  },
];

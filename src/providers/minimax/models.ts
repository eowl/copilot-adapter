import { t } from '../../nls';
import type { ContentParser, ModelItem, ReasoningAbility } from '../types';
import { ThinkTagParser } from '../parsers/tag';
import { imagePart } from '../utils';
import { MINIMAX } from './provider';

function mmCreateContentParser(): ContentParser {
  return new ThinkTagParser('think');
}

function m3RequestExtras(
  modelConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (modelConfig?.thinkingMode === 'disabled') {
    return { thinking: { type: 'disabled' } };
  }

  return {};
}

function m3ConfigSchema(): Record<string, unknown> {
  return {
    properties: {
      thinkingMode: {
        type: 'string',
        title: t('think.label'),
        enum: ['adaptive', 'disabled'],
        enumItemLabels: [t('think.adaptive'), t('think.none')],
        enumDescriptions: [t('think.adaptive.hint'), t('think.none.hint')],
        default: 'adaptive',
        group: 'navigation',
      },
    },
  } as const;
}

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
  createContentParser: mmCreateContentParser,
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
    id: 'minimax-m3',
    label: 'MiniMax M3',
    maxTokensField: 'max_completion_tokens',
    apiId: 'MiniMax-M3',
    family: 'minimax',
    version: '3',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 40960,
    ability: MM_M3_ABILITY,
    detailKey: 'model.minimax-m3.detail',
    provider: MINIMAX,
    requestExtras: m3RequestExtras,
    configSchema: m3ConfigSchema,
    createContentParser: mmCreateContentParser,
    formatImagePart: imagePart(),
  },
];

import { t } from '../../nls';
import type { ModelItem, ReasoningAbility } from '../types';
import { imagePart } from '../utils';
import { MOONSHOT } from './provider';

function msRequestExtras(
  modelConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (modelConfig?.thinkingMode === 'disabled') {
    return { thinking: { type: 'disabled' } };
  }

  return { thinking: { type: 'enabled' } };
}

function msK26RequestExtras(
  modelConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (modelConfig?.thinkingMode === 'disabled') {
    return { thinking: { type: 'disabled' } };
  }

  if (modelConfig?.thinkingMode === 'enabled_keep') {
    return { thinking: { type: 'enabled', keep: 'all' } };
  }

  return { thinking: { type: 'enabled' } };
}

function msConfigSchema(): Record<string, unknown> {
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

function msK26ConfigSchema(): Record<string, unknown> {
  return {
    properties: {
      thinkingMode: {
        type: 'string',
        title: t('think.label'),
        enum: ['enabled', 'enabled_keep', 'disabled'],
        enumItemLabels: [t('think.enabled'), t('think.enabledKeep'), t('think.disabled')],
        enumDescriptions: [
          t('think.enabled.hint'),
          t('think.enabledKeep.hint'),
          t('think.disabled.hint'),
        ],
        default: 'enabled',
        group: 'navigation',
      },
    },
  } as const;
}

const MS_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: true,
  reasoning: true,
};

const MS_BASE = {
  family: 'kimi' as const,
  ability: MS_ABILITY,
  provider: MOONSHOT,
  requestExtras: msRequestExtras,
  configSchema: msConfigSchema,
  maxTokensField: 'max_completion_tokens',
  formatImagePart: imagePart(),
};

export const MS_MODELS: readonly ModelItem[] = [
  {
    ...MS_BASE,
    id: 'kimi-k2.6',
    label: 'Kimi K2.6',
    apiId: 'kimi-k2.6',
    version: '2.6',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.6.detail',
    requestExtras: msK26RequestExtras,
    configSchema: msK26ConfigSchema,
  },
  {
    ...MS_BASE,
    id: 'kimi-k2.5',
    label: 'Kimi K2.5',
    apiId: 'kimi-k2.5',
    version: '2.5',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.5.detail',
  },
];

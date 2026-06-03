import { t } from '../nls';
import type { Model, Provider, ReasoningAbility } from './types';

type ThinkingEffort = 'none' | 'high' | 'max';

function parseEffort(raw: unknown): ThinkingEffort {
  if (raw === 'none') return 'none';
  if (raw === 'max') return 'max';

  return 'high';
}

function dsRequestExtras(
  modelConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const effort = parseEffort(modelConfig?.reasoningEffort);
  if (effort === 'none') {
    return { thinking: { type: 'disabled' } };
  }

  return {
    thinking: { type: 'enabled' },
    reasoning_effort: effort === 'max' ? 'max' : 'high',
  };
}

function dsConfigSchema(): Record<string, unknown> {
  return {
    properties: {
      reasoningEffort: {
        type: 'string',
        title: t('think.label'),
        enum: ['none', 'high', 'max'],
        enumItemLabels: [t('think.none'), t('think.high'), t('think.max')],
        enumDescriptions: [t('think.none.hint'), t('think.high.hint'), t('think.max.hint')],
        default: 'high',
        group: 'navigation',
      },
    },
  } as const;
}

export const DEEPSEEK: Provider = {
  id: 'deepseek',
  label: 'DeepSeek',
  detailKey: 'provider.deepseek.detail',
  endpoint: 'https://api.deepseek.com',
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.deepseek.com',
    apiKeys: 'https://platform.deepseek.com/api_keys',
    usage: 'https://platform.deepseek.com/usage',
    status: 'https://status.deepseek.com',
  },
};

const DS_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

export const DS_MODELS: readonly Model[] = [
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    apiId: 'deepseek-v4-flash',
    family: 'deepseek',
    version: '4',
    maxInputTokens: 616_000,
    maxOutputTokens: 384_000,
    ability: DS_ABILITY,
    detailKey: 'model.deepseek-v4-flash.detail',
    provider: DEEPSEEK,
    requestExtras: dsRequestExtras,
    configSchema: dsConfigSchema,
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    apiId: 'deepseek-v4-pro',
    family: 'deepseek',
    version: '4',
    maxInputTokens: 616_000,
    maxOutputTokens: 384_000,
    ability: DS_ABILITY,
    detailKey: 'model.deepseek-v4-pro.detail',
    provider: DEEPSEEK,
    requestExtras: dsRequestExtras,
    configSchema: dsConfigSchema,
  },
];

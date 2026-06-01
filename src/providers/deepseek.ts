import { t } from '../nls';
import type { Model, Provider, ReasoningAbility } from './types';

type ThinkingEffort = 'none' | 'high' | 'max';

function parseEffort(raw: unknown): ThinkingEffort {
  if (raw === 'none') return 'none';
  if (raw === 'max') return 'max';

  return 'high';
}

const DS_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

const DS_MODELS: readonly Model[] = [
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
  },
];

export const DEEPSEEK: Provider = {
  id: 'deepseek',
  label: 'DeepSeek',
  detailKey: 'provider.deepseek.detail',
  defaultEndpoint: 'https://api.deepseek.com',
  models: DS_MODELS,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.deepseek.com',
    apiKeys: 'https://platform.deepseek.com/api_keys',
    usage: 'https://platform.deepseek.com/usage',
    status: 'https://status.deepseek.com',
  },

  requestExtras(modelConfig, _model) {
    const effort = parseEffort(modelConfig?.reasoningEffort);
    if (effort === 'none') {
      return { thinking: { type: 'disabled' } };
    }
    return {
      thinking: { type: 'enabled' },
      reasoning_effort: effort === 'max' ? 'max' : 'high',
    };
  },

  configSchema(model) {
    if (!model.ability.reasoning) return undefined;
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
  },
};

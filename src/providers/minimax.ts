import { t } from '../nls';
import type { ContentParser, Model, Provider, ReasoningAbility } from './types';
import { ThinkTagParser } from './parsers/tag';

type BudgetTier = 'off' | 'standard' | 'deep';

function parseBudget(raw: unknown): BudgetTier {
  if (raw === 'off') return 'off';
  if (raw === 'deep') return 'deep';
  return 'standard';
}

function mmRequestExtras(modelConfig: Record<string, unknown> | undefined): Record<string, unknown> {
  const tier = parseBudget(modelConfig?.thinkingBudget);
  if (tier === 'off') return { thinking: { type: 'disabled' } };
  const budget = tier === 'deep' ? 80000 : 8000;
  return { thinking: { type: 'enabled', budget_tokens: budget } };
}

function mmConfigSchema(): Record<string, unknown> {
  return {
    properties: {
      thinkingBudget: {
        type: 'string',
        title: t('think.label'),
        enum: ['off', 'standard', 'deep'],
        enumItemLabels: [t('think.none'), t('think.high'), t('think.max')],
        enumDescriptions: [t('think.none.hint'), t('think.high.hint'), t('think.max.hint')],
        default: 'standard',
        group: 'navigation',
      },
    },
  } as const;
}

function mmCreateContentParser(): ContentParser {
  return new ThinkTagParser('think');
}

export const MINIMAX: Provider = {
  id: 'minimax',
  label: 'MiniMax',
  detailKey: 'provider.minimax.detail',
  endpoint: 'https://api.minimaxi.com/v1',
  tokenRatio: 4.0,
  thinkingField: 'thinking_content',
  supportsStreamUsage: false,
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.minimaxi.com',
    apiKeys: 'https://www.minimax.io/platform/user-center/basic-information/interface-key',
    usage: 'https://www.minimax.io/platform/cost-management/record',
    status: 'https://status.minimax.io',
  },
};

const MM_ABILITY: ReasoningAbility = {
  maxTools: 32,
  acceptsImages: false,
  reasoning: true,
  thinkTag: 'think',
};

const MM_M2 = {
  family: 'minimax' as const,
  maxInputTokens: 204_800,
  maxOutputTokens: 196_608,
  ability: MM_ABILITY,
  provider: MINIMAX,
  requestExtras: mmRequestExtras,
  configSchema: mmConfigSchema,
  createContentParser: mmCreateContentParser,
};

export const MM_MODELS: readonly Model[] = [
  {
    id: 'minimax-text-01',
    label: 'MiniMax Text-01',
    apiId: 'MiniMax-Text-01',
    family: 'minimax',
    version: '1',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 8192,
    ability: { maxTools: 32, acceptsImages: true, reasoning: false },
    detailKey: 'model.minimax-text-01.detail',
    provider: MINIMAX,
  },
  {
    id: 'minimax-m1',
    label: 'MiniMax M1',
    apiId: 'MiniMax-M1',
    family: 'minimax',
    version: '1',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 40960,
    ability: MM_ABILITY,
    detailKey: 'model.minimax-m1.detail',
    provider: MINIMAX,
    requestExtras: mmRequestExtras,
    configSchema: mmConfigSchema,
    createContentParser: mmCreateContentParser,
  },
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
];

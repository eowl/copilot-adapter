import { t } from '../nls';
import type { Model, Provider, ReasoningAbility } from './types';

function qwenRequestExtras(
  modelConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (modelConfig?.thinkingMode === 'disabled') {
    return { enable_thinking: false };
  }

  return { enable_thinking: true };
}

function qwenConfigSchema(): Record<string, unknown> {
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

export const QWEN: Provider = {
  id: 'qwen',
  label: 'Qwen',
  detailKey: 'provider.qwen.detail',
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'dashscope.aliyuncs.com',
    apiKeys: 'https://bailian.console.aliyun.com/?apiKey=1',
    usage: 'https://bailian.console.aliyun.com/#/expense',
    status: 'https://status.aliyun.com',
  },
};

const QWEN_ABILITY: ReasoningAbility = {
  maxTools: 128,
  acceptsImages: false,
  reasoning: true,
};

const QWEN_BASE = {
  family: 'qwen' as const,
  maxTokensField: 'max_completion_tokens',
  ability: QWEN_ABILITY,
  provider: QWEN,
  requestExtras: qwenRequestExtras,
  configSchema: qwenConfigSchema,
};

export const QWEN_MODELS: readonly Model[] = [
  {
    ...QWEN_BASE,
    id: 'qwen3-max',
    label: 'Qwen3 Max',
    apiId: 'qwen3-max',
    version: '3',
    maxInputTokens: 256_000,
    maxOutputTokens: 32_768,
    detailKey: 'model.qwen3-max.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen-plus',
    label: 'Qwen Plus',
    apiId: 'qwen-plus',
    version: '3',
    maxInputTokens: 128_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.qwen-plus.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen-turbo',
    label: 'Qwen Turbo',
    apiId: 'qwen-turbo',
    version: '3',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 16_384,
    detailKey: 'model.qwen-turbo.detail',
  },
  {
    ...QWEN_BASE,
    id: 'qwen3-coder-plus',
    label: 'Qwen3 Coder Plus',
    apiId: 'qwen3-coder-plus',
    version: '3',
    maxInputTokens: 1_000_000,
    maxOutputTokens: 65_536,
    detailKey: 'model.qwen3-coder-plus.detail',
  },
];

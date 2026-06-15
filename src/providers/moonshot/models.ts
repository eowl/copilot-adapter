import type { ModelItem, ThinkingConfig } from '../types';
import { MOONSHOT } from './provider';

const MS_THINKING_CONFIG: ThinkingConfig = {
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

const MS_K26_THINKING_CONFIG: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'think.enabled',
      hint: 'think.enabled.hint',
      requestFields: { thinking: { type: 'enabled' } },
    },
    {
      value: 'enabled_keep',
      label: 'think.enabledKeep',
      hint: 'think.enabledKeep.hint',
      requestFields: { thinking: { type: 'enabled', keep: 'all' } },
    },
    {
      value: 'disabled',
      label: 'think.disabled',
      hint: 'think.disabled.hint',
      requestFields: { thinking: { type: 'disabled' } },
    },
  ],
};

const MS_K27_THINKING_CONFIG: ThinkingConfig = {
  default: 'enabled',
  options: [
    {
      value: 'enabled',
      label: 'model.kimi.think.enabledAlways',
      hint: 'model.kimi.think.enabledAlways.hint',
      requestFields: { thinking: { type: 'enabled', keep: 'all' } },
    },
  ],
};

const MS_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MS_THINKING_CONFIG,
  maxTokensField: 'max_completion_tokens',
};

const MS_K26_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MS_K26_THINKING_CONFIG,
  maxTokensField: 'max_completion_tokens',
};

const MS_K27_BASE = {
  family: 'kimi',
  provider: MOONSHOT,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: MS_K27_THINKING_CONFIG,
  maxTokensField: 'max_completion_tokens',
};

export const MS_MODELS: readonly ModelItem[] = [
  {
    ...MS_K26_BASE,
    id: 'kimi-k2.6',
    label: 'Kimi K2.6',
    apiId: 'kimi-k2.6',
    version: '2.6',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.6.detail',
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
  {
    ...MS_K27_BASE,
    id: 'kimi-k2.7-code',
    label: 'Kimi K2.7 Code',
    apiId: 'kimi-k2.7-code',
    version: '2.7',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.7-code.detail',
  },
  {
    ...MS_K27_BASE,
    id: 'kimi-k2.7-code-highspeed',
    label: 'Kimi K2.7 High-Speed',
    apiId: 'kimi-k2.7-code-highspeed',
    version: '2.7',
    maxInputTokens: 256_000,
    maxOutputTokens: 128_000,
    detailKey: 'model.kimi-k2.7-code-highspeed.detail',
  },
] as ModelItem[];

import type { ModelProvider } from '../types';

export const BYTEDANCE: ModelProvider = {
  id: 'bytedance',
  label: 'Bytedance',
  detailKey: 'provider.bytedance.detail',
  url: '',
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  usageSchema: {
    prompt_tokens: 'prompt_tokens',
    completion_tokens: 'completion_tokens',
    total_tokens: 'total_tokens',
    prompt_tokens_details: {
      cached_tokens: 'prompt_tokens_details.cached_tokens',
    },
    completion_tokens_details: {
      reasoning_tokens: 'completion_tokens_details.reasoning_tokens',
    },
  },
  apiKeyHint: '...',
  links: {
    apiHost: 'https://ark.cn-beijing.volces.com/api',
  },
};

import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const MIMO: ModelProvider = {
  id: 'mimo',
  label: 'Xiaomi MIMO',
  detailKey: 'provider.mimo.detail',
  url: DEFAULT_ENDPOINT_URLS.mimo,
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
  apiKeyHint: 'sk-... or tp-...',
  links: {
    apiHost: 'api.xiaomimimo.com',
  },
};

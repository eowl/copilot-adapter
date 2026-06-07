import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const DEEPSEEK: ModelProvider = {
  id: 'deepseek',
  label: 'DeepSeek',
  detailKey: 'provider.deepseek.detail',
  url: DEFAULT_ENDPOINT_URLS.deepseek,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  usageSchema: {
    prompt_tokens: 'prompt_tokens',
    completion_tokens: 'completion_tokens',
    total_tokens: 'total_tokens',
    prompt_tokens_details: {
      cached_tokens: 'prompt_cache_hit_tokens',
      cache_miss: 'prompt_cache_miss_tokens',
    },
    completion_tokens_details: {
      reasoning_tokens: 'completion_tokens_details.reasoning_tokens',
    },
  },
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.deepseek.com',
    apiKeys: 'https://platform.deepseek.com/api_keys',
    usage: 'https://platform.deepseek.com/usage',
    status: 'https://status.deepseek.com',
  },
};

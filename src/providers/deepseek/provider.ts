import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const DEEPSEEK: ModelProvider = {
  id: 'deepseek',
  label: 'DeepSeek',
  detailKey: 'provider.deepseek.detail',
  url: DEFAULT_ENDPOINT_URLS.deepseek,
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

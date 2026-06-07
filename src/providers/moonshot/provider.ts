import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const MOONSHOT: ModelProvider = {
  id: 'moonshot',
  label: 'Moonshot',
  detailKey: 'provider.moonshot.detail',
  url: DEFAULT_ENDPOINT_URLS.moonshot,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  usageSchema: {
    prompt_tokens: 'prompt_tokens',
    completion_tokens: 'completion_tokens',
    total_tokens: 'total_tokens',
  },
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.moonshot.cn',
    apiKeys: 'https://platform.kimi.com/console/api-keys',
    usage: 'https://platform.kimi.com/console/billing',
    status: 'https://platform.kimi.com',
  },
};

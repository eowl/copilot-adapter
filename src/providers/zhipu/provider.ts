import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const ZHIPU: ModelProvider = {
  id: 'zhipu',
  label: 'Zhipu',
  detailKey: 'provider.zhipu.detail',
  url: DEFAULT_ENDPOINT_URLS.zhipu,
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
    apiHost: 'open.bigmodel.cn',
    apiKeys: 'https://open.bigmodel.cn/usercenter/apikeys',
    usage: 'https://open.bigmodel.cn/usercenter/financial',
    status: 'https://open.bigmodel.cn',
  },
};

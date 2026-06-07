import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const QWEN: ModelProvider = {
  id: 'qwen',
  label: 'Qwen',
  detailKey: 'provider.qwen.detail',
  url: DEFAULT_ENDPOINT_URLS.qwen,
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
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'dashscope.aliyuncs.com',
    apiKeys: 'https://bailian.console.aliyun.com/?apiKey=1',
    usage: 'https://bailian.console.aliyun.com/#/expense',
    status: 'https://status.aliyun.com',
  },
};

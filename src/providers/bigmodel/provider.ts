import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { ModelProvider } from '../types';

export const BIGMODEL: ModelProvider = {
  id: 'bigmodel',
  label: 'BigModel',
  detailKey: 'provider.bigmodel.detail',
  url: DEFAULT_ENDPOINT_URLS.bigmodel,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: '...',
  links: {
    apiHost: 'open.bigmodel.cn',
    apiKeys: 'https://open.bigmodel.cn/usercenter/apikeys',
    usage: 'https://open.bigmodel.cn/usercenter/financial',
    status: 'https://open.bigmodel.cn',
  },
};

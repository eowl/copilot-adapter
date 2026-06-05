import { DEFAULT_ENDPOINT_URLS } from '../endpoints';
import type { Provider } from '../types';

export const MINIMAX: Provider = {
  id: 'minimax',
  label: 'MiniMax',
  detailKey: 'provider.minimax.detail',
  url: DEFAULT_ENDPOINT_URLS.minimax,
  tokenRatio: 4.0,
  thinkingField: 'thinking_content',
  supportsStreamUsage: false,
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.minimaxi.com',
    apiKeys: 'https://www.minimax.io/platform/user-center/basic-information/interface-key',
    usage: 'https://www.minimax.io/platform/cost-management/record',
    status: 'https://status.minimax.io',
  },
};

import type { Endpoint } from '../types';
import { composeEndpoint } from '../utils';
import { MS_MODELS } from './models';

export const MOONSHOT_ENDPOINTS: readonly Endpoint[] = [
  composeEndpoint({ key: 'moonshot.cn', label: 'api.moonshot.cn', url: 'https://api.moonshot.cn/v1' }, MS_MODELS),
  composeEndpoint({ key: 'moonshot.ai', label: 'api.moonshot.ai', url: 'https://api.moonshot.ai/v1' }, MS_MODELS),
];

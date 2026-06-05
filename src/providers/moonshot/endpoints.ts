import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { MS_MODELS } from './models';

export const MOONSHOT_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    { key: 'moonshot.cn', label: 'api.moonshot.cn', url: 'https://api.moonshot.cn/v1' },
    MS_MODELS,
  ),
  composeModelEndpoint(
    { key: 'moonshot.ai', label: 'api.moonshot.ai', url: 'https://api.moonshot.ai/v1' },
    MS_MODELS,
  ),
];

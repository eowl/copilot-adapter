import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { VOLCENGINE_MODELS } from './models';

export const BYTEDANCE_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'volcengine',
      label: 'Volcengine',
      url: 'https://ark.cn-beijing.volces.com/api/v3',
    },
    VOLCENGINE_MODELS,
  )
];

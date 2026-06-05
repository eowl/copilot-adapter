import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { ZP_MODELS } from './models';

export const ZHIPU_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      key: 'bigmodel',
      label: 'open.bigmodel.cn (standard)',
      url: 'https://open.bigmodel.cn/api/paas/v4',
    },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    {
      key: 'bigmodel-coding',
      label: 'open.bigmodel.cn (coding plan)',
      url: 'https://open.bigmodel.cn/api/coding/paas/v4',
    },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    { key: 'z.ai', label: 'api.z.ai (standard)', url: 'https://api.z.ai/api/paas/v4' },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    {
      key: 'z.ai-coding',
      label: 'api.z.ai (coding plan)',
      url: 'https://api.z.ai/api/coding/paas/v4',
    },
    ZP_MODELS,
  ),
];

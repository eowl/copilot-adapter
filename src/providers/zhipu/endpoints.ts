import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { ZP_MODELS } from './models';

export const ZHIPU_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'bigmodel',
      label: 'open.bigmodel.cn (standard)',
      url: 'https://open.bigmodel.cn/api/paas/v4',
      pricingCurrency: 'CNY',
      links: {
        apiHost: 'open.bigmodel.cn',
        apiKeys: 'https://bigmodel.cn/apikey/platform',
        usage: 'https://bigmodel.cn/finance-center/finance/overview',
        status: 'https://open.bigmodel.cn',
      },
    },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'bigmodel-coding',
      label: 'open.bigmodel.cn (coding plan)',
      url: 'https://open.bigmodel.cn/api/coding/paas/v4',
      billing: 'plan',
    },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'z.ai',
      label: 'api.z.ai (standard)',
      url: 'https://api.z.ai/api/paas/v4',
      pricingCurrency: 'USD',
      links: {
        apiHost: 'api.z.ai',
        apiKeys: 'https://z.ai/manage-apikey/apikey-list',
        status: 'https://api.z.ai',
      },
    },
    ZP_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'z.ai-coding',
      label: 'api.z.ai (coding plan)',
      url: 'https://api.z.ai/api/coding/paas/v4',
      billing: 'plan',
      links: {
        apiHost: 'api.z.ai',
        apiKeys: 'https://z.ai/manage-apikey/apikey-list',
        usage: 'https://z.ai/manage-apikey/coding-plan/personal/usage',
        status: 'https://z.ai/manage-apikey/coding-plan/personal/my-plan',
      },
    },
    ZP_MODELS,
  ),
];

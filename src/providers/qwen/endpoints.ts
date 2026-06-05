import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { QWEN_BASE_MODELS, QWEN_US_MODELS } from './models';

export const QWEN_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      key: 'cn',
      label: 'CN Beijing',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      matchStr: 'dashscope.aliyuncs.com',
    },
    QWEN_BASE_MODELS,
  ),
  composeModelEndpoint(
    {
      key: 'us',
      label: 'US',
      url: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
      matchStr: 'dashscope-us.aliyuncs.com',
    },
    [...QWEN_BASE_MODELS, ...QWEN_US_MODELS],
  ),
  composeModelEndpoint(
    {
      key: 'sgp',
      label: 'Singapore',
      url: 'https://{workspace}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'ap-southeast-1.maas.aliyuncs.com',
    },
    QWEN_BASE_MODELS,
  ),
  composeModelEndpoint(
    {
      key: 'eu',
      label: 'EU (Frankfurt)',
      url: 'https://{workspace}.eu-central-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'eu-central-1.maas.aliyuncs.com',
    },
    QWEN_BASE_MODELS,
  ),
];

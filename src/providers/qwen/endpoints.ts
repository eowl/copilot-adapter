import type { Endpoint } from '../types';
import { composeEndpoint } from '../utils';
import { QWEN_BASE_MODELS, QWEN_US_MODELS } from './models';

export const QWEN_ENDPOINTS: readonly Endpoint[] = [
  composeEndpoint(
    { key: 'cn', label: 'CN Beijing', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', matchStr: 'dashscope.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
  composeEndpoint(
    { key: 'us', label: 'US', url: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1', matchStr: 'dashscope-us.aliyuncs.com' },
    [...QWEN_BASE_MODELS, ...QWEN_US_MODELS],
  ),
  composeEndpoint(
    { key: 'sgp', label: 'Singapore', url: 'https://{workspace}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1', matchStr: 'ap-southeast-1.maas.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
  composeEndpoint(
    { key: 'eu', label: 'EU (Frankfurt)', url: 'https://{workspace}.eu-central-1.maas.aliyuncs.com/compatible-mode/v1', matchStr: 'eu-central-1.maas.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
];

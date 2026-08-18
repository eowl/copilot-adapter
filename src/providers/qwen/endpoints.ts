import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { QWEN_BASE_MODELS, QWEN_CN_MODELS, QWEN_US_MODELS, QWEN_SGP_MODELS, QWEN_JP_MODELS, QWEN_DE_MODELS } from './models';

export const QWEN_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'cn',
      label: 'CN Beijing',
      url: 'https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'cn-beijing.maas.aliyuncs.com',
    },
    QWEN_CN_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'us',
      label: 'US',
      url: 'https://{WorkspaceId}.us-east-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'us-east-1.maas.aliyuncs.com',
    },
    QWEN_US_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'sgp',
      label: 'Singapore',
      url: 'https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'ap-southeast-1.maas.aliyuncs.com',
    },
    QWEN_SGP_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'eu',
      label: 'EU (Frankfurt)',
      url: 'https://{WorkspaceId}.eu-central-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'eu-central-1.maas.aliyuncs.com',
    },
    QWEN_DE_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'jp',
      label: 'Japan (Tokyo)',
      url: 'https://{WorkspaceId}.ap-northeast-1.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'ap-northeast-1.maas.aliyuncs.com',
    },
    QWEN_JP_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'token-plan',
      label: 'Token Plan',
      url: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
      matchStr: 'token-plan.cn-beijing.maas.aliyuncs.com',
    },
    QWEN_BASE_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'default',
      label: 'Default',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
    QWEN_BASE_MODELS,
  ),
];

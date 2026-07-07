import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import {
  VOLCENGINE_MODELS,
  VOLCENGINE_CODING_PLAN_MODELS,
  MODELARK_MODELS,
  MODELARK_CODING_PLAN_MODESL,
} from './models';

export const BYTEDANCE_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'volcengine',
      label: 'Volcengine',
      url: 'https://ark.cn-beijing.volces.com/api/v3',
    },
    VOLCENGINE_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'volcengine-coding-plan',
      label: 'Volcengine Coding Plan',
      url: 'https://ark.cn-beijing.volces.com/api/coding/v3',
      billing: 'plan',
    },
    VOLCENGINE_CODING_PLAN_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'bytepuls-ap-southeast',
      label: 'BytePlus ModelArk(ap-southeast-1)',
      url: 'https://ark.ap-southeast.bytepluses.com/api/v3',
    },
    MODELARK_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'bytepuls-ap-southeast-coding-plan',
      label: 'BytePlus ModelArk Coding Plan(ap-southeast-1)',
      url: 'https://ark.ap-southeast.bytepluses.com/api/coding/v3',
      billing: 'plan',
    },
    MODELARK_CODING_PLAN_MODESL,
  ),
  composeModelEndpoint(
    {
      id: 'bytepuls-eu-west',
      label: 'BytePlus ModelArk(eu-west-1)',
      url: 'https://ark.eu-west.bytepluses.com/api/v3',
    },
    MODELARK_MODELS,
  ),
];

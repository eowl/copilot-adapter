import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { DS_MODELS } from './models';

export const DEEPSEEK_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'deepseek',
      label: 'DeepSeek',
      url: 'https://api.deepseek.com',
      links: { balance: 'https://api.deepseek.com/user/balance' },
    },
    DS_MODELS,
  ),
];

import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { DS_MODELS } from './models';

export const DEEPSEEK_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    { key: 'deepseek', label: 'DeepSeek', url: 'https://api.deepseek.com' },
    DS_MODELS,
  ),
];

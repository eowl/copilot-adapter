import type { Endpoint } from '../types';
import { composeEndpoint } from '../utils';
import { DS_MODELS } from './models';

export const DEEPSEEK_ENDPOINTS: readonly Endpoint[] = [
  composeEndpoint({ key: 'deepseek', label: 'DeepSeek', url: 'https://api.deepseek.com' }, DS_MODELS),
];

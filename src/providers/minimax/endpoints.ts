import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { MM_MODELS } from './models';

export const MINIMAX_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint({ key: 'minimaxi.com', label: 'api.minimaxi.com', url: 'https://api.minimaxi.com/v1' }, MM_MODELS),
  composeModelEndpoint({ key: 'minimax.io',   label: 'api.minimax.io',   url: 'https://api.minimax.io/v1' },   MM_MODELS),
];

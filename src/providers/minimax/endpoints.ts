import type { Endpoint } from '../types';
import { composeEndpoint } from '../utils';
import { MM_MODELS } from './models';

export const MINIMAX_ENDPOINTS: readonly Endpoint[] = [
  composeEndpoint({ key: 'minimaxi.com', label: 'api.minimaxi.com', url: 'https://api.minimaxi.com/v1' }, MM_MODELS),
  composeEndpoint({ key: 'minimax.io',   label: 'api.minimax.io',   url: 'https://api.minimax.io/v1' },   MM_MODELS),
];

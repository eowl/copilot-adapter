import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { MM_MODELS } from './models';

export const MINIMAX_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    {
      id: 'minimaxi.com',
      label: 'api.minimaxi.com',
      url: 'https://api.minimaxi.com/v1',
      pricingCurrency: 'CNY',
    },
    MM_MODELS,
  ),
  composeModelEndpoint(
    {
      id: 'minimax.io',
      label: 'api.minimax.io',
      url: 'https://api.minimax.io/v1',
      pricingCurrency: 'USD',
    },
    MM_MODELS,
  ),
];

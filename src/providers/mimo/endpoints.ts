import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { MIMO_MODELS } from './models';

export const MIMO_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    { id: 'mimo', label: 'MIMO', url: 'https://api.xiaomimimo.com/v1' },
    MIMO_MODELS,
  ),
  composeModelEndpoint(
    { id: 'mimo-token-plan-cn', label: 'MIMO Token Plan China Cluster', url: 'https://token-plan-cn.xiaomimimo.com/v1' },
    MIMO_MODELS,
  ),
  composeModelEndpoint(
    { id: 'mimo-token-plan-spg', label: 'MIMO Token Plan Singapore Cluster', url: 'https://token-plan-spg.xiaomimimo.com/v1' },
    MIMO_MODELS,
  ),
  composeModelEndpoint(
    { id: 'mimo-token-plan-ams', label: 'MIMO Token Plan Europe Cluster', url: 'https://token-plan-ams.xiaomimimo.com/v1' },
    MIMO_MODELS,
  ),
];

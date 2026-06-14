/**
 * Backward-compatibility re-exports.
 *
 * The canonical model registry now lives in `src/registry/`.
 * This module re-exports everything downstream code expects so existing
 * imports don't break.
 */

export { DEEPSEEK } from './deepseek';
export { MINIMAX } from './minimax';
export { MOONSHOT } from './moonshot';
export { QWEN } from './qwen';
export { ZHIPU } from './zhipu';
export type { ModelProvider, ModelEndpoint, ModelItem } from './types';

export {
  ALL_PROVIDERS,
  providerById,
  endpointById,
  ALL_MODELS,
  modelById,
} from '../registry';

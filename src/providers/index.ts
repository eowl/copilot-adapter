import { DEEPSEEK, DEEPSEEK_ENDPOINTS } from './deepseek';
import { MINIMAX, MINIMAX_ENDPOINTS } from './minimax';
import { MOONSHOT, MOONSHOT_ENDPOINTS } from './moonshot';
import { QWEN, QWEN_ENDPOINTS } from './qwen';
import { ZHIPU, ZHIPU_ENDPOINTS } from './bigmodel';
import { composeModelProvider } from './utils';
import type { ModelItem, ModelProvider, ModelEndpoint } from './types';

export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU };
export type { ModelProvider, ModelEndpoint, ModelItem };

composeModelProvider(DEEPSEEK, DEEPSEEK_ENDPOINTS);
composeModelProvider(MINIMAX, MINIMAX_ENDPOINTS);
composeModelProvider(MOONSHOT, MOONSHOT_ENDPOINTS);
composeModelProvider(QWEN, QWEN_ENDPOINTS);
composeModelProvider(ZHIPU, ZHIPU_ENDPOINTS);

export const ALL_PROVIDERS: readonly ModelProvider[] = [DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU];

export const ALL_MODELS: readonly ModelItem[] = (() => {
  const seen = new Set<string>();
  const result: ModelItem[] = [];
  for (const mp of ALL_PROVIDERS) {
    for (const me of mp.endpoints ?? []) {
      for (const mi of me.models ?? []) {
        if (!seen.has(mi.id)) {
          seen.add(mi.id);
          result.push(mi);
        }
      }
    }
  }

  return result;
})();

export const modelById = new Map<string, ModelItem>(ALL_MODELS.map((mi) => [mi.id, mi]));

export const providerById = new Map<string, ModelProvider>(ALL_PROVIDERS.map((mp) => [mp.id, mp]));

export const endpointById = new Map<string, ModelEndpoint>(
  ALL_PROVIDERS.flatMap((mp) => mp.endpoints ?? []).map((me) => [me.key, me]),
);

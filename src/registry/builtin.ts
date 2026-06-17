import { DEEPSEEK, DEEPSEEK_ENDPOINTS } from '../providers/deepseek';
import { MINIMAX, MINIMAX_ENDPOINTS } from '../providers/minimax';
import { MOONSHOT, MOONSHOT_ENDPOINTS } from '../providers/moonshot';
import { QWEN, QWEN_ENDPOINTS } from '../providers/qwen';
import { ZHIPU, ZHIPU_ENDPOINTS } from '../providers/zhipu';
import { CUSTOM } from '../providers/custom';
import { composeModelProvider } from '../providers/utils';
import type { ModelItem, ModelProvider, ModelEndpoint } from '../providers/types';

composeModelProvider(DEEPSEEK, DEEPSEEK_ENDPOINTS);
composeModelProvider(MINIMAX, MINIMAX_ENDPOINTS);
composeModelProvider(MOONSHOT, MOONSHOT_ENDPOINTS);
composeModelProvider(QWEN, QWEN_ENDPOINTS);
composeModelProvider(ZHIPU, ZHIPU_ENDPOINTS);

export const ALL_PROVIDERS: readonly ModelProvider[] = [
  DEEPSEEK,
  MINIMAX,
  MOONSHOT,
  QWEN,
  ZHIPU,
  CUSTOM,
];

const _providerById = new Map<string, ModelProvider>(ALL_PROVIDERS.map((mp) => [mp.id, mp]));

const _endpointById = new Map<string, ModelEndpoint>(
  ALL_PROVIDERS.flatMap((mp) => mp.endpoints ?? []).map((me) => [me.id, me]),
);

export const providerById: ReadonlyMap<string, ModelProvider> = _providerById;
export const endpointById: ReadonlyMap<string, ModelEndpoint> = _endpointById;

export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU };
export type { ModelProvider, ModelEndpoint, ModelItem };

export function loadBuiltinModels(): ModelItem[] {
  const result: ModelItem[] = [];
  for (const mp of ALL_PROVIDERS) {
    for (const me of mp.endpoints ?? []) {
      for (const mi of me.models ?? []) {
        result.push({ ...mi, endpoint: me, source: mi.source } as ModelItem);
      }
    }
  }

  return result;
}

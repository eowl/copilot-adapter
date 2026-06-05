import { DEEPSEEK, DEEPSEEK_ENDPOINTS } from './deepseek';
import { MINIMAX, MINIMAX_ENDPOINTS } from './minimax';
import { MOONSHOT, MOONSHOT_ENDPOINTS } from './moonshot';
import { QWEN, QWEN_ENDPOINTS } from './qwen';
import { BIGMODEL, BIGMODEL_ENDPOINTS } from './bigmodel';
import { composeProvider } from './utils';
import type { Model, Provider, Endpoint } from './types';

export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, BIGMODEL };
export type { Provider, Endpoint, Model };

composeProvider(DEEPSEEK, DEEPSEEK_ENDPOINTS);
composeProvider(MINIMAX, MINIMAX_ENDPOINTS);
composeProvider(MOONSHOT, MOONSHOT_ENDPOINTS);
composeProvider(QWEN, QWEN_ENDPOINTS);
composeProvider(BIGMODEL, BIGMODEL_ENDPOINTS);

export const ALL_PROVIDERS: readonly Provider[] = [
  DEEPSEEK,
  MINIMAX,
  MOONSHOT,
  QWEN,
  BIGMODEL,
];

export const ALL_MODELS: readonly Model[] = (() => {
  const seen = new Set<string>();
  const result: Model[] = [];
  for (const p of ALL_PROVIDERS) {
    for (const ep of p.endpoints ?? []) {
      for (const m of ep.models ?? []) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          result.push(m);
        }
      }
    }
  }
  return result;
})();

export const modelById = new Map<string, Model>(ALL_MODELS.map((m) => [m.id, m]));

export const providerById = new Map<string, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

export const endpointById = new Map<string, Endpoint>(
  ALL_PROVIDERS.flatMap((p) => p.endpoints ?? []).map((s) => [s.key, s]),
);

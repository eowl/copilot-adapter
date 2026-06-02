import { DEEPSEEK, DS_MODELS } from './deepseek';
import { MINIMAX, MM_MODELS } from './minimax';
import type { Model, Provider } from './types';

export { DEEPSEEK, MINIMAX };
export type { Provider, Model };

/** All registered models in display order. */
export const ALL_MODELS: readonly Model[] = [...DS_MODELS, ...MM_MODELS];

/** Map from VS Code model id → Model for fast lookup. */
export const modelById = new Map<string, Model>(ALL_MODELS.map((m) => [m.id, m]));

/** All unique providers, in the order their first model appears. */
export const ALL_PROVIDERS: readonly Provider[] = (() => {
  const seen = new Set<string>();
  const result: Provider[] = [];
  for (const m of ALL_MODELS) {
    if (!seen.has(m.provider.id)) {
      seen.add(m.provider.id);
      result.push(m.provider);
    }
  }
  return result;
})();

/** Map from provider id → Provider for fast lookup. */
export const providerById = new Map<string, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

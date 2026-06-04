import { DEEPSEEK, DS_MODELS } from './deepseek';
import { MINIMAX, MM_MODELS } from './minimax';
import { QWEN, QWEN_MODELS } from './qwen';
import { BIGMODEL, BM_MODELS } from './bigmodel';
import type { Model, Provider } from './types';

export { DEEPSEEK, MINIMAX, QWEN, BIGMODEL };
export type { Provider, Model };

export const ALL_MODELS: readonly Model[] = [
  ...DS_MODELS,
  ...MM_MODELS,
  ...QWEN_MODELS,
  ...BM_MODELS,
];

export const modelById = new Map<string, Model>(ALL_MODELS.map((m) => [m.id, m]));

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

export const providerById = new Map<string, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

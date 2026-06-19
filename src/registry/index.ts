import { modelKey as _modelKey } from '../providers/utils';
import {
  loadBuiltinModels,
  ALL_PROVIDERS,
  providerById,
  endpointById,
  DEEPSEEK,
  MIMO,
  MINIMAX,
  MOONSHOT,
  QWEN,
  ZHIPU,
} from './builtin';
import { loadBuiltinJSONModels } from './builtin-json';
import type { ModelItem, Registries } from './types';
import { CUSTOM } from '../providers/custom';

export { ALL_PROVIDERS, providerById, endpointById };
export { DEEPSEEK, MIMO, MINIMAX, MOONSHOT, QWEN, ZHIPU, CUSTOM };
export type { ModelItem };

export function modelKey(mi: ModelItem): string {
  return _modelKey(mi);
}

const _reg: Registries = { providerById, endpointById };

function buildAllModels(): ModelItem[] {
  const seen = new Set<string>();
  const result: ModelItem[] = [];

  // Builtin JSON (models/*.json)
  for (const mi of loadBuiltinJSONModels(_reg)) {
    const key = modelKey(mi);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mi);
    }
  }

  // TS-defined (fallback — only if not already seen)
  for (const mi of loadBuiltinModels()) {
    const key = modelKey(mi);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mi);
    }
  }

  return result;
}

const _allModels: readonly ModelItem[] = buildAllModels();
const _modelById = new Map<string, ModelItem>(_allModels.map((mi) => [modelKey(mi), mi]));

export const ALL_MODELS: readonly ModelItem[] = _allModels;
export const modelById: ReadonlyMap<string, ModelItem> = _modelById;

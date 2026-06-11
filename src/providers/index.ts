import path from 'node:path';
import { DEEPSEEK, DEEPSEEK_ENDPOINTS } from './deepseek';
import { MINIMAX, MINIMAX_ENDPOINTS } from './minimax';
import { MOONSHOT, MOONSHOT_ENDPOINTS } from './moonshot';
import { QWEN, QWEN_ENDPOINTS } from './qwen';
import { ZHIPU, ZHIPU_ENDPOINTS } from './zhipu';
import { composeModelProvider, modelKey } from './utils';
import { loadAllJsonModels } from './loader';
import { Settings } from '../settings';
import { loadCustomModels, customModelKey } from '../custom/loader';
import type { ModelItem, ModelProvider, ModelEndpoint } from './types';

export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU };
export type { ModelProvider, ModelEndpoint, ModelItem };

composeModelProvider(DEEPSEEK, DEEPSEEK_ENDPOINTS);
composeModelProvider(MINIMAX, MINIMAX_ENDPOINTS);
composeModelProvider(MOONSHOT, MOONSHOT_ENDPOINTS);
composeModelProvider(QWEN, QWEN_ENDPOINTS);
composeModelProvider(ZHIPU, ZHIPU_ENDPOINTS);

export const ALL_PROVIDERS: readonly ModelProvider[] = [DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU];

const _providerById = new Map<string, ModelProvider>(ALL_PROVIDERS.map((mp) => [mp.id, mp]));

const _endpointById = new Map<string, ModelEndpoint>(
  ALL_PROVIDERS.flatMap((mp) => mp.endpoints ?? []).map((me) => [me.id, me]),
);

export const providerById: ReadonlyMap<string, ModelProvider> = _providerById;
export const endpointById: ReadonlyMap<string, ModelEndpoint> = _endpointById;

interface CustomModelsState {
  registries: {
    providerById: ReadonlyMap<string, ModelProvider>;
    endpointById: ReadonlyMap<string, ModelEndpoint>;
  };
}

const _state: CustomModelsState = {
  registries: { providerById: _providerById, endpointById: _endpointById },
};

export function getCustomModels(): CustomModelsState {
  return _state;
}

function buildAllModels(customPath: string): ModelItem[] {
  const seen = new Set<string>();
  const result: ModelItem[] = [];

  const modelsDir = path.join(__dirname, '..', '..', 'models');
  for (const mi of loadAllJsonModels(modelsDir, { providerById: _providerById, endpointById: _endpointById })) {
    const key = modelKey(mi);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mi);
    }
  }

  if (customPath) {
    const { models: customModels } = loadCustomModels(customPath, {
      providerById: _providerById,
      endpointById: _endpointById,
    });
    for (const mi of customModels) {
      const key = customModelKey(mi);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(mi);
      }
    }
  }

  for (const mp of ALL_PROVIDERS) {
    for (const me of mp.endpoints ?? []) {
      for (const mi of me.models ?? []) {
        const fixed = { ...mi, endpoint: me, source: mi.source };
        const key = modelKey(fixed);

        if (!seen.has(key)) {
          seen.add(key);
          result.push(fixed as ModelItem);
        }
      }
    }
  }

  return result;
}

let _allModels: readonly ModelItem[] = buildAllModels(Settings.customModelsPath());
let _modelById = new Map<string, ModelItem>(
  _allModels.map((mi) => [mi.source === 'custom' ? customModelKey(mi) : modelKey(mi), mi]),
);

export function refreshCustomModels(): void {
  const newAll = buildAllModels(Settings.customModelsPath());
  const newById = new Map<string, ModelItem>(
    newAll.map((mi) => [mi.source === 'custom' ? customModelKey(mi) : modelKey(mi), mi]),
  );
  _allModels = newAll;
  _modelById = newById;
  _exports.ALL_MODELS = newAll;
  _exports.modelById = newById;
}

const _exports = { ALL_MODELS: _allModels, modelById: _modelById } as {
  ALL_MODELS: readonly ModelItem[];
  modelById: ReadonlyMap<string, ModelItem>;
};

export const { ALL_MODELS, modelById } = _exports;

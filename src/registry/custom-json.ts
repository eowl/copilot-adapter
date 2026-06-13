import { loadCustomModels as _load } from '../custom/loader';
import type { ModelItem } from './types';
import type { Registries } from './types';

export interface CustomModelsResult {
  models: ModelItem[];
  errors: ReadonlyArray<{ message: string; line: number }>;
}

export function loadCustomJSONModels(filePath: string, reg: Registries): CustomModelsResult {
  return _load(filePath, reg);
}

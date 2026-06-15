import path from 'node:path';
import { loadAllJsonModels } from '../providers/loader';
import type { Registries, ModelItem } from './types';

export function loadBuiltinJSONModels(reg: Registries): ModelItem[] {
  const modelsDir = path.join(__dirname, '..', '..', 'models');

  return loadAllJsonModels(modelsDir, reg);
}

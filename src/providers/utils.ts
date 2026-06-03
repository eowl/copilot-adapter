import type { Model, ProviderDefaults } from './types';

export function resolveDefault<K extends keyof ProviderDefaults>(
  model: Model,
  key: K,
): ProviderDefaults[K] {
  return model[key] ?? model.provider[key];
}

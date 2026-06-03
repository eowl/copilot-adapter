import { Settings } from '../settings';
import type { Model, Provider, ProviderDefaults } from './types';

export function resolveDefault<K extends keyof ProviderDefaults>(
  model: Model,
  key: K,
): ProviderDefaults[K] {
  return model[key] ?? model.provider[key];
}

export function getEndpoint(provider: Provider): string {
  return Settings.providerEndpoint(provider.id) ?? provider.endpoint;
}

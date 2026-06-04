import { Settings } from '../settings';
import type { ApiTraits, Model, Provider } from './types';

export function resolveTrait<K extends keyof ApiTraits>(model: Model, key: K): ApiTraits[K] {
  return model[key] ?? model.provider[key];
}

export function getEndpoint(provider: Provider): string {
  return Settings.providerEndpoint(provider.id) ?? provider.endpoint;
}

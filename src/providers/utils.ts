import { Settings } from '../settings';
import type { ApiTraits, Model, Provider, Endpoint } from './types';

export function resolveTrait<K extends keyof ApiTraits>(model: Model, key: K): ApiTraits[K] {
  return (model as any)[key] ?? (model.endpoint as any)?.[key] ?? (model.provider as any)[key];
}

export function getEndpoint(provider: Provider, apiEndpoint?: string): string {
  const globalOverride = Settings.providerEndpoint(provider.id);
  if (globalOverride) return globalOverride;

  if (apiEndpoint) {
    // Text-input mode (Qwen): user typed a full URL then use it directly
    if (apiEndpoint.includes('://')) return apiEndpoint;

    // Dropdown mode: match by endpoint key
    if (provider.endpoints) {
      const ep = provider.endpoints.find((s) => s.key === apiEndpoint);
      if (ep) return ep.url!;
    }
  }

  return provider.endpoints?.[0]?.url ?? provider.url;
}

export function resolveEndpoint(provider: Provider, apiEndpoint: string): Endpoint | undefined {
  if (!provider.endpoints) return undefined;

  const exact = provider.endpoints.find((s) => s.key === apiEndpoint);
  if (exact) return exact;

  return provider.endpoints.find((s) => s.matchStr && apiEndpoint.includes(s.matchStr));
}

export function composeProvider(provider: Provider, endpoints: readonly Endpoint[]): void {
  provider.endpoints = endpoints as Endpoint[];
  for (const ep of provider.endpoints) {
    ep.provider = provider;
    for (const m of ep.models ?? []) {
      m.provider = provider;
    }
  }
}

export function composeEndpoint(endpoint: Endpoint, models: readonly Model[]): Endpoint {
  endpoint.models = models as Model[];
  for (const m of models) {
    m.endpoint = endpoint;
  }

  return endpoint;
}

export function imagePart(
  imageField: string = 'image_url',
): (data: Uint8Array, mimeType: string) => Record<string, unknown> {
  return (data: Uint8Array, mimeType: string): Record<string, unknown> => {
    const base64 = Buffer.from(data).toString('base64');

    return { type: imageField, [imageField]: { url: `data:${mimeType};base64,${base64}` } };
  };
}

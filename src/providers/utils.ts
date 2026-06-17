import type { ApiTraits, ModelItem, ModelProvider, ModelEndpoint } from './types';

/** Build the provider- and endpoint-qualified unique key for a model. */
export function modelKey(mi: ModelItem): string {
  const ep = mi.endpoint?.id ?? '';

  return `${mi.id}-${mi.provider.id}${ep ? `-${ep}` : ''}`;
}

export function resolveTrait<K extends keyof ApiTraits>(
  modelItem: ModelItem,
  key: K,
): ApiTraits[K] {
  return (
    (modelItem as ApiTraits)[key] ??
    (modelItem.endpoint as ApiTraits)?.[key] ??
    (modelItem.provider as ApiTraits)[key]
  );
}

export function getEndpoint(modelProvider: ModelProvider, apiEndpoint?: string): string {
  if (apiEndpoint) {
    // Text-input mode (Qwen): user typed a full URL then use it directly
    if (apiEndpoint.includes('://')) return apiEndpoint;

    // Dropdown mode: match by endpoint key
    if (modelProvider.endpoints) {
      const ep = modelProvider.endpoints.find((s) => s.id === apiEndpoint);
      if (ep) return ep.url!;
    }
  }

  return modelProvider.endpoints?.[0]?.url ?? modelProvider.url;
}

export function resolveEndpoint(
  modelProvider: ModelProvider,
  apiEndpoint: string,
): ModelEndpoint | undefined {
  if (!modelProvider.endpoints) return undefined;

  const exact = modelProvider.endpoints.find((s) => s.id === apiEndpoint);
  if (exact) return exact;

  return modelProvider.endpoints.find((s) => s.matchStr && apiEndpoint.includes(s.matchStr));
}

export function composeModelProvider(
  modelProvider: ModelProvider,
  modelEndpoints: readonly ModelEndpoint[],
): void {
  modelProvider.endpoints = modelEndpoints as ModelEndpoint[];
  for (const me of modelProvider.endpoints) {
    me.provider = modelProvider;
    for (const mi of me.models ?? []) {
      mi.provider = modelProvider;
    }
  }
}

export function composeModelEndpoint(
  modelEndpoint: ModelEndpoint,
  modelItems: readonly ModelItem[],
): ModelEndpoint {
  modelEndpoint.models = modelItems as ModelItem[];
  for (const mi of modelItems) {
    mi.endpoint = modelEndpoint;
    mi.source = 'builtin';

    // Backfill functions from static thinking / contentTag config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { backfillModel } = require('./loader') as typeof import('./loader');
    backfillModel(mi);
  }

  return modelEndpoint;
}

export function imagePart(
  imageField: string = 'image_url',
): (data: Uint8Array, mimeType: string) => Record<string, unknown> {
  return (data: Uint8Array, mimeType: string): Record<string, unknown> => {
    const base64 = Buffer.from(data).toString('base64');

    return { type: imageField, [imageField]: { url: `data:${mimeType};base64,${base64}` } };
  };
}

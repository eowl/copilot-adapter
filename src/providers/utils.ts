import { Settings } from '../settings';
import type { ApiTraits, Model, Provider } from './types';

export function resolveTrait<K extends keyof ApiTraits>(model: Model, key: K): ApiTraits[K] {
  return model[key] ?? model.provider[key];
}

export function getEndpoint(provider: Provider): string {
  return Settings.providerEndpoint(provider.id) ?? provider.endpoint;
}

export function imagePart(
  imageField: string = 'image_url',
): (data: Uint8Array, mimeType: string) => Record<string, unknown> {
  return (data: Uint8Array, mimeType: string): Record<string, unknown> => {
    const base64 = Buffer.from(data).toString('base64');

    return { type: imageField, [imageField]: { url: `data:${mimeType};base64,${base64}` } };
  };
}

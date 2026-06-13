import type { ModelItem, ModelProvider, ModelEndpoint } from '../providers/types';

export type { ModelItem, ModelProvider, ModelEndpoint };

export interface Registries {
  readonly providerById: ReadonlyMap<string, ModelProvider>;
  readonly endpointById: ReadonlyMap<string, ModelEndpoint>;
}

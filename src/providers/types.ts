import type { UsagePayload } from '../bridge/types';

export interface ServiceLinks {
  apiHost?: string;
  apiKeys?: string;
  usage?: string;
  status?: string;
  balance?: string;
}

/**
 * Stateful per-request parser for the content stream.
 * Used by providers that embed reasoning text in the content delta
 * rather than a separate field (e.g. MiniMax's <think>…</think> tags).
 */
export interface ContentParser {
  feed(chunk: string): Array<{ kind: 'content' | 'thinking'; text: string }>;
  flush(): Array<{ kind: 'content' | 'thinking'; text: string }>;
}

export type UsageSchema = Partial<{
  [K in keyof UsagePayload]: UsagePayload[K] extends object | undefined
    ? Partial<{ [SubK in keyof NonNullable<UsagePayload[K]>]: string }>
    : string;
}>;

export interface ApiTraits {
  tokenRatio?: number;
  thinkingField?: string;
  url?: string;
  usageSchema?: UsageSchema;
}

export type PricingCurrency = 'USD' | 'CNY';

export type BillingMode = 'api' | 'plan';

export type PriceCategory = 'low' | 'medium' | 'high' | 'very_high' | 'plan';

export interface ModelProvider extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly detailKey: string;
  readonly url: string;
  readonly supportsStreamUsage?: boolean;
  readonly links?: ServiceLinks;
  readonly apiKeyHint?: string;

  endpoints?: ModelEndpoint[];
}

export interface ModelEndpoint extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly matchStr?: string;

  provider?: ModelProvider;
  models?: readonly ModelItem[];

  pricingCurrency?: PricingCurrency;
  billing?: BillingMode;
  readonly links?: ServiceLinks;
}

export interface ThinkingOption {
  readonly value: string;
  readonly label: string;
  readonly hint: string;
  readonly requestFields?: Record<string, unknown>;
}

export interface ThinkingConfig {
  readonly default: string;
  readonly options: readonly ThinkingOption[];
}

export interface PricingDefinition {
  input?: number;
  output?: number;
  cacheInput?: number;
  cacheWrite?: number;
}

export interface ModelPricing {
  default: PricingDefinition;
  longContext?: PricingDefinition;
}

export interface ModelItem extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly apiId?: string;
  readonly family?: string;
  readonly version?: string;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly detailKey: string;

  source: 'builtin' | 'custom';

  provider: ModelProvider;
  endpoint?: ModelEndpoint;
  maxTokensField?: string;

  readonly thinking: boolean;
  readonly thinkingTag?: string;
  readonly thinkingConfig?: ThinkingConfig;

  readonly imageInput: boolean;
  readonly imageField?: string;

  readonly maxTools?: number;

  pricing?: Readonly<Partial<Record<PricingCurrency, ModelPricing>>>;
  priceCategory?: PriceCategory;

  requestExtras?(modelConfig: Record<string, unknown> | undefined): Record<string, unknown>;
  configSchema?(): Record<string, unknown> | undefined;
  createContentParser?(): ContentParser | undefined;
  formatImagePart?(data: Uint8Array, mimeType: string): Record<string, unknown>;
}

export interface ModelItemConfig extends Partial<
  Omit<
    ModelItem,
    | 'requestExtras'
    | 'configSchema'
    | 'createContentParser'
    | 'formatImagePart'
    | 'provider'
    | 'endpoint'
  >
> {
  readonly providerId?: string;
  readonly endpointId?: string;
  readonly thinking?: boolean;
  readonly thinkingConfig?: ThinkingConfig;
  readonly thinkingTag?: string;
}

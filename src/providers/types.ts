import type { ProviderLinks } from '../client/error';
import type { UsagePayload } from '../bridge/types';

/**
 * Stateful per-request parser for the content stream.
 * Used by providers that embed reasoning text in the content delta
 * rather than a separate field (e.g. MiniMax's <think>…</think> tags).
 */
export interface ContentParser {
  feed(chunk: string): Array<{ kind: 'content' | 'thinking'; text: string }>;
  flush(): Array<{ kind: 'content' | 'thinking'; text: string }>;
}

interface BaseAbility {
  maxTools?: number;
  acceptsImages: boolean;
}

export interface ReasoningAbility extends BaseAbility {
  reasoning: true;
  thinkTag?: string;
}

export interface NonReasoningAbility extends BaseAbility {
  reasoning: false;
}

export type ModelAbility = ReasoningAbility | NonReasoningAbility;

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

export interface ModelProvider extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly detailKey: string;
  readonly url: string;
  readonly supportsStreamUsage?: boolean;
  readonly links?: ProviderLinks;
  readonly apiKeyHint?: string;

  endpoints?: ModelEndpoint[];
}

export interface ModelEndpoint extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly matchStr?: string;

  provider?: ModelProvider;
  models?: readonly ModelItem[];
}

export interface ModelItem extends ApiTraits {
  readonly id: string;
  readonly label: string;
  readonly apiId: string;
  readonly family: string;
  readonly version: string;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly ability: ModelAbility;
  readonly detailKey: string;

  provider: ModelProvider;
  endpoint?: ModelEndpoint;
  maxTokensField?: string;

  imageField?: string;

  thinking?: ThinkingConfig;
  contentTag?: string;

  requestExtras?(modelConfig: Record<string, unknown> | undefined): Record<string, unknown>;
  configSchema?(): Record<string, unknown> | undefined;
  createContentParser?(): ContentParser | undefined;
  formatImagePart?(data: Uint8Array, mimeType: string): Record<string, unknown>;
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

export interface ModelItemJson extends Partial<
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
  readonly thinking?: ThinkingConfig;
  readonly contentTag?: string;
}

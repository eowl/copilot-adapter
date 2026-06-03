import type { ProviderLinks } from '../client/error';

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

export interface Model {
  readonly id: string;
  readonly label: string;
  readonly apiId: string;
  readonly family: string;
  readonly version: string;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly ability: ModelAbility;
  readonly detailKey: string;
  readonly provider: Provider;

  maxTokensField?: string;
  requestExtras?(modelConfig: Record<string, unknown> | undefined): Record<string, unknown>;
  configSchema?(): Record<string, unknown> | undefined;
  createContentParser?(): ContentParser | undefined;
  formatImagePart?(data: Uint8Array, mimeType: string): Record<string, unknown>;
}

export interface Provider {
  readonly id: string;
  readonly label: string;
  readonly detailKey: string;
  readonly endpoint: string;
  readonly tokenRatio?: number;
  readonly thinkingField?: string;
  readonly supportsStreamUsage?: boolean;
  readonly links?: ProviderLinks;
  readonly apiKeyHint?: string;
}

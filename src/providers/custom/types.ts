import type { ThinkingConfig } from '../types';

export interface CustomModelConfig {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly toolCalling: boolean;
  readonly maxTools?: number;
  readonly vision: boolean;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly apiType?: 'chat-completions' | 'responses' | 'messages'; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
  readonly editTools?: readonly string[]; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
  readonly thinking?: boolean;
  readonly thinkingTag?: string;
  readonly streaming?: boolean; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
  readonly zeroDataRetentionEnabled?: boolean; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
  readonly supportsReasoningEffort?: readonly string[] | ThinkingConfig;
  readonly reasoningEffortFormat?: 'chat-completions' | 'responses'; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
  readonly requestHeaders?: Record<string, string>; // [Custom Endpoint Compatibility] To ensure compatibility with the official Custom Endpoint field, which is currently unused.
}

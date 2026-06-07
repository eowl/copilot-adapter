/**
 * OpenAI-compatible usage payload sent to VS Code as a LanguageModelDataPart.
 *
 * Example:
 * ```
 * {
 *   prompt_tokens: 1234,
 *   completion_tokens: 567,
 *   total_tokens: 1801,
 *   prompt_tokens_details: { cached_tokens: 1200, cache_miss: 34 },
 *   completion_tokens_details: { reasoning_tokens: 200 },
 * }
 * ```
 */
export interface UsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_miss?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
}

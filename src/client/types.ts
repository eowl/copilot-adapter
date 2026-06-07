export type MsgRole = 'system' | 'user' | 'assistant' | 'tool';

/** A single message in the chat conversation sent to the API. */
export interface Msg {
  role: MsgRole;
  content: string | Array<Record<string, unknown>>;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  /** Extra provider-specific fields (e.g. reasoning_content, thinking_content). */
  [key: string]: unknown;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/** Provider-specific usage object. Shape varies across providers — accessed via dot-paths in UsageSchema. */
export type Usage = Record<string, unknown>;

/** Full request body sent to the chat completions endpoint. */
export interface ApiReq {
  model: string;
  messages: Msg[];
  stream: true;
  stream_options?: { include_usage: true };
  max_tokens?: number;
  tools?: Tool[];
  tool_choice?: 'none' | 'auto' | 'required';
  /** Provider-specific extra fields (thinking, reasoning_effort, etc.). */
  [key: string]: unknown;
}

/** Raw SSE chunk shape returned by OpenAI-compatible streaming APIs. */
export interface Chunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
      /** Provider-specific reasoning field (e.g. reasoning_content, thinking_content). */
      [key: string]: unknown;
    };
    finish_reason: string | null;
  }>;
  usage?: Usage;
}

export type StreamEvent =
  | { kind: 'content'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tool-call'; call: ToolCall }
  | { kind: 'usage'; data: Usage };

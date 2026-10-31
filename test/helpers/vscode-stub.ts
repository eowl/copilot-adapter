/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal `vscode` module stub, for running the unit tests outside VS Code.
 *
 * `npm test` loads a real VS Code instance via `@vscode/test-electron`; this
 * stub lets `npm run test:unit` run the same test files in plain mocha by
 * intercepting `require('vscode')`.
 *
 * It covers only what the tests touch: theme icons, events, secret storage,
 * the log output channel, and the language model message/part types. When a
 * test fails here with "undefined" or "not a constructor", add the missing API
 * rather than assuming a code bug, and confirm with `npm test`.
 */
import Module from 'node:module';

class ThemeIcon {
  readonly id: string;
  readonly color?: unknown;

  constructor(id: string, color?: unknown) {
    this.id = id;
    this.color = color;
  }
}

class EventEmitter<T = void> {
  private listeners: Array<(value: T) => void> = [];

  readonly event = (listener: (value: T) => void) => {
    this.listeners.push(listener);

    return {
      dispose: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      },
    };
  };

  fire(value: T): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }

  dispose(): void {
    this.listeners = [];
  }
}

class SecretStorage {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async store(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  onDidChange = () => ({ dispose() {} });
}

class LanguageModelTextPart {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }
}

class LanguageModelDataPart {
  readonly data: Uint8Array;
  readonly mimeType: string;

  constructor(data: Uint8Array, mimeType: string) {
    this.data = data;
    this.mimeType = mimeType;
  }
}

class CancellationTokenSource {
  private cancelled = false;
  private readonly listeners: Array<() => void> = [];

  readonly token = {
    isCancellationRequested: false,
    onCancellationRequested: (listener: () => void) => {
      this.listeners.push(listener);

      return {
        dispose: () => {
          const index = this.listeners.indexOf(listener);
          if (index >= 0) this.listeners.splice(index, 1);
        },
      };
    },
  };

  cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    this.token.isCancellationRequested = true;
    for (const listener of [...this.listeners]) listener();
  }

  dispose(): void {
    this.listeners.length = 0;
  }
}

/** Mirrors `vscode.LanguageModelChatMessageRole`. */
const LanguageModelChatMessageRole = { User: 1, Assistant: 2 } as const;

interface ChatMessageInit {
  role: number;
  content: unknown[];
  name?: string;
}

class LanguageModelChatMessage {
  readonly role: number;
  readonly content: unknown[];
  readonly name?: string;

  private constructor(init: ChatMessageInit) {
    this.role = init.role;
    this.content = init.content;
    this.name = init.name;
  }

  static User(content: unknown[] | string, name?: string): LanguageModelChatMessage {
    return new LanguageModelChatMessage({
      role: LanguageModelChatMessageRole.User,
      content: typeof content === 'string' ? [new LanguageModelTextPart(content)] : content,
      name,
    });
  }

  static Assistant(content: unknown[] | string, name?: string): LanguageModelChatMessage {
    return new LanguageModelChatMessage({
      role: LanguageModelChatMessageRole.Assistant,
      content: typeof content === 'string' ? [new LanguageModelTextPart(content)] : content,
      name,
    });
  }
}

class LanguageModelToolResultPart {
  readonly callId: string;
  readonly content: unknown[];

  constructor(callId: string, content: unknown[]) {
    this.callId = callId;
    this.content = content;
  }
}

class LanguageModelToolCallPart {
  readonly callId: string;
  readonly name: string;
  readonly input: unknown;

  constructor(callId: string, name: string, input: unknown) {
    this.callId = callId;
    this.name = name;
    this.input = input;
  }
}

const stub = {
  version: '1.121.0',
  ThemeIcon,
  EventEmitter,
  SecretStorage,
  env: { language: 'en' },
  Uri: { parse: (value: string) => ({ toString: () => value }) },
  workspace: {
    getConfiguration: () => ({
      get: (_key: string, defaultValue?: unknown) => defaultValue,
    }),
    onDidChangeConfiguration: () => ({ dispose() {} }),
  },
  window: {
    createOutputChannel: () => ({
      name: 'Copilot Adapter',
      append() {},
      appendLine() {},
      debug() {},
      info() {},
      warn() {},
      error() {},
      trace() {},
      show() {},
      hide() {},
      clear() {},
      dispose() {},
    }),
  },
  commands: {
    registerCommand: () => ({ dispose() {} }),
    executeCommand: async () => undefined,
  },
  lm: {
    registerLanguageModelChatProvider: () => ({ dispose() {} }),
    onDidChangeChatModels: () => ({ dispose() {} }),
    selectChatModels: async () => [],
  },
  LanguageModelChatMessageRole,
  LanguageModelChatMessage,
  LanguageModelTextPart,
  LanguageModelDataPart,
  LanguageModelToolResultPart,
  LanguageModelToolCallPart,
  CancellationTokenSource,
  LanguageModelChatToolMode: { Auto: 1, Required: 2 },
};

const mod = Module as any;
const originalLoad: (request: string, ...rest: any[]) => unknown = mod._load;

mod._load = function (request: string, ...rest: any[]) {
  if (request === 'vscode') {
    return stub;
  }

  return originalLoad.call(this, request, ...rest);
};

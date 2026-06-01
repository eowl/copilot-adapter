# Copilot Adapter

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code%20Marketplace-Install-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=Eowl.copilot-adapter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml/badge.svg)](https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml)

Use third-party AI models directly inside VS Code Copilot Chat — the same native way VS Code manages any language model provider. Bring your own API keys; no Copilot subscription required for the models themselves, and no local proxy (e.g. Ollama) needed.

[简体中文](README.zh-cn.md)

- [Providers](#providers)
- [Quick Start](#quick-start)
- [Security](#security)
- [Features](#features)
  - [Thinking Modes](#thinking-modes)
  - [Vision Proxy](#vision-proxy)
  - [Per-Provider Settings](#per-provider-settings)
- [Configuration Reference](#configuration-reference)
- [Commands](#commands)

---

## Providers

| Provider | Models | Max Context | API Keys |
|---|---|---|---|
| [DeepSeek](https://platform.deepseek.com) | V4 Flash · V4 Pro | 1 M tokens | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| [MiniMax](https://www.minimax.io) | Text-01 · M1 · M2 · M2.1 · M2.5 · M2.7 (+ highspeed variants) | 1 M tokens | [minimax.io](https://www.minimax.io/platform/user-center/basic-information/interface-key) |

All models support multi-turn tool calls and chain-of-thought reasoning. MiniMax Text-01 additionally accepts image attachments natively.

---

## Quick Start

1. Install the extension.
2. Open the **Language Models** panel (`Ctrl/Cmd+Shift+P` → *Language Models*), select a provider, and enter your API key — this is the native VS Code approach and the recommended way.
3. Open Copilot Chat, click the model selector, and choose a model.

> **Alternative:** Use the command **Copilot Adapter: Add API Key** (`Ctrl/Cmd+Shift+P`) to store a key without opening the Language Models panel.

A step-by-step walkthrough covers all of the above: open it via `Ctrl/Cmd+Shift+P` → **Welcome: Open Walkthrough** → *AI Models Adapter for Copilot Chat*.

For a visual guide with screenshots, see [How to Add a Model Provider](docs/add-model.md).

---

## Security

API keys are stored exclusively in [VS Code's Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage), backed by the OS credential manager — Keychain on macOS, Credential Manager on Windows, libsecret on Linux.

- **Never written to `settings.json`** — keys are stored as secrets, completely separate from VS Code settings. They cannot be synced via Settings Sync and will never appear in any configuration file on disk.
- **Cannot be accidentally committed** — because keys exist only in the OS credential store, there is no file to stage or push.
- **Masked in all logs** — even when `debugMode` is set to `verbose`, API keys are masked in the output channel (e.g. `sk-12345678••••••••cdef`). The raw key value is never logged.

---

## Features

### Thinking Modes

Reasoning models (DeepSeek V4 Pro, MiniMax M-series) expose a configurable effort level, accessible in the model's settings inside the Language Models panel:

| Level | Description |
|---|---|
| **None** | No reasoning steps — fastest output |
| **High** | Balanced depth, good for day-to-day tasks |
| **Max** | Full reasoning budget for hard problems |

### Vision Proxy

Text-only models cannot accept image attachments directly. When a vision proxy is configured, the extension automatically describes any attached images using a separate vision-capable model and injects those descriptions as text — so text-only models can handle image attachments seamlessly.

Set up via **Copilot Adapter: Set Vision Proxy Model** or the `copilot-adapter.visionProxyModel` setting.  
Disable at any time by setting the value to `off`.

### Per-Provider Settings

Each provider can be configured independently under `copilot-adapter.providers`:

```jsonc
"copilot-adapter.providers": {
  "deepseek": {
    "enabled": true,
    "temperature": 0.7
  },
  "minimax": {
    "enabled": false
  }
}
```

| Key | Type | Description |
|---|---|---|
| `enabled` | boolean | Enable or disable the provider (default: `true` for DeepSeek) |
| `baseUrl` | string | Override the API endpoint (useful with compatible proxies) |
| `temperature` | number (0–2) | Sampling temperature |
| `topP` | number (0–1) | Top-p nucleus sampling |
| `tokenRatio` | number | Characters-per-token ratio for context size estimation |
| `streamUsage` | boolean | Set `false` for proxies that don't support streaming usage stats |

---

## Configuration Reference

| Setting | Default | Description |
|---|---|---|
| `copilot-adapter.providers` | `{ deepseek: { enabled: true } }` | Per-provider configuration object — see [above](#per-provider-settings) |
| `copilot-adapter.maxTokens` | `0` | Max output tokens; `0` uses the model's built-in default |
| `copilot-adapter.visionProxyModel` | `"off"` | Model ID to use as vision proxy, or `"off"` to disable — see [Vision Proxy](#vision-proxy) |
| `copilot-adapter.requestTimeout` | `60` | Request timeout in seconds |
| `copilot-adapter.requestRetries` | `2` | Retry attempts on transient errors (max 5) |
| `copilot-adapter.debugMode` | `"off"` | Log verbosity: `off` / `info` / `meta` / `verbose` |

### Debug Mode Levels

| Level | Output channel | Model `id` / `apiId` / endpoint | Request dump to disk |
|---|---|---|---|
| `off` | — | — | — |
| `info` | ✔ request metadata | — | — |
| `meta` | ✔ request metadata | ✔ | — |
| `verbose` | ✔ request metadata | ✔ | ✔ |

---

## Commands

| Command | Description |
|---|---|
| *Copilot Adapter: Add API Key* | Store an API key in VS Code's secret storage |
| *Copilot Adapter: Remove API Key* | Clear a stored API key |
| *Copilot Adapter: Set Vision Proxy Model* | Choose the model to use as vision proxy |
| *Copilot Adapter: Open Settings* | Jump to extension settings |
| *Copilot Adapter: Show Logs* | Open the output channel |

---

## License

[MIT](LICENSE)

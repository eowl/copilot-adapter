<h1 align="center">Copilot Adapter</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Eowl.copilot-adapter"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-Install-blue?logo=visualstudiocode" alt="VS Code Marketplace"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml"><img src="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

Extend VS Code's native Copilot Chat with third-party AI models. Switch between [supported models](#models) directly from the Copilot model selector — the same experience as built-in Copilot models, with your own API keys, no Copilot subscription, and no local proxy needed.

[简体中文](README.zh-cn.md)

- [Models](#models)
- [Quick Start](#quick-start)
- [Security](#security)
- [Features](#features)
  - [Thinking Modes](#thinking-modes)
  - [Vision Proxy](#vision-proxy)
  - [Prefix Cache Hit Rate](#prefix-cache-hit-rate)
  - [Context Window](#context-window)
  - [Custom Models](#custom-models)
- [Configuration Reference](#configuration-reference)
- [Commands](#commands)
- [Notes](#notes)

---

## Models

| Provider | Endpoint Platform | Models |
|---|---|---|
| **DeepSeek** | [`platform.deepseek.com`](https://platform.deepseek.com) | `V4 Pro` `V4 Flash`|
| **MiniMax** | [`minimaxi.com`](https://www.minimaxi.com/) [`minimax.io`](https://www.minimax.io/) | `M3` `M2.7` `M2.7 Highspeed` `M2.5` `M2.5 Highspeed` `M2.1` `M2.1 Highspeed` `M2` |
| **Moonshot (Kimi)** | [`platform.moonshot.cn`](https://platform.moonshot.cn/) [`platform.moonshot.ai`](https://platform.moonshot.ai/) | `Kimi K2.7 Code` `Kimi K2.7 Code High-Speed` `Kimi K2.6` `Kimi K2.5` |
| **Qwen** | [`bailian.console.aliyun.com`](https://bailian.console.aliyun.com/) | `Qwen3.7 Max` `Qwen3.7 Plus` `Qwen3.6 Max` `Qwen3.6 Plus` `Qwen3.6 Flash` `Qwen3.5 Plus` `Qwen3.5 Flash` `Qwen3 Max` `Qwen3 Coder Plus` `Qwen3 Coder Flash` `Qwen Plus (US)` `Qwen Flash (US)` |
| **Zhipu (GLM)** | [`open.bigmodel.cn`](https://open.bigmodel.cn/) [`api.z.ai`](https://api.z.ai/) | `GLM-5.2` `GLM-5.1` `GLM-5` `GLM-5-Turbo` `GLM-4.7` `GLM-4.7-FlashX` `GLM-4.6` `GLM-4.5-Air` `GLM-4.5-AirX` `GLM-4-Long` `GLM-4-FlashX-250414` `GLM-4.7-Flash` `GLM-4.5-Flash` `GLM-4-Flash-250414` `GLM-5V-Turbo` `GLM-4.6V` `GLM-OCR` `GLM-4.1V-Thinking-FlashX` `GLM-4.6V-Flash` `GLM-4.1V-Thinking-Flash` `GLM-4V-Flash` |

> See each provider's website for API key registration and billing details.

---

## Quick Start

1. Install the extension.
2. Open the **Language Models** panel, select a provider, and enter your API key — this is the native VS Code approach and the recommended way.
3. Open Copilot Chat, click the model selector, and choose a model.

> **Alternative:** Use the command **Copilot Adapter: Add API Key** (`Ctrl/Cmd+Shift+P`) to store a key without opening the Language Models panel.

A step-by-step walkthrough covers all of the above: open it via `Ctrl/Cmd+Shift+P` **Welcome: Open Walkthrough** *AI Models Adapter for Copilot Chat*.

For a visual guide with screenshots, see [How to Add a Model Provider](docs/add-model.md).

---

## Security

API keys are stored exclusively in [VS Code's Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage), backed by the OS credential manager — Keychain on macOS, Credential Manager on Windows, libsecret on Linux.

- **Never written to `settings.json`** — keys are stored as secrets, completely separate from VS Code settings. They cannot be synced via Settings Sync and will never appear in any configuration file on disk.
- **Cannot be accidentally committed** — because keys exist only in the OS credential store, there is no file to stage or push.
- **Zero runtime dependencies** — the extension has no third-party library or external service dependencies at runtime. All networking uses VS Code's built-in HTTP facilities.

---

## Features

### Thinking Modes

Reasoning models (DeepSeek V4 series, MiniMax M-series, Qwen3, GLM, Kimi K2) expose a configurable thinking level accessible in the model's settings inside the Language Models panel:

| Level | Description |
|---|---|
| **None** | No reasoning steps — fastest output |
| **High** | Balanced depth, good for day-to-day tasks |
| **Max** | Full reasoning budget for hard problems |

*Levels shown are DeepSeek V4 as an example; option names may differ across providers.*

### Vision Proxy

Text-only models cannot accept image attachments directly. When a vision proxy is configured, the extension automatically describes any attached images using a separate vision-capable model and injects those descriptions as text — so text-only models can handle image attachments seamlessly.

Set up via **Copilot Adapter: Set Vision Proxy Model** or the `copilot-adapter.visionProxyModel` setting.  
Disable at any time by setting the value to `off`.

### Prefix Cache Hit Rate

The extension reorders messages in a conversation so that cacheable content appears first, boosting the cache-hit rate for models with prefix caching or automatic caching (DeepSeek, Qwen, Zhipu).  When debug mode is `info` or above, the output channel logs per-request cache details:

```
model: deepseek-v4-pro, tokens: prompt=18576 reasoning=40 completion=57, cache: hit=12160 miss=6516 rate=65%
```

### Context Window

The extension reports token usage to VS Code for every request, using one of two strategies:

- **API-reported usage** (DeepSeek, Qwen, Zhipu, Moonshot) — the model returns exact `prompt_tokens` and `completion_tokens` in the streaming response.  This is the primary path and requires no estimation.

- **Fallback estimation** (MiniMax and other providers that don't return streaming usage) — when the API does not include usage data, the extension estimates tokens from the character count of the request and response text.  The log will indicate fallback mode:

  ```
  Using fallback usage estimation (API returned no usage data) — prompt chars: 15234, response chars: 487
  ```

#### Dynamic Ratio Calibration

The chars-to-token ratio used by `provideTokenCount` (VS Code's context-window calculation) starts at a default of **4.0** and is automatically calibrated from real API usage data over time.  Each request that returns exact usage updates the ratio using EMA smoothing (80% old, 20% new).  Only changes ≥ 10% are persisted to avoid noise:

```
Chars-per-token ratio calibrated for deepseek: 4.00 to 3.38 (based on API usage: 63200 chars / 18703 tokens)
```

Providers without exact usage data (e.g. MiniMax) keep the static default ratio.

### Custom Models

VS Code Copilot Chat's official **Custom Endpoint** only supports basic model configuration (name, endpoint, API key) — it lacks vision proxy, customizable thinking modes, and cache hit rate logging. Copilot Adapter's **Custom Models** fills these gaps:

- **Vision Proxy** — text-only models can accept images via an automatic vision-proxy pipeline.
- **Customizable Thinking Modes** — configure per-model reasoning effort with vendor-specific request body shapes (DeepSeek, Qwen, Anthropic, etc.), all selectable from the model picker.
- **Cache Hit Rate Logging** — monitor prefix-cache efficiency (hit/miss rates per request) in the output channel.

Bring any OpenAI-compatible model into Copilot Chat by defining its metadata (name, endpoint, capabilities, token limits) directly in the configuration file.  Thinking models (`"thinking": true`) get automatic reasoning-effort configuration based on the model ID, with full customization available when needed.

For a step-by-step guide with screenshots, see [How to Add a Custom Model](docs/add-custom-model.md).  Ready-to-copy templates for DeepSeek, OpenAI, Anthropic, Qwen, Zhipu, MiniMax, Gemini, Grok and more are available in [`custom-models-template.jsonc`](docs/custom-models-template.jsonc).

---

## Configuration Reference

| Setting | Default | Description |
|---|---|---|
| `copilot-adapter.maxTokens` | `0` | Max output tokens per request; `0` uses the model's built-in default |
| `copilot-adapter.visionProxyModel` | `"off"` | Model to use as vision proxy, or `"off"` to disable — see [Vision Proxy](#vision-proxy) |
| `copilot-adapter.visionProxyPrompt` | *(system prompt)* | Custom system prompt for the vision proxy model |
| `copilot-adapter.requestTimeout` | `60` | HTTP request timeout in seconds; `0` = no timeout |
| `copilot-adapter.requestRetries` | `2` | Auto-retry count on rate-limit (429) or server errors (503), max 5 |
| `copilot-adapter.imageTokenEstimate` | `1020` | Estimated tokens per image for context-window tracking |
| `copilot-adapter.tokenRatio` | `4.0` | Default chars-per-token ratio for token estimation |
| `copilot-adapter.tokenRatioGlobal` | `false` | Force all models to use the global ratio, ignoring per-model calibration |
| `copilot-adapter.tokenRatioAutoCalibrate` | `true` | Auto-tune ratio from actual API usage data over time |
| `copilot-adapter.tokenRatioCalibrationThreshold` | `0.1` | Minimum relative change (1–100%) to persist auto-calibrated ratio |
| `copilot-adapter.toolWarmup` | `false` | Send fake `activate_*` tool calls before real requests (improves tool stability on some models) |
| `copilot-adapter.maxWarmupRounds` | `3` | Max warmup rounds per request (requires `toolWarmup` on) |
| `copilot-adapter.debugMode` | `"off"` | Log verbosity: `off` / `info` / `meta` / `verbose` |

### Debug Mode Levels

| Level | Output channel | Model `id` / `apiId` / endpoint |
|---|---|---|
| `off` | — | — |
| `info` | Yes (request metadata) | — |
| `meta` | Yes (request metadata) | Yes |
| `verbose` | Yes (request metadata) | Yes |

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

---

## Notes

**Profile isolation:** If you use VS Code [Profiles](https://code.visualstudio.com/docs/editor/profiles), the official Copilot Chat configuration is isolated per profile — and Copilot Adapter's configuration follows the same rule.  API keys, model groups, and custom model definitions are all scoped to the active profile.

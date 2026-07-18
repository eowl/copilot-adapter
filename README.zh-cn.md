<h1 align="center">Copilot Adapter</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Eowl.copilot-adapter"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-安装-blue?logo=visualstudiocode" alt="VS Code Marketplace"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml"><img src="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

让 VS Code 原生 Copilot Chat 无缝接入第三方 AI 模型。无需 Copilot 订阅，无需本地代理，使用自己的 API Key，即可在 Copilot Chat 的模型选择器中直接切换[支持的模型](#模型)——体验与 Copilot 内置模型完全一致。

[English](README.md)

- [模型](#模型)
- [快速开始](#快速开始)
- [安全性](#安全性)
- [功能特性](#功能特性)
  - [思考模式](#思考模式)
  - [视觉代理](#视觉代理)
  - [前缀缓存命中率](#前缀缓存命中率)
  - [上下文窗口计算](#上下文窗口计算)
  - [自定义模型](#自定义模型)
  - [余额与用量显示](#余额与用量显示)
- [配置参考](#配置参考)
- [命令](#命令)
- [注意事项](#注意事项)

---

## 模型

| 提供商 | 端点 | 模型 |
|---|---|---|
| **DeepSeek** | [`Deepseek Platform`](https://platform.deepseek.com) | `V4 Pro` `V4 Flash`|
| **MiniMax** | [`minimaxi.com`](https://www.minimaxi.com/) [`minimax.io`](https://www.minimax.io/) | `M3` `M2.7` `M2.7 Highspeed` `M2.5` `M2.5 Highspeed` `M2.1` `M2.1 Highspeed` `M2` |
| **Moonshot (Kimi)** | [`platform.moonshot.cn`](https://platform.moonshot.cn/) [`platform.moonshot.ai`](https://platform.moonshot.ai/) [`Kimi Code`](https://www.kimi.com/code/docs/) | `Kimi K3` `Kimi K2.7 Code` `Kimi K2.7 Code High-Speed` `Kimi K2.6` `Kimi K2.5` |
| **Qwen** | [`bailian.console.aliyun.com`](https://bailian.console.aliyun.com/) `CN` `US` `SGP` `EU` `JP` | `Qwen3.7 Max` `Qwen3.7 Plus` `Qwen3.6 Max` `Qwen3.6 Plus` `Qwen3.6 Flash` `Qwen3.5 Plus` `Qwen3.5 Flash` `Qwen3 Max` `Qwen3 Coder Plus` `Qwen3 Coder Flash` `Qwen Plus (US only)` `Qwen Flash (US only)` |
| **智谱** | [`BigModel`](https://open.bigmodel.cn/) [`Z.ai`](https://api.z.ai/) `Coding Plan` | `GLM-5.2` `GLM-5.1` `GLM-5` `GLM-5-Turbo` `GLM-4.7` `GLM-4.7-FlashX` `GLM-4.6` `GLM-4.5-Air` `GLM-4.5-AirX` `GLM-4-Long` `GLM-4-FlashX-250414` `GLM-4.7-Flash` `GLM-4.5-Flash` `GLM-4-Flash-250414` `GLM-5V-Turbo` `GLM-4.6V` `GLM-OCR` `GLM-4.1V-Thinking-FlashX` `GLM-4.6V-Flash` `GLM-4.1V-Thinking-Flash` `GLM-4V-Flash` |
| **Xiaomi MIMO** | [`Xiaomi MIMO`](https://mimo.mi.com/) `Token Plan CN` `Token Plan SGP` `Token Plan EU` | `mimo-v2.5-pro` `mimo-v2.5` |
| **ByteDance**| [`Volcengine`](https://ai.volcengine.com) `Volcengine Coding Plan`| `Doubao Seed 2.0 Pro` `Doubao Seed 2.0 Lite` `Doubao Seed 2.0 Mini` `Doubao Seed 2.0 Code` `Deepseek V4 Pro` `Deepseek V4 Flash` `kimi 2.5` `Kimi 2.6` `Kimi K2.7 Code` `GLM-5.2`|
| **ByteDance**| [`BytePlus`](https://www.byteplus.com/en/product/modelark) `ap-southeast` `ap-southeast Coding Plan` `eu-west`| `Dola Seed 2.0 Pro` `Dola Seed 2.0 Lite` `Dola Seed 2.0 Mini` `Dola Seed 2.0 Code` `Deepseek V4 Pro` `Deepseek V4 Flash` `kimi 2.5` `GLM-5.1`|

*以上模型列表是该扩展内置的，如需要其它模型请参考[自定义模型](#自定义模型)*

> 请至各提供商官网注册并获取 API Key。

---

## 快速开始

1. 安装扩展。
2. 打开 **Language Models** 面板，选择提供商并输入 API Key——这是 VS Code 原生方式，也是推荐做法。
3. 打开 Copilot Chat，点击模型选择器，选择一个模型即可使用。

> **备用方式：** 执行命令 **Copilot Adapter: Add API Key**（`Ctrl/Cmd+Shift+P`）可在不打开 Language Models 面板的情况下存储 Key。

完整的分步引导可通过 `Ctrl/Cmd+Shift+P` **Welcome: Open Walkthrough** *AI Models Adapter for Copilot Chat* 打开。

如需带截图的详细操作说明，请参阅[如何添加模型提供商](docs/add-model.zh-cn.md)。

---

## 安全性

API Key 仅存储于 [VS Code Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)，底层由操作系统凭据管理器保护——macOS 上为 Keychain，Windows 上为 Credential Manager，Linux 上为 libsecret。

- **永远不会写入 `settings.json`** — Key 作为 Secret 存储，与 VS Code 设置完全隔离，不会通过 Settings Sync 同步，也不会出现在磁盘上的任何配置文件中。
- **不可能被意外提交** — Key 仅存在于操作系统凭据库中，不存在可被 git 追踪的文件。
- **零运行时依赖** — 扩展在运行时没有任何第三方库依赖或外部服务依赖，所有网络通信均使用 VS Code 内置的 HTTP 设施。

---

## 功能特性

### 思考模式

推理模型支持配置推理深度，可在 Language Models 面板的模型设置中调整：

| 级别 | 说明 |
|---|---|
| **None（无）** | 不进行推理步骤，输出最快 |
| **High（高）** | 均衡深度，适合日常编程任务 |
| **Max（最大）** | 全力推理，适合复杂问题 |

*以上级别以 DeepSeek V4 为例；不同提供商的选项名称可能不同。*

### 视觉代理

纯文本模型无法直接处理图片附件。配置视觉代理后，扩展会自动使用一个具备视觉能力的模型描述附件图片，并将描述以文本形式注入上下文，从而让纯文本模型也能无缝处理图片输入。

通过命令 **Copilot Adapter: Set Vision Proxy Model** 或设置项 `copilot-adapter.visionProxyModel` 进行配置。  
将值设为 `off` 即可随时禁用。

### 前缀缓存命中率

扩展会调整连续对话中消息的顺序，优先将可以被缓存的内容放在前面，以提升支持前缀缓存和主动缓存的模型（DeepSeek、Qwen、Zhipu）的缓存命中率。在日志级别为 `info` 或更高时，输出频道中会记录每次请求的缓存命中详情：

```
model: deepseek-v4-pro, tokens: prompt=18576 reasoning=40 completion=57, cache: hit=12160 miss=6516 rate=65%
```

### 上下文窗口计算

扩展会为每次请求向 VS Code 上报 Token 用量，具体策略分为两种：

- **API 返回用量**（DeepSeek、Qwen、Zhipu、Moonshot）—— 模型在流式响应中返回精确的 `prompt_tokens` 和 `completion_tokens`。这是主要路径，无需估算。

- **降级估算**（MiniMax 等不返回流式用量的提供商）—— 当 API 未包含用量数据时，扩展通过请求和响应文本的字符数估算 Token 用量。日志中会标明降级模式：

  ```
  Using fallback usage estimation (API returned no usage data) — prompt chars: 15234, response chars: 487
  ```

#### 动态比例校准

`provideTokenCount`（VS Code 的上下文窗口计算）使用的字符/Token 比例初始为 **4.0**，会根据每次 API 返回的真实用量自动校准。每次返回精确用量的请求都会用 EMA 平滑方式（旧值 80%、新值 20%）更新比例。为避免噪声，仅当变化 ≥ 10% 时才会存储：

```
Chars-per-token ratio calibrated for deepseek: 4.00 to 3.38 (based on API usage: 63200 chars / 18703 tokens)
```

无法获取精确用量的提供商（如 MiniMax）保持静态默认比例。

### 自定义模型

VS Code Copilot Chat 官方的 **Custom Endpoint** 仅支持基础的模型配置（名称、端点、API Key），无法使用视觉代理、定制化思考模式和缓存命中率日志。Copilot Adapter 的 **Custom Models** 填补了这些缺口：

- **视觉代理** — 纯文本模型也能通过自动视觉代理管线处理图片附件。
- **可定制的思考模式** — 针对不同厂商的请求体格式（DeepSeek、Qwen、Anthropic 等）配置各模型的推理强度，在模型选择器中即可切换。
- **缓存命中率日志** — 在输出频道中查看每次请求的前缀缓存命中/未命中率。

通过在配置文件中定义元数据（名称、端点、能力、token 限制），可将任意兼容 OpenAI 接口的模型接入 Copilot Chat。思考模型（`"thinking": true`）会根据模型 ID 自动匹配预置的推理强度配置，同时支持完整自定义。

详细图文教程请参阅[如何添加自定义模型](docs/add-custom-model.zh-cn.md)。涵盖 DeepSeek、OpenAI、Anthropic、通义千问、智谱、MiniMax、Gemini、Grok 等的即用型模板见 [`custom-models-template.zh-cn.jsonc`](docs/custom-models-template.zh-cn.jsonc)。

### 余额与用量显示

对于 API Key 模式的提供商（DeepSeek、Moonshot），扩展可以在每个模型的信息卡片上显示账户余额。对于 Coding Plan 模式（如 Kimi Code），扩展会显示计划用量配额（如限流窗口、周用量和总量）。结果会出现在语言模型面板中模型的悬浮卡片底部。

查询结果会被缓存，避免频繁调用 API。你可以通过 `copilot-adapter.balanceCacheTime` 设置来控制缓存时长。选择「关闭（不缓存）」则每次刷新模型列表时都重新获取余额或用量。

[余额与用量显示](docs/balance-usage-info.zh-cn.md)

---

## 配置参考

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `copilot-adapter.maxTokens` | `0` | 每次请求最大输出 Token 数；`0` 使用模型内置默认值 |
| `copilot-adapter.visionProxyModel` | `"off"` | 视觉代理模型 ID，`"off"` 禁用，详见[视觉代理](#视觉代理) |
| `copilot-adapter.visionProxyPrompt` | *(系统提示词)* | 视觉代理使用的自定义系统提示词 |
| `copilot-adapter.requestTimeout` | `60` | HTTP 请求超时时间（秒）；`0` = 无超时 |
| `copilot-adapter.requestRetries` | `2` | 速率限制(429)或服务端错误(503)时的自动重试次数，最多 5 次 |
| `copilot-adapter.imageTokenEstimate` | `1020` | 上下文窗口追踪中每张图片的估算 token 消耗 |
| `copilot-adapter.tokenRatio` | `4.0` | 默认字符/token 比率，用于 token 估算 |
| `copilot-adapter.tokenRatioGlobal` | `false` | 强制所有模型使用全局比率，忽略各模型校准结果 |
| `copilot-adapter.tokenRatioAutoCalibrate` | `true` | 根据 API 实际用量数据自动校准比率 |
| `copilot-adapter.tokenRatioCalibrationThreshold` | `0.1` | 自动校准触发的最小相对变化（1%–100%） |
| `copilot-adapter.toolWarmup` | `false` | 正式请求前发送模拟 `activate_*` 工具调用（改善部分模型的工具稳定性） |
| `copilot-adapter.balanceCacheTime` | `60` | 查询余额/用量的请求缓存时长（秒）。`0` 禁用缓存——详见[余额与用量显示](#余额与用量显示) |
| `copilot-adapter.pricingCurrency` | `""` | 模型悬浮卡片上额度单位的备选币种。优先级：余额 API 响应 > 端点配置 > 此设置 > VS Code 界面语言（中文为 CNY，其他为 USD） |
| `copilot-adapter.maxWarmupRounds` | `3` | 每次请求最大预热轮数（需启用 `toolWarmup`） |
| `copilot-adapter.debugMode` | `"off"` | 日志级别：`off` / `info` / `meta` / `verbose` |

### 日志级别说明

| 级别 | 输出频道 | 模型 `id` / `apiId` / 端点 |
|---|---|---|
| `off` | — | — |
| `info` | 是（请求元数据） | — |
| `meta` | 是（请求元数据） | 是 |
| `verbose` | 是（请求元数据） | 是 |

---

## 命令

| 命令 | 说明 |
|---|---|
| *Copilot Adapter: Add API Key* | 将 API Key 存入 VS Code Secret Storage |
| *Copilot Adapter: Remove API Key* | 清除已存储的 API Key |
| *Copilot Adapter: Set Vision Proxy Model* | 选择视觉代理使用的模型 |
| *Copilot Adapter: Open Settings* | 跳转至扩展设置页 |
| *Copilot Adapter: Show Logs* | 打开输出频道 |

---

## 注意事项

**Profile 隔离：** 如果你使用了 VS Code 的 [Profiles](https://code.visualstudio.com/docs/editor/profiles) 功能，官方 Copilot Chat 的配置是按 Profile 隔离的——Copilot Adapter 的配置同样遵循此规则。API Key、模型分组和自定义模型定义均作用于当前活动的 Profile。

---

## 开源许可

[MIT](LICENSE)

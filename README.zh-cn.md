<h1 align="center">Copilot Adapter</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Eowl.copilot-adapter"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-安装-blue?logo=visualstudiocode" alt="VS Code Marketplace"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml"><img src="https://github.com/eowl/copilot-adapter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

让 VS Code 原生 Copilot Chat 无缝接入第三方 AI 模型。无需 Copilot 订阅，无需本地代理，使用自己的 API Key，即可在 Copilot Chat 的模型选择器中直接切换 DeepSeek、MiniMax 等第三方模型——体验与 Copilot 内置模型完全一致。

[English](README.md)

- [支持的提供商](#支持的提供商)
- [快速开始](#快速开始)
- [安全性](#安全性)
- [功能特性](#功能特性)
  - [思考模式](#思考模式)
  - [视觉代理](#视觉代理)
  - [提供商独立配置](#提供商独立配置)
- [配置参考](#配置参考)
- [命令](#命令)

---

## 支持的提供商

| 提供商 | 模型 | API Keys |
|---|---|---|
| [DeepSeek](https://platform.deepseek.com) | V4 Flash · V4 Pro | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| [MiniMax](https://www.minimax.io) | Text-01 · M1 · M2 · M2.1 · M2.5 · M2.7（含高速版） | [minimax.io](https://www.minimax.io/platform/user-center/basic-information/interface-key) |

---

## 快速开始

1. 安装扩展。
2. 打开 **Language Models** 面板（`Ctrl/Cmd+Shift+P` → *Language Models*），选择提供商并输入 API Key——这是 VS Code 原生方式，也是推荐做法。
3. 打开 Copilot Chat，点击模型选择器，选择一个模型即可使用。

> **备用方式：** 执行命令 **Copilot Adapter: Add API Key**（`Ctrl/Cmd+Shift+P`）可在不打开 Language Models 面板的情况下存储 Key。

完整的分步引导可通过 `Ctrl/Cmd+Shift+P` → **Welcome: Open Walkthrough** → *AI Models Adapter for Copilot Chat* 打开。

如需带截图的详细操作说明，请参阅[如何添加模型提供商](docs/add-model.zh-cn.md)。

---

## 安全性

API Key 仅存储于 [VS Code Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)，底层由操作系统凭据管理器保护——macOS 上为 Keychain，Windows 上为 Credential Manager，Linux 上为 libsecret。

- **永远不会写入 `settings.json`** — Key 作为 Secret 存储，与 VS Code 设置完全隔离，不会通过 Settings Sync 同步，也不会出现在磁盘上的任何配置文件中。
- **不可能被意外提交** — Key 仅存在于操作系统凭据库中，不存在可被 git 追踪的文件。
- **日志中全程掩码** — 即使将 `debugMode` 设为 `verbose`，输出频道中的 API Key 也会以掩码形式显示（如 `sk-12345678••••••••cdef`），原始值绝不会出现在日志中。

---

## 功能特性

### 思考模式

推理模型（DeepSeek V4 Pro、MiniMax M 系列）支持配置推理深度，可在 Language Models 面板的模型设置中调整：

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

---

## 配置参考

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `copilot-adapter.maxTokens` | `0` | 最大输出 Token 数；`0` 表示使用模型内置默认值 |
| `copilot-adapter.visionProxyModel` | `"off"` | 视觉代理使用的模型 ID，`"off"` 表示禁用，详见[视觉代理](#视觉代理) |
| `copilot-adapter.requestTimeout` | `60` | 请求超时时间（秒） |
| `copilot-adapter.requestRetries` | `2` | 瞬时错误重试次数（最多 5 次） |
| `copilot-adapter.debugMode` | `"off"` | 日志详细程度：`off` / `info` / `meta` / `verbose` |

### 日志级别说明

| 级别 | 输出频道 | 模型 `id` / `apiId` / 端点 | 请求 dump 写入磁盘 |
|---|---|---|---|
| `off` | — | — | — |
| `info` | ✔ 请求元数据 | — | — |
| `meta` | ✔ 请求元数据 | ✔ | — |
| `verbose` | ✔ 请求元数据 | ✔ | ✔ |

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

## 许可证

[MIT](LICENSE)

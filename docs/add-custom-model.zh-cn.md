# 通过 JSON 自定义模型

你可以通过编写 JSON 配置文件来自定义模型。当你需要添加插件内置列表之外的模型，或需要覆盖某些模型参数时，这会非常有用。

---

## 快速开始

1. 通过命令面板打开自定义模型文件：`Ctrl/Cmd+Shift+P` → *Copilot Adapter: 打开自定义模型文件*。插件会自动在存储目录中创建 `custom-models.json`。按以下结构编辑文件，或参考[模板文件](https://github.com/eowl/copilot-adapter/blob/main/docs/custom-models-template.jsonc)中的现成示例。

```jsonc
[
  {
    "id": "deepseek-v4-pro",              // 必填 · 唯一标识，须在所有条目中唯一
    "label": "DeepSeek V4 Pro",           // 必填 · 模型选择器中显示的名称
    "provider": "deepseek",               // 必填 · 提供商 ID（deepseek | minimax | moonshot | qwen | zhipu）
    "endpoint": "deepseek",               // 必填 · endpoint（单字符串或数组，支持 ID / label / URL）

    "family": "deepseek-v4",              // 可选 · 模型系列，默认 "custom"
    "version": "2025-04",                 // 可选 · 版本号，默认 ""
    "maxInputTokens": 200000,             // 可选 · 最大输入 token，默认 128000
    "maxOutputTokens": 8192,              // 可选 · 最大输出 token，默认 32000
    "detail": "我的自定义模型",             // 可选 · 描述文本，默认 ""
    "thinking": true,                     // 可选 · 是否支持思考模式，默认 false
    "imageInput": false,                  // 可选 · 是否支持图片输入，默认 false
    "imageField": "image_url",            // 可选 · 图片字段名，仅 imageInput=true 时有效
    "maxTools": 128,                      // 可选 · 最大工具调用数
    "contentTag": "think",                // 可选 · 流式响应中的思考标签名

    // 不提供 thinkingConfig 则继承提供商的默认配置
    "thinkingConfig": {                   // 可选
      "default": "high",                  // 必填 · 默认思考模式值
      "options": [                        // 必填 · 思考模式选项列表
        {
          "value": "high",               // 必填 · 选项值
          "label": "think.high",          // 可选 · 展示标签，不填则用 value 作为标签
          "hint": "think.high.hint",      // 可选 · 描述提示文本
          "requestFields": {              // 可选 · 附加请求字段
            "thinking": { "type": "enabled" }
          }
        },
        {
          "value": "none",               // 必填
          "label": "think.none",          // 可选
          "hint": "think.none.hint",      // 可选
          "requestFields": {              // 可选
            "thinking": { "type": "disabled" }
          }
        }
      ]
    }
  }
]
```

2. 刷新**语言模型**面板——你的自定义模型将出现在内置模型旁边。

---

## 文件格式

JSON 文件必须是顶层**数组**，包含一个或多个模型条目。每个条目定义一个自定义模型。

---

## 字段参考

### `id`（必填，`string`）

模型的唯一标识符。用于内部区分不同模型，应在所有自定义条目中保持唯一。必须是非空字符串。

**示例：** `"my-custom-deepseek"`

---

### `label`（必填，`string`）

模型选择器中显示的展示名称。插件会自动添加后缀 `"（自定义）"` 以区别于内置模型。

**示例：** `"我的 DeepSeek V4 Pro"`

---

### `provider`（必填，`string`）

该模型所属的内置提供商 ID。必须与以下支持的提供商 ID 之一完全匹配。

**支持的值：**

| Provider ID | 提供商名称    |
|-------------|--------------|
| `deepseek`  | DeepSeek     |
| `minimax`   | MiniMax      |
| `moonshot`  | Moonshot/Kimi|
| `qwen`      | 千问 Qwen    |
| `zhipu`     | 智谱 GLM     |

**示例：** `"deepseek"`

---

### `endpoint`（必填，`string | string[]`）

指定此模型应用于哪些 endpoint。可以是单个字符串或字符串数组。每个值支持以下写法：

- **Endpoint ID** — 如 `"deepseek"`, `"cn"`, `"minimaxi.com"`
- **Endpoint Label** — 如 `"api.minimaxi.com"`, `"api.minimax.io"`
- **URL（完整或部分）** — 如 `"https://api.minimaxi.com/v1/chat/completions"`, `"https://api.minimaxi.com/v1"`, `"api.minimaxi.com"`

插件会按 ID → Label → URL 包含 的优先级顺序进行匹配。

**各提供商支持的 endpoint ID：**

| 提供商      | Endpoint ID                              |
|------------|-----------------------------------------|
| `deepseek` | `deepseek`                              |
| `minimax`  | `minimaxi.com`、`minimax.io`             |
| `moonshot` | `moonshot.cn`、`moonshot.ai`             |
| `qwen`     | `cn`、`us`、`sgp`、`eu`                  |
| `zhipu`    | `bigmodel`、`bigmodel-coding`、`z.ai`、`z.ai-coding` |

**示例：** `"deepseek"`、`["cn", "us"]`、`"api.minimaxi.com"`、`"https://api.moonshot.cn/v1"`

---

### `family`（可选，`string`）

模型系列分类。未指定时默认为 `"custom"`。

**示例：** `"deepseek-v4"`

---

### `version`（可选，`string`）

模型版本号字符串。默认为空字符串。

**示例：** `"2025-04"`

---

### `maxInputTokens`（可选，`number`）

模型支持的最大输入 token 数。必须为正整数。默认为 `128000`（128K）。

**示例：** `200000`

---

### `maxOutputTokens`（可选，`number`）

模型可生成的最大输出 token 数。必须为正整数。默认为 `32000`（32K）。

**示例：** `8192`

---

### `detail`（可选，`string`）

在 VS Code 模型信息面板中显示的描述或详情文本。默认空。

**示例：** `"我的私有微调 DeepSeek 模型"`

---

### `thinking`（可选，`boolean`）

此模型是否支持推理/深度思考模式。默认为 `false`。

**示例：** `true`

---

### `thinkingConfig`（可选，`object`）

用于模型配置面板中展示的思考模式选择器的配置。

| 字段       | 类型                        | 描述 |
|-----------|-----------------------------|------|
| `default` | `string`（必填）              | 默认思考模式值，必须与某个 option 的 `value` 匹配。 |
| `options` | 对象数组（必填）               | 可选思考模式选项列表。 |

每个选项对象：

| 字段             | 类型     | 描述 |
|-----------------|----------|------|
| `value`           | `string`（必填） | 发送给 API 的值。 |
| `label`           | `string`（可选） | 该选项的展示标签（支持 NLS key）。不填则使用 `value` 作为标签。 |
| `hint`            | `string`（可选） | 描述/提示文本（支持 NLS key，如 `"think.high.hint"`）。 |
| `requestFields`   | `object`（可选） | 选中此选项时额外合并到 API 请求体中的字段。 |

**示例：**

```json
{
  "default": "high",
  "options": [
    {
      "value": "high",
      "label": "think.high",
      "hint": "think.high.hint",
      "requestFields": { "thinking": { "type": "enabled" } }
    },
    {
      "value": "none",
      "label": "think.none",
      "hint": "think.none.hint",
      "requestFields": { "thinking": { "type": "disabled" } }
    }
  ]
}
```

> **注意：** 如果不提供 `thinkingConfig`，模型将继承所属提供商的默认思考配置。如果提供商也没有，则不显示思考模式选择器。

---

### `imageInput`（可选，`boolean`）

模型是否支持图片/图像输入（视觉模型）。默认为 `false`。

**示例：** `true`

---

### `imageField`（可选，`string`）

API 请求体中用于图片数据的字段名。仅在 `imageInput` 为 `true` 时有意义。默认使用提供商的默认图片字段（通常是 `"image_url"`）。

**示例：** `"image"`

---

### `maxTools`（可选，`number`）

每次请求支持的最大工具调用次数。必须为正整数。默认使用提供商的默认限制。

**示例：** `128`

---

### `contentTag`（可选，`string`）

用于在流式响应中识别思考/推理内容的标签名。仅对不使用独立思考字段的提供商需要。对于 MiniMax 模型，这个标签通常是 `"think"`。

**示例：** `"think"`

---

## 高级配置

### 文件位置

自定义模型文件固定存储在插件的全局存储目录中：

- **路径：** `<VS Code 全局存储目录>/copilot-adapter/custom-models.json`
- **打开方式：** 命令面板 `Ctrl/Cmd+Shift+P` → *Copilot Adapter: 打开自定义模型文件*
- **模板参照：** [custom-models-template.jsonc](https://github.com/eowl/copilot-adapter/blob/main/docs/custom-models-template.jsonc) — 包含各提供商的完整配置模板

文件在插件首次激活时自动创建（初始内容为空数组 `[]`）。编辑文件后保存，插件会自动重新加载模型。

### 校验

插件在加载时会对 JSON 文件进行校验。如果存在错误（无效字段、未知的 provider ID、缺少必填字段等），它们会以诊断波浪线（squiggles）的形式出现在 JSON 文件中。修正错误后，模型会在下次校验时自动加载。

### 一个文件定义多个模型

可以在一个 JSON 文件中定义任意数量的模型，每个模型可以指向不同的提供商和 endpoint：

```json
[
  {
    "id": "my-deepseek",
    "label": "我的 DeepSeek",
    "provider": "deepseek",
    "endpoint": ["deepseek"],
    "thinking": true
  },
  {
    "id": "my-qwen",
    "label": "我的 Qwen",
    "provider": "qwen",
    "endpoint": ["cn", "us"],
    "imageInput": true
  }
]
```

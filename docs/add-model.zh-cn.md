# 如何添加模型提供商

本文以 DeepSeek 为例，演示通过 VS Code **语言模型**面板添加提供商的完整流程——这是官方推荐的原生方式。

---

## 第 1 步 打开 Copilot Chat 的模型选择器

点击 Copilot Chat 输入框底部的模型选择器，可以看到当前可用的模型列表。此时 DeepSeek 和 MiniMax 尚未出现。

![添加提供商前的模型选择器](../assets/images/zh/add-model-step-01.png)

---

## 第 2 步 打开语言模型面板，点击"添加模型..."

在模型管理面板或通过 `Ctrl/Cmd+Shift+P` *语言模型* 打开**语言模型**面板，点击右上角的 **+ 添加模型...**。安装插件后，下拉列表中会出现插件支持的提供商，选择你需要的即可。

![语言模型面板及添加模型下拉菜单](../assets/images/zh/add-model-step-02.png)

---

## 第 3 步 确认分组名称

弹出输入框要求填写分组名称。默认已填入提供商名称，你也可以输入任意喜欢的名字，只要不与已有分组重复即可。确认后按 **Enter**。

![分组名称输入框](../assets/images/zh/add-model-step-03.png)

---

## 第 4 步 输入 API Endpoint 和 API Key

如果某个 provider 支持多个 endpoint，请先选择或输入 endpoint，如下图所示。

![API Endpoint 输入框](../assets/images/zh/add-model-step-04-01.png)

然后输入以 `sk-` 开头的 API Key 并按 **Enter**。Key 会立即存入 VS Code Secret Storage，不会写入磁盘或任何配置文件。

![API Key 输入框](../assets/images/zh/add-model-step-04.png)

> Tip：同一个 provider 支持添加多个 group，但请确保它们的 **Group Name** 和 **API Key** 都不相同。

---

## 第 5 步 提供商出现在语言模型面板中

语言模型面板中现在显示 DeepSeek 分组，其下列出了两个模型。随时可点击分组名称旁的 ⚙ 图标修改 API Key 或调整配置。

![语言模型面板显示 DeepSeek 已添加](../assets/images/zh/add-model-step-05.png)

---

## 第 6 步 在 Copilot Chat 中使用模型

再次打开 Copilot Chat 的模型选择器，DeepSeek V4 Flash 和 DeepSeek V4 Pro 已出现在**其他模型**分组下。选择其中一个即可开始对话。

![模型选择器中显示 DeepSeek 模型](../assets/images/zh/add-model-step-06.png)

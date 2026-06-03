## 视觉代理（可选）

视觉代理可以让纯文本模型（如 DeepSeek-V3）处理图片附件——将图片先路由给具有视觉能力的模型，转换为文字描述后再注入请求。

当聊天消息中附有图片时，视觉代理会：

1. 将图片发送给选定的视觉模型
2. 将图片转换为文字描述
3. 将描述注入到原始请求中

---

### 配置

从当前 Copilot Chat 中可用的模型里选择一个支持图片的模型：

[配置视觉代理](command:copilot-adapter.setVisionProxyModel)

任何支持图片输入的模型均可——如 GPT-4o、Claude 3.5 Sonnet、Gemini 1.5 Pro 等。

---

### 禁用

在设置中将 `copilot-adapter.visionProxyModel` 设为 `off`，或运行：

[配置视觉代理](command:copilot-adapter.setVisionProxyModel)

然后在列表中选择**禁用视觉代理**。

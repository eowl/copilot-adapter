## 高级配置

精细调整提供商设置、启用视觉支持并控制诊断输出。

[打开扩展设置 →](command:copilot-adapter.openSettings)

---

### 视觉代理

视觉代理在将消息发送给纯文本模型之前，会把图片附件转换为文字描述。

选择一个支持视觉的模型（如 Copilot Chat 中可用的 GPT-4o 或 Claude 模型）：

[配置视觉代理 →](command:copilot-adapter.setVisionProxyModel)

---

### 调试模式

`copilot-adapter.debugMode`：

- **off** — 无输出
- **info** — 仅请求元数据（可安全分享）
- **verbose** — 完整请求体写入磁盘（请勿公开）

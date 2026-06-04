## Add a model provider

There are two ways to connect a provider. **Method 1 is the native VS Code approach** — your key is managed by VS Code and no extra command is needed later.

---

### Method 1 — Language Models panel (native, recommended)

1. Open the Language Models panel:
   [Open Language Models](command:workbench.action.chat.manage)

2. Under **Language Model Providers**, find **DeepSeek** or **MiniMax**.

3. Click the **Configure** button and enter your API key when prompted.

Get your API keys here:

- **DeepSeek** — [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- **MiniMax** — [minimax.io · Interface Key](https://www.minimax.io/platform/user-center/basic-information/interface-key)

> Your key is stored securely by VS Code and passed to the extension automatically.

---

### Method 2 — Add API Key command

Run the command below, select a provider, and enter your key. The key is stored in the extension's own secret storage.

[Add API Key](command:copilot-adapter.addApiKey)

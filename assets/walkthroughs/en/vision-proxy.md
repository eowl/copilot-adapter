## Vision proxy (optional)

The vision proxy lets text-only models (like DeepSeek-V3) handle image attachments by routing them through a vision-capable model first.

When an image is attached to a chat message, the proxy:

1. Sends the image to the selected vision model
2. Converts it to a text description
3. Injects that description into the original request

---

### Set up

Choose a vision-capable model from the ones currently available in Copilot Chat:

[Configure Vision Proxy](command:copilot-adapter.setVisionProxyModel)

Any model that supports image inputs works — e.g. GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro.

---

### Disable

Set `copilot-adapter.visionProxyModel` to `off` in settings, or run:

[Configure Vision Proxy](command:copilot-adapter.setVisionProxyModel)

and select **Disable Vision Proxy** from the list.

## Advanced configuration

Fine-tune providers, enable vision support, and control diagnostic output.

[Open Extension Settings →](command:copilot-adapter.openSettings)

---

### Vision proxy

The vision proxy converts image attachments to text descriptions before sending them to text-only models.

Set a vision-capable model (e.g. a GPT-4o or Claude model available in Copilot Chat):

[Configure Vision Proxy →](command:copilot-adapter.setVisionProxyModel)

---

### Debug mode

`copilot-adapter.debugMode`:

- **off** — no output
- **info** — request metadata only (safe to share)
- **verbose** — full payloads written to disk (keep local)

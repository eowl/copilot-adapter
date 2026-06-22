import type { Translation } from './types';

export const en: Translation = {
  'provider.deepseek.detail': 'General-purpose & deep reasoning',
  'provider.minimax.detail': 'Deep reasoning with long context support',
  'provider.moonshot.detail': 'Moonshot Kimi series',
  'provider.mimo.detail': 'MIMO series',
  'provider.qwen.detail': 'Alibaba Qwen series',
  'provider.zhipu.detail': 'Zhipu BigModel GLM series',
  'provider.bytedance.detail': 'BytePlus ModelArk',

  'model.deepseek-v4-flash.detail': 'Fast, general-purpose model',
  'model.deepseek-v4-pro.detail': 'Deep reasoning model',

  'model.kimi-k2.7-code.detail':
    'Kimi K2.7 Code is an open-source, coding-focused agentic model developed by Moonshot AI',
  'model.kimi-k2.7-code-highspeed.detail':
    'Kimi K2.7 Code High-Speed Edition, the same model as Kimi K2.7 Code, but with output speed about 5-6 times faster than the standard version',
  'model.kimi-k2.6.detail': 'Latest flagship — enhanced long-range coding & reasoning',
  'model.kimi-k2.5.detail': 'Deep reasoning model with vision support',
  'model.kimi.think.enabledAlways': 'Thinking Mode',
  'model.kimi.think.enabledAlways.hint':
    'This model always thinks and always enables the Preserved Thinking mode, which cannot be disabled',

  'model.minimax-m2.detail': 'Deep reasoning model',
  'model.minimax-m2.1.detail': 'Deep reasoning model',
  'model.minimax-m2.1-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m2.5.detail': 'Deep reasoning model',
  'model.minimax-m2.5-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m2.7.detail': 'Deep reasoning model',
  'model.minimax-m2.7-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m3.detail': 'Deep reasoning with vision support',

  'model.qwen3.7-max.detail': 'Flagship model, latest generation',
  'model.qwen3.7-plus.detail': 'Balanced general-purpose model',
  'model.qwen3.6-max.detail': 'Flagship model',
  'model.qwen3.6-plus.detail': 'Balanced general-purpose model',
  'model.qwen3.6-flash.detail': 'Fast, low-cost model',
  'model.qwen3.5-plus.detail': 'Balanced general-purpose model',
  'model.qwen3.5-flash.detail': 'Fast, low-cost model',
  'model.qwen3-max.detail': 'Flagship model, long context',
  'model.qwen3-coder-plus.detail': 'Coding-focused model',
  'model.qwen3-coder-flash.detail': 'Fast coding-focused model',
  'model.qwen-plus-us.detail': 'Balanced model — only available on the US region endpoint',
  'model.qwen-flash-us.detail': 'Fast, low-cost model — only available on the US region endpoint',

  'model.glm-5.2.detail': 'Latest flagship — open-source Coding SOTA',
  'model.glm-5.1.detail': 'High-intelligence base — Coding on par with Claude',
  'model.glm-5.detail': 'High-intelligence base model — agentic long-horizon planning',
  'model.glm-5-turbo.detail': 'Lobster-tuned base model — optimized for long-task execution',
  'model.glm-4.7.detail': 'High-intelligence model — upgraded chat, reasoning and agentic skills',
  'model.glm-4.7-flashx.detail': 'Lightweight high-speed model for general writing and translation',
  'model.glm-4.6.detail': 'High-performance model — 200K context, advanced coding & tool use',
  'model.glm-4.5-air.detail': 'Cost-effective model — strong reasoning, coding and agentic tasks',
  'model.glm-4.5-airx.detail': 'Cost-effective ultra-fast variant — low latency at moderate price',
  'model.glm-4-long.detail': 'Ultra-long input — up to 1M context window',
  'model.glm-4-flashx-250414.detail': 'Enhanced Flash variant — fast inference, high concurrency',
  'model.glm-4.7-flash.detail': 'Free tier of the latest base model',
  'model.glm-4.5-flash.detail': 'Free model with deep-thinking mode (deprecated soon)',
  'model.glm-4-flash-250414.detail': 'Free model — long-context, multilingual, tool calls',
  'model.glm-5v-turbo.detail': 'Multimodal coding base — vision + complex visual reasoning',
  'model.glm-4.6v.detail':
    'Vision reasoning — native tool calls, long context, frontend reproduction',
  'model.glm-ocr.detail': 'Lightweight OCR — SOTA accuracy, supports complex documents',
  'model.glm-4.1v-thinking-flashx.detail':
    'Lightweight visual reasoning — multi-step analysis, high concurrency',
  'model.glm-4.6v-flash.detail': 'Free vision model — tool calls and toggleable thinking mode',
  'model.glm-4.1v-thinking-flash.detail':
    'Free visual reasoning — complex scenes, multi-step analysis',
  'model.glm-4v-flash.detail': 'Free model — image understanding, multilingual',

  'model.mimo-v2.5-pro.detail': 'Deep reasoning model with large context support',
  'model.mimo-v2.5.detail': 'Deep reasoning model with vision support',

  'model.doubao-seed-2.0-pro.detail':
    'Focused on long-chain reasoning and stability in complex task execution, designed for complex real-world business scenarios.',
  'model.doubao-seed-2.0-mini.detail':
    'Balances generation quality and response speed, making it a strong general-purpose production model.',
  'model.doubao-seed-2.0-lite.detail':
    'Balances generation quality and response speed, making it a strong general-purpose production model.',
  'model.doubao-seed-2.0-code.detail':
    'Precise code generation capabilities, along with task scheduling and logical coordination. (Multimodal visual understanding)',

  'model.dola-seed-2.0-pro.detail':
    'Focused on long-chain reasoning and stability in complex task execution, designed for complex real-world business scenarios.',
  'model.dola-seed-2.0-mini.detail':
    'Balances generation quality and response speed, making it a strong general-purpose production model.',
  'model.dola-seed-2.0-lite.detail':
    'Balances generation quality and response speed, making it a strong general-purpose production model.',
  'model.dola-seed-2.0-code.detail':
    'Precise code generation capabilities, along with task scheduling and logical coordination. (Multimodal visual understanding)',

  'auth.keyInput': 'Enter {0} API Key',
  'auth.keyInputHinted': 'Enter {0} API Key (format: {1})',
  'auth.keyHint': 'API Key...',
  'auth.keyRequired': 'API Key must not be blank',
  'auth.keyStored': '{0} API Key saved securely.',
  'auth.chooseProvider': 'Select a provider',
  'auth.noKey': 'No API key configured for {0}.',
  'auth.noKeyTooltip': 'No API key configured for {0}. Add one via the Language Models panel.',
  'auth.removeViaUI':
    'API keys are managed by VS Code. Open the Language Models panel and use the gear menu next to a provider group to remove its key.',
  'auth.seedFailed':
    'Could not save the {0} API key automatically. You can add it manually via the Language Models panel.',
  'auth.alreadyConfigured':
    '{0} is already configured. To update your API key or endpoint, use the gear menu in the Language Models panel.',
  'auth.chooseEndpoint': 'Select {0} API Endpoint',
  'action.openManageUI': 'Open Language Models',

  'think.label': 'Thinking Mode',
  'think.none': 'None',
  'think.none.hint': 'No reasoning steps; fastest output',
  'think.adaptive': 'Adaptive',
  'think.adaptive.hint': 'Model auto-adjusts reasoning depth',
  'think.high': 'High',
  'think.high.hint': 'Good for day-to-day coding tasks',
  'think.max': 'Max',
  'think.max.hint': 'Full reasoning depth for hard problems',
  'think.keep': 'Keep',
  'think.keep.hint': 'Preserve reasoning across multi-turn conversations',
  'think.enabled': 'Enabled',
  'think.enabled.hint': 'Standard thinking mode',
  'think.enabledKeep': 'Enabled with Keep',
  'think.enabledKeep.hint': 'Preserve reasoning across multi-turn conversations',
  'think.disabled': 'Disabled',
  'think.disabled.hint': 'No reasoning steps; fastest output',

  'vision.chooseProxy': 'Select image description model (default {0})',
  'vision.activeLabel': 'current',
  'vision.disableCmd': 'Disable Vision Proxy',
  'vision.offLabel': 'disabled',
  'vision.providerTag': 'Vendor: {0}',

  'err.http.401': 'Authentication failed (401).',
  'err.http.402': 'Insufficient balance (402).',
  'err.http.429': 'Too many requests (429). Please wait and retry.',
  'err.http.500': 'Internal server error (500).',
  'err.http.503': 'Service temporarily unavailable (503).',
  'err.network.dns': 'Cannot reach {0}. Check network and API endpoint.',
  'err.network.aborted': 'Request cancelled.',
  'err.network.timeout': 'Request timed out. Please retry.',
  'err.action.keys': 'Open API Keys',
  'err.action.usage': 'View Usage',
  'err.action.status': 'View Status',
  'err.action.logs': 'View Logs',

  'err.unknownModel': 'Unknown model: {0}.',

  'tools.drift': 'The following tools were removed to keep the conversation on track: {0}.',
};

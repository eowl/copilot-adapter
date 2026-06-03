import type { Translation } from './types';

export const en: Translation = {
  'provider.deepseek.detail': 'General-purpose & deep reasoning — {0} models',
  'provider.minimax.detail': 'Deep reasoning with long context support — {0} models',

  'model.deepseek-v4-flash.detail': 'Fast, general-purpose model',
  'model.deepseek-v4-pro.detail': 'Deep reasoning model',
  'model.minimax-m2.detail': 'Deep reasoning model',
  'model.minimax-m2.1.detail': 'Deep reasoning model',
  'model.minimax-m2.1-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m2.5.detail': 'Deep reasoning model',
  'model.minimax-m2.5-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m2.7.detail': 'Deep reasoning model',
  'model.minimax-m2.7-highspeed.detail': 'Deep reasoning, high-speed',
  'model.minimax-m3.detail': 'Deep reasoning with vision support',

  'auth.keyInput': 'Enter {0} API Key',
  'auth.keyInputHinted': 'Enter {0} API Key (format: {1})',
  'auth.keyHint': 'sk-...',
  'auth.keyRequired': 'API Key must not be blank',
  'auth.keyStored': '{0} API Key saved securely.',
  'auth.chooseProvider': 'Select a provider',
  'auth.noKey': 'No API key configured for {0}.',
  'auth.noKeyTooltip': 'No API key configured for {0}. Add one via the Language Models panel.',
  'auth.removeViaUI':
    'API keys are managed by VS Code. Open the Language Models panel and use the gear menu next to a provider group to remove its key.',
  'auth.seedFailed':
    'Could not save the {0} API key automatically. You can add it manually via the Language Models panel.',
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

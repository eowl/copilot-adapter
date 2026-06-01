import vscode from 'vscode';
import { t } from './nls';
import { channel } from './logger';
import { EXT_ID } from './defines';

const SECRET_KEY_PREFIX = `${EXT_ID}.`;
const SECRET_KEY_SUFFIX = '.apiKey';
const SETTINGS_API_KEY_PATH = 'providers';

function secretKey(providerId: string): string {
  return `${SECRET_KEY_PREFIX}${providerId}${SECRET_KEY_SUFFIX}`;
}

/**
 * Manages per-provider API keys backed by VS Code SecretStorage,
 * with a fallback to workspace/user settings for migration compatibility.
 */
export class KeyStore {
  constructor(private readonly ctx: vscode.ExtensionContext) {}

  async get(providerId: string): Promise<string | undefined> {
    const stored = await this.ctx.secrets.get(secretKey(providerId));
    if (stored) return stored;

    // Fallback: settings (read-only — user may have set it before SecretStorage was used)
    const section = vscode.workspace.getConfiguration(EXT_ID);
    const providers = section.get<Record<string, { apiKey?: string }>>(SETTINGS_API_KEY_PATH) ?? {};
    return providers[providerId]?.apiKey?.trim() || undefined;
  }

  async set(providerId: string, key: string): Promise<void> {
    await this.ctx.secrets.store(secretKey(providerId), key);
  }

  async remove(providerId: string): Promise<void> {
    await this.ctx.secrets.delete(secretKey(providerId));
  }

  async has(providerId: string): Promise<boolean> {
    return (await this.get(providerId)) !== undefined;
  }

  /** Prompt user for API key and save it. Returns true if key was saved. */
  async prompt(providerId: string, providerLabel: string, hint?: string): Promise<boolean> {
    const title = hint
      ? t('auth.keyInputHinted', providerLabel, hint)
      : t('auth.keyInput', providerLabel);
    const placeholder = hint ?? t('auth.keyHint');
    const input = await vscode.window.showInputBox({
      title,
      placeHolder: placeholder,
      password: true,
      ignoreFocusOut: true,
      validateInput: (v) => (v.trim() ? undefined : t('auth.keyRequired')),
    });
    if (!input?.trim()) return false;
    await this.set(providerId, input.trim());
    channel.info(`${providerLabel} API Key saved.`);
    vscode.window.showInformationMessage(t('auth.keyStored', providerLabel));

    return true;
  }
}

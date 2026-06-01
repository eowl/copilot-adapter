import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { t } from '../nls';
import { ALL_PROVIDERS, modelById } from '../providers';
import { KeyStore } from '../secrets';
import { Settings } from '../settings';
import { buildChatInfo, type ChatInfo, type ReqOptions } from './information';
import { Session } from './session';
import { VisionModelPicker } from '../vision/model';
import { assembleChatReq } from './prepare';
import { forwardStream } from './stream';
import { estimateTokens } from './tally';
import { ApiError } from '../client/error';
import { dumpRequest } from '../trace/dump';
import { tagRequest } from '../trace/tag';

type PrepareOptions = vscode.PrepareLanguageModelChatModelOptions;

/** Extended options VS Code passes for provider-group calls (not in stable typings). */
type GroupOptions = PrepareOptions & {
  readonly group?: string;
  readonly configuration?: Record<string, unknown>;
};

type Progress = vscode.Progress<vscode.LanguageModelResponsePart>;

/**
 * Central provider that implements vscode.LanguageModelChatProvider.
 * Registered with vscode.lm.registerChatModelProvider.
 */
export class Adapter implements vscode.LanguageModelChatProvider {
  private readonly keys: KeyStore;
  private readonly picker: VisionModelPicker;
  private readonly storageUri: vscode.Uri;

  private groupApiKey: string | undefined;
  private visionProxyAvailable = true;

  readonly onDidChangeLanguageModelChatInformation: vscode.Event<void>;
  private readonly changeEmitter = new vscode.EventEmitter<void>();

  notifyChange(): void {
    this.changeEmitter.fire();
  }

  constructor(
    context: vscode.ExtensionContext,
    readonly filteredProviderId: string,
    private readonly onKeyChange?: () => void,
  ) {
    this.keys = new KeyStore(context);
    this.picker = new VisionModelPicker();
    this.storageUri = context.globalStorageUri;
    this.onDidChangeLanguageModelChatInformation = this.changeEmitter.event;

    // Notify VS Code when API keys or settings change
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(EXT_ID)) {
          this.picker.reset();
          this.changeEmitter.fire();
          void this.refreshVisionProxy();
        }
      }),
    );

    context.subscriptions.push(
      vscode.lm.onDidChangeChatModels(() => {
        void this.refreshVisionProxy();
      }),
    );
  }

  /**
   * Probe vision proxy availability and notify VS Code if the result changed.
   * Safe to call from any context except inside provideLanguageModelChatInformation
   * (would cause re-entrant selectChatModels() calls).
   */
  async refreshVisionProxy(): Promise<void> {
    const model = await this.picker.resolve();
    const available = model !== undefined;
    if (available !== this.visionProxyAvailable) {
      this.visionProxyAvailable = available;
      this.changeEmitter.fire();
    }
  }

  async provideLanguageModelChatInformation(
    _options: PrepareOptions,
    _token: vscode.CancellationToken,
  ): Promise<ChatInfo[]> {
    const provider = ALL_PROVIDERS.find((p) => p.id === this.filteredProviderId);
    if (!provider || !Settings.providerEnabled(this.filteredProviderId)) return [];

    const opts = _options as GroupOptions;
    const groupCfg = opts.configuration;

    if (groupCfg !== undefined) {
      const apiKey = typeof groupCfg['apiKey'] === 'string' ? (groupCfg['apiKey'] as string) : '';
      this.groupApiKey = apiKey.length > 0 ? apiKey : undefined;
      const hasKey = this.groupApiKey !== undefined;
      return provider.models.map(
        (model) => buildChatInfo(model, provider, hasKey, this.visionProxyAvailable) as ChatInfo,
      );
    }

    const hasKey = await this.keys.has(this.filteredProviderId);
    if (!hasKey) return [];
    return provider.models.map(
      (model) => buildChatInfo(model, provider, true, this.visionProxyAvailable) as ChatInfo,
    );
  }

  async provideLanguageModelChatResponse(
    modelInfo: vscode.LanguageModelChatInformation,
    messages: vscode.LanguageModelChatRequestMessage[],
    options: ReqOptions,
    progress: Progress,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const entry = modelById.get(modelInfo.id);
    if (!entry) {
      throw new Error(t('err.unknownModel', modelInfo.id));
    }
    const { provider, model } = entry;

    const apiKey = this.groupApiKey ?? (await this.keys.get(provider.id));
    const usingGroupKey = this.groupApiKey !== undefined;
    if (!apiKey) {
      await this.keys.prompt(provider.id, provider.label);
      throw new Error(t('auth.noKey', provider.label));
    }

    const endpoint = Settings.baseUrl(provider.defaultEndpoint, provider.id);
    const session = Session.fromMessages(messages);

    channel.info(
      `Sending: ${provider.label} / ${model.label} (session: ${session.id} [${session.source}])`,
    );
    if (Settings.metaEnabled()) {
      channel.info(`Model: id=${model.id} | apiId=${model.apiId}`);
      channel.info(
        `Endpoint: ${endpoint} | Key: ${apiKey.slice(0, 6)}... (${apiKey.length} chars)`,
      );
    }

    try {
      const ready = await assembleChatReq({
        messages,
        options,
        provider,
        model,
        apiKey,
        token,
        picker: this.picker,
        endpoint,
      });

      if (ready.gate.kind === 'reject') {
        throw new Error(ready.gate.reason);
      }

      void dumpRequest(
        this.storageUri,
        session.id,
        ready.body,
        tagRequest(messages, options.tools),
        ready.apiKey,
      );

      await forwardStream(ready, progress, token, session.id);
    } catch (err) {
      if (err instanceof ApiError) {
        channel.error(err.summary, err.diagnostic);

        if (err.diagnostic.startsWith('HTTP 401') && !usingGroupKey) {
          void this.keys.prompt(provider.id, provider.label);
        }
        throw new Error(err.summary);
      }
      throw err;
    }
  }

  async provideTokenCount(
    modelInfo: ChatInfo,
    content: string | vscode.LanguageModelChatRequestMessage,
    _token: vscode.CancellationToken,
  ): Promise<number> {
    const entry = modelById.get(modelInfo.id);
    const charsPerToken = entry
      ? (Settings.providerTokenRatio(entry.provider.id) ?? entry.provider.tokenRatio ?? 4.0)
      : 4.0;
    return estimateTokens(content, charsPerToken);
  }

  async configureApiKey(providerId?: string): Promise<void> {
    if (providerId) {
      const entry = ALL_PROVIDERS.find((p) => p.id === providerId);
      if (entry) {
        await this.keys.prompt(entry.id, entry.label, entry.apiKeyHint);
        this.changeEmitter.fire();
        this.onKeyChange?.();
      }
      return;
    }

    const items = ALL_PROVIDERS.map((p) => ({
      label: p.label,
      description: p.id,
      detail: t(p.detailKey, String(p.models.length)),
    }));
    const picked = await vscode.window.showQuickPick(items, {
      title: t('auth.chooseProvider'),
      ignoreFocusOut: true,
    });
    if (!picked) return;
    const provider = ALL_PROVIDERS.find((p) => p.id === picked.description);
    if (provider) {
      await this.keys.prompt(provider.id, provider.label, provider.apiKeyHint);
      this.changeEmitter.fire();
      this.onKeyChange?.();
    }
  }

  async removeApiKey(providerId?: string): Promise<void> {
    if (providerId) {
      await this.keys.remove(providerId);
      this.changeEmitter.fire();
      this.onKeyChange?.();
      return;
    }

    const configured: Array<{ label: string; description: string; detail: string }> = [];
    for (const p of ALL_PROVIDERS) {
      if (await this.keys.has(p.id)) {
        configured.push({
          label: p.label,
          description: p.id,
          detail: t(p.detailKey, String(p.models.length)),
        });
      }
    }

    if (configured.length === 0) {
      void vscode.window.showInformationMessage(t('auth.noKeysFound'));
      return;
    }

    const picked = await vscode.window.showQuickPick(configured, {
      title: t('auth.chooseClearTarget'),
      ignoreFocusOut: true,
    });
    if (!picked) return;
    await this.keys.remove(picked.description!);
    this.changeEmitter.fire();
    this.onKeyChange?.();
  }

  async setVisionProxyModel(): Promise<void> {
    await VisionModelPicker.pick();
  }

  notifySettingsChange(): void {
    this.changeEmitter.fire();
  }
}

import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { t } from '../nls';
import { ALL_MODELS, ALL_PROVIDERS, modelById } from '../providers';
import { Settings } from '../settings';
import { buildChatInfo, type ChatInfo, type ReqOptions } from './information';
import { Session } from './session';
import { VisionModelPicker } from '../vision/model';
import { assembleChatReq } from './prepare';
import { forwardStream } from './stream';
import { estimateTokens } from './tally';
import { ApiError } from '../client/error';
import { seedManagedGroup } from './managed';
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
    this.picker = new VisionModelPicker();
    this.storageUri = context.globalStorageUri;
    this.onDidChangeLanguageModelChatInformation = this.changeEmitter.event;

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
    const providerModels = ALL_MODELS.filter((m) => m.provider.id === this.filteredProviderId);
    if (providerModels.length === 0) return [];

    const opts = _options as GroupOptions;
    const groupCfg = opts.configuration;

    if (groupCfg === undefined) {
      this.groupApiKey = undefined;

      return [];
    }

    const apiKey = typeof groupCfg['apiKey'] === 'string' ? (groupCfg['apiKey'] as string) : '';
    this.groupApiKey = apiKey.length > 0 ? apiKey : undefined;
    const hasKey = this.groupApiKey !== undefined;

    return providerModels.map(
      (model) => buildChatInfo(model, hasKey, this.visionProxyAvailable) as ChatInfo,
    );
  }

  async provideLanguageModelChatResponse(
    modelInfo: vscode.LanguageModelChatInformation,
    messages: vscode.LanguageModelChatRequestMessage[],
    options: ReqOptions,
    progress: Progress,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const model = modelById.get(modelInfo.id);
    if (!model) {
      throw new Error(t('err.unknownModel', modelInfo.id));
    }
    const { provider } = model;

    const apiKey = this.groupApiKey;
    if (!apiKey) {
      throw new Error(t('auth.noKey', provider.label));
    }

    const endpoint = provider.endpoint;
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
    const charsPerToken = entry ? (entry.provider.tokenRatio ?? 4.0) : 4.0;

    return estimateTokens(content, charsPerToken);
  }

  async configureApiKey(providerId?: string): Promise<void> {
    let provider = providerId ? ALL_PROVIDERS.find((p) => p.id === providerId) : undefined;

    if (!provider) {
      const items = ALL_PROVIDERS.map((p) => ({
        label: p.label,
        description: p.id,
        detail: t(p.detailKey, String(ALL_MODELS.filter((m) => m.provider.id === p.id).length)),
      }));

      const picked = await vscode.window.showQuickPick(items, {
        title: t('auth.chooseProvider'),
        ignoreFocusOut: true,
      });

      if (!picked) return;
      provider = ALL_PROVIDERS.find((p) => p.id === picked.description);
    }
    if (!provider) return;

    const hint = provider.apiKeyHint;
    const title = hint
      ? t('auth.keyInputHinted', provider.label, hint)
      : t('auth.keyInput', provider.label);
    const placeHolder = hint ?? t('auth.keyHint');
    const input = await vscode.window.showInputBox({
      title,
      placeHolder,
      password: true,
      ignoreFocusOut: true,
      validateInput: (v) => (v.trim() ? undefined : t('auth.keyRequired')),
    });
    const apiKey = input?.trim();
    if (!apiKey) return;

    const ok = await seedManagedGroup(provider, apiKey);
    if (ok) {
      channel.info(`${provider.label} API Key saved.`);
      void vscode.window.showInformationMessage(t('auth.keyStored', provider.label));
      this.changeEmitter.fire();
      this.onKeyChange?.();

      return;
    }

    const open = t('action.openManageUI');
    const choice = await vscode.window.showErrorMessage(t('auth.seedFailed', provider.label), open);

    if (choice === open) {
      void vscode.commands.executeCommand('workbench.action.chat.manage');
    }
  }

  async removeApiKey(_providerId?: string): Promise<void> {
    const open = t('action.openManageUI');
    const choice = await vscode.window.showInformationMessage(t('auth.removeViaUI'), open);

    if (choice === open) {
      void vscode.commands.executeCommand('workbench.action.chat.manage');
    }
  }

  async setVisionProxyModel(): Promise<void> {
    await VisionModelPicker.pick();
  }

  notifySettingsChange(): void {
    this.changeEmitter.fire();
  }
}

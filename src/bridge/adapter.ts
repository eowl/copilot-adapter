import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { t } from '../nls';
import { ALL_MODELS, ALL_PROVIDERS, modelById } from '../providers';
import { resolveTrait, getEndpoint, resolveEndpoint } from '../providers/utils';
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

type GroupSecrets = { apiKey: string; apiEndpoint?: string; prefix: string; label: string };

const GROUP_SEP = '::';

/**
 * Central provider that implements vscode.LanguageModelChatProvider.
 * Registered with vscode.lm.registerChatModelProvider.
 */
export class Adapter implements vscode.LanguageModelChatProvider {
  private readonly picker: VisionModelPicker;
  private readonly storageUri: vscode.Uri;
  private readonly groupSecrets = new Map<string, GroupSecrets>();
  private readonly prefixToKey = new Map<string, string>();

  private nextPrefix = 0;
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
    const modelProvider = providerModels[0]?.provider;

    if (groupCfg === undefined) {
      return [];
    }

    const apiKey = typeof groupCfg['apiKey'] === 'string' ? (groupCfg['apiKey'] as string) : '';
    const apiEndpoint =
      typeof groupCfg['apiEndpoint'] === 'string' ? (groupCfg['apiEndpoint'] as string) : '';
    const hasKey = apiKey.length > 0;

    if (!hasKey) {
      return [];
    }

    // Retrieve prefix for this apiKey (pre-registered by configureApiKey or a previous call)
    let secrets = this.groupSecrets.get(apiKey);
    if (!secrets) {
      const prefix = this.nextPrefix === 0 ? '' : String(this.nextPrefix);
      secrets = {
        apiKey,
        apiEndpoint: apiEndpoint.length > 0 ? apiEndpoint : undefined,
        prefix,
        label: opts.group ?? modelProvider.label,
      };
      this.groupSecrets.set(apiKey, secrets);
      if (prefix) {
        this.prefixToKey.set(prefix, apiKey);
      }
      this.nextPrefix++;
    } else {
      secrets.apiEndpoint = apiEndpoint.length > 0 ? apiEndpoint : undefined;
    }

    const activeEndpoint = apiEndpoint ? resolveEndpoint(modelProvider, apiEndpoint) : undefined;
    const visibleModels =
      activeEndpoint?.models!.filter((m) => m.provider.id === this.filteredProviderId) ??
      providerModels;

    const idPrefix = secrets.prefix;

    const result = visibleModels.map(
      (model) => buildChatInfo(model, hasKey, this.visionProxyAvailable, idPrefix) as ChatInfo,
    );
    channel.debug(
      `provideLanguageModelChatInformation: apiKey=${apiKey.slice(0, 6)}... prefix="${idPrefix}" models=[${result.map((m) => m.id).join(', ')}]`,
    );

    return result;
  }

  async provideLanguageModelChatResponse(
    modelInfo: vscode.LanguageModelChatInformation,
    messages: vscode.LanguageModelChatRequestMessage[],
    options: ReqOptions,
    progress: Progress,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const { modelId, prefix } = this.resolveModelIdentity(modelInfo.id);
    const model = modelById.get(modelId);
    if (!model) {
      throw new Error(t('err.unknownModel', modelInfo.id));
    }
    const { provider: modelProvider } = model;

    const apiKey = prefix ? this.prefixToKey.get(prefix) : this.findDefaultKey();
    const secrets = apiKey ? this.groupSecrets.get(apiKey) : undefined;
    const resolvedKey = secrets?.apiKey;
    if (!resolvedKey) {
      throw new Error(t('auth.noKey', modelProvider.label));
    }

    channel.info(
      `Sending: ${modelProvider.label} / ${model.label} (prefix: ${prefix || '(default)'})`,
    );
    if (Settings.metaEnabled()) {
      channel.info(`Model: id=${model.id} | apiId=${model.apiId}`);
      channel.info(
        `Endpoint: ${getEndpoint(modelProvider, secrets.apiEndpoint)} | Key: ${resolvedKey.slice(0, 6)}...`,
      );
    }

    const apiUrl = getEndpoint(modelProvider, secrets.apiEndpoint);
    const session = Session.fromMessages(messages);
    try {
      const ready = await assembleChatReq({
        messages,
        options,
        model,
        apiKey: resolvedKey,
        token,
        picker: this.picker,
        url: apiUrl,
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
    const { modelId } = this.resolveModelIdentity(modelInfo.id);
    const entry = modelById.get(modelId);
    const charsPerToken = entry ? (resolveTrait(entry, 'tokenRatio') ?? 4.0) : 4.0;

    return estimateTokens(content, charsPerToken);
  }

  private resolveModelIdentity(id: string): { modelId: string; prefix: string } {
    const sepIdx = id.indexOf(GROUP_SEP);
    if (sepIdx === -1) {
      return { modelId: id, prefix: '' };
    }

    return {
      prefix: id.slice(0, sepIdx),
      modelId: id.slice(sepIdx + GROUP_SEP.length),
    };
  }

  private findDefaultKey(): string | undefined {
    for (const [k, v] of this.groupSecrets) {
      if (!v.prefix) return k;
    }

    return undefined;
  }

  async configureApiKey(providerId?: string): Promise<void> {
    let modelProvider = providerId ? ALL_PROVIDERS.find((p) => p.id === providerId) : undefined;

    if (!modelProvider) {
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
      modelProvider = ALL_PROVIDERS.find((p) => p.id === picked.description);
    }
    if (!modelProvider) return;

    let apiEndpoint: string | undefined;
    const endpoints = modelProvider.endpoints;
    if (endpoints && endpoints.length > 1) {
      const epItems = endpoints.map((ep) => ({
        label: ep.label,
        description: ep.key,
        detail: ep.url,
      }));
      const epPicked = await vscode.window.showQuickPick(epItems, {
        title: t('auth.chooseEndpoint', modelProvider.label),
        ignoreFocusOut: true,
      });
      if (!epPicked) return;
      apiEndpoint = epPicked.description;
    }

    const hint = modelProvider.apiKeyHint;
    const title = hint
      ? t('auth.keyInputHinted', modelProvider.label, hint)
      : t('auth.keyInput', modelProvider.label);
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

    let groupName = modelProvider.label;
    let ok = await seedManagedGroup(modelProvider, apiKey, apiEndpoint, groupName);
    for (let suffix = 2; !ok && suffix <= 9; suffix++) {
      groupName = `${modelProvider.label} ${suffix}`;
      ok = await seedManagedGroup(modelProvider, apiKey, apiEndpoint, groupName);
    }
    if (ok) {
      // Pre-register this apiKey so provideLanguageModelChatInformation can assign a prefix
      if (!this.groupSecrets.has(apiKey)) {
        const prefix = this.nextPrefix === 0 ? '' : String(this.nextPrefix);
        this.groupSecrets.set(apiKey, {
          apiKey,
          apiEndpoint,
          prefix,
          label: groupName,
        });
        if (prefix) {
          this.prefixToKey.set(prefix, apiKey);
        }
        this.nextPrefix++;
      }
      channel.info(`${groupName} API Key saved.`);
      void vscode.window.showInformationMessage(t('auth.keyStored', groupName));
      this.changeEmitter.fire();
      this.onKeyChange?.();

      return;
    }

    const open = t('action.openManageUI');
    const choice = await vscode.window.showErrorMessage(
      t('auth.alreadyConfigured', modelProvider.label),
      open,
    );

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

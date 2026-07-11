import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { t } from '../nls';
import * as registry from '../registry';
import { resolveTrait, getEndpoint, resolveEndpoint } from '../providers/utils';
import { Settings } from '../settings';
import { buildChatInfo, type ChatInfo, type ReqOptions } from './information';
import { Session } from './session';
import { VisionModelPicker } from '../vision/model';
import { assembleChatReq } from './prepare';
import { forwardStream } from './stream';
import {
  estimateTokens,
  getCalibratedRatio,
  calibrateRatio,
  countMessageChars,
  DEFAULT_CHARS_PER_TOKEN,
} from './tally';
import { ApiError } from '../client/error';
import { seedManagedGroup } from './managed';
import { CUSTOM, buildCustomModels } from '../providers/custom';
import { getCachedBalance, queryBalance } from './balance';
import type { ModelItem, ModelProvider, PricingCurrency } from '../providers/types';

type PrepareOptions = vscode.PrepareLanguageModelChatModelOptions;

/** Extended options VS Code passes for provider-group calls (not in stable typings). */
type GroupOptions = PrepareOptions & {
  readonly group?: string;
  readonly configuration?: Record<string, unknown>;
};

type Progress = vscode.Progress<vscode.LanguageModelResponsePart>;

type GroupSecrets = { apiKey: string; apiEndpoint?: string; prefix: string; label: string };

const GROUP_SEP = '::';

function logVerboseMessages(
  messages: vscode.LanguageModelChatRequestMessage[],
  tools: readonly vscode.LanguageModelChatTool[] | undefined,
): void {
  try {
    const roleLabel: Record<number, string> = {
      [vscode.LanguageModelChatMessageRole.User]: 'user',
      [vscode.LanguageModelChatMessageRole.Assistant]: 'assistant',
    };
    const msgSummary = messages
      .map((m) => {
        const role =
          roleLabel[m.role] ?? vscode.LanguageModelChatMessageRole[m.role] ?? `role${m.role}`;
        const parts = Array.isArray(m.content) ? m.content : [m.content];
        const kinds = [
          ...new Set(
            parts.map((p: unknown) =>
              p !== null && typeof p === 'object' && 'kind' in p
                ? (p as { kind: string }).kind
                : 'text',
            ),
          ),
        ];
        const label = kinds.length > 0 ? `${role}:${kinds.join('+')}` : role;
        const contentLen = JSON.stringify(m.content).length;

        return `${label}(${contentLen})`;
      })
      .join(' ');
    channel.info(`Messages (${messages.length}): ${msgSummary}`);

    if (tools && tools.length > 0) {
      const toolNames = tools.map((t) => t.name).join(', ');
      channel.info(`Tools (${tools.length}): ${toolNames}`);
    }
  } catch {
    // verbose logging must never throw into caller
  }
}

function logRequestBody(body: Record<string, unknown>): void {
  try {
    const lines: string[] = ['Request body:'];
    for (const [key, value] of Object.entries(body)) {
      if (key === 'messages') {
        const msgs = value as Array<{ role: string; content: unknown }>;
        lines.push(`  ${key}: [${msgs.length} messages]`);
        for (let i = 0; i < msgs.length; i++) {
          const m = msgs[i];
          const contentLen = JSON.stringify(m.content).length;
          lines.push(`    [${i}] role=${m.role} content(${contentLen})`);
        }
      } else if (key === 'tools') {
        const tools = value as Array<{ function: { name: string } }> | undefined;
        const names = tools?.map((t) => t.function.name).join(', ') ?? '(none)';
        lines.push(`  ${key}: [${names}]`);
      } else {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }
    channel.info(lines.join('\n'));
  } catch {
    // must never throw
  }
}

/**
 * Central provider that implements vscode.LanguageModelChatProvider.
 * Registered with vscode.lm.registerChatModelProvider.
 */
export class Adapter implements vscode.LanguageModelChatProvider {
  private readonly picker: VisionModelPicker;
  private readonly groupSecrets = new Map<string, GroupSecrets>();
  private readonly prefixToKey = new Map<string, string>();
  /** Dynamically built models from custom provider's models[] config, keyed by modelKey. */
  private readonly dynamicModels = new Map<string, ModelItem>();

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
    const opts = _options as GroupOptions;
    const groupCfg = opts.configuration;

    if (groupCfg === undefined) {
      return [];
    }

    const apiKey = typeof groupCfg['apiKey'] === 'string' ? (groupCfg['apiKey'] as string) : '';
    const hasKey = apiKey.length > 0;

    if (!hasKey) {
      return [];
    }

    // Collect visible models. For the custom provider, models come from the
    // `models[]` array in the configuration; for other providers they come from
    // the static registry.
    let visibleModels: ModelItem[];
    let modelProvider: ModelProvider;
    let providerModels: ModelItem[] = [];
    let resolvedEndpoint: ModelItem['endpoint'];
    let resolvedPricingCurrency: PricingCurrency | undefined = Settings.pricingCurrency();

    if (this.filteredProviderId === 'custom') {
      modelProvider = CUSTOM;
      const rawModels = groupCfg['models'];
      if (!Array.isArray(rawModels) || rawModels.length === 0) {
        return [];
      }
      visibleModels = buildCustomModels(rawModels as Parameters<typeof buildCustomModels>[0]);
      this.dynamicModels.clear();
      for (const m of visibleModels) {
        this.dynamicModels.set(registry.modelKey(m), m);
      }
    } else {
      providerModels = registry.ALL_MODELS.filter((m) => m.provider.id === this.filteredProviderId);
      if (providerModels.length === 0) return [];
      modelProvider = providerModels[0]?.provider;

      const apiEndpoint =
        typeof groupCfg['apiEndpoint'] === 'string' ? (groupCfg['apiEndpoint'] as string) : '';
      const effectiveEndpoint =
        this.groupSecrets.get(apiKey)?.apiEndpoint ?? (apiEndpoint || undefined);
      resolvedEndpoint = effectiveEndpoint
        ? resolveEndpoint(modelProvider, effectiveEndpoint)
        : undefined;
      const activeEndpointId = resolvedEndpoint?.id ?? modelProvider.endpoints?.[0]?.id;
      visibleModels = activeEndpointId
        ? providerModels.filter((m) => m.endpoint?.id === activeEndpointId)
        : providerModels;

      resolvedPricingCurrency =
        resolvedEndpoint?.billing === 'plan'
          ? undefined
          : (resolvedEndpoint?.pricingCurrency ?? Settings.pricingCurrency());
    }

    // Retrieve prefix for this apiKey (pre-registered by configureApiKey or a previous call)
    let secrets = this.groupSecrets.get(apiKey);
    if (!secrets) {
      const prefix = this.nextPrefix === 0 ? '' : String(this.nextPrefix);
      secrets = {
        apiKey,
        apiEndpoint:
          typeof groupCfg['apiEndpoint'] === 'string'
            ? (groupCfg['apiEndpoint'] as string)
            : undefined,
        prefix,
        label: opts.group ?? modelProvider.label,
      };
      this.groupSecrets.set(apiKey, secrets);
      if (prefix) {
        this.prefixToKey.set(prefix, apiKey);
      }
      this.nextPrefix++;
    }

    const idPrefix = secrets.prefix;

    // Resolve the active endpoint for balance query
    const activeEndpoint = resolvedEndpoint ?? modelProvider.endpoints?.[0];
    const endpointId = activeEndpoint?.id ?? '';
    const balanceLinks = activeEndpoint?.links;

    // Use cached balance if fresh; otherwise fire async query
    let balance: string | undefined;
    let balanceCurrency: string | undefined;
    if (hasKey && endpointId) {
      const cached = getCachedBalance(apiKey, endpointId);
      if (cached) {
        balance = cached.display;
        balanceCurrency = cached.currency;
      } else if (balanceLinks?.balance) {
        // Fire query in background and refresh when complete
        queryBalance(apiKey, endpointId, balanceLinks)
          .then((result) => {
            if (result.display !== 'N/A') {
              this.changeEmitter.fire();
            }
          })
          .catch(() => {
            // already logged in queryBalance
          });
      }
    }

    return visibleModels.map(
      (model) =>
        buildChatInfo(
          model,
          hasKey,
          this.visionProxyAvailable,
          idPrefix,
          resolvedPricingCurrency,
          balance,
          balanceCurrency,
        ) as ChatInfo,
    );
  }

  async provideLanguageModelChatResponse(
    modelInfo: vscode.LanguageModelChatInformation,
    messages: vscode.LanguageModelChatRequestMessage[],
    options: ReqOptions,
    progress: Progress,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const { modelId, prefix } = this.resolveModelIdentity(modelInfo.id);
    const model = registry.modelById.get(modelId) ?? this.dynamicModels.get(modelId);

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
      channel.info(`Endpoint: ${getEndpoint(modelProvider, secrets.apiEndpoint)}`);
    }
    if (Settings.verboseEnabled()) {
      logVerboseMessages(messages, options.tools);
    }

    // For custom models, use the URL from the model item itself (set from config).
    // For built-in providers, resolve via getEndpoint.
    const apiUrl = resolveTrait(model, 'url') ?? getEndpoint(modelProvider, secrets.apiEndpoint);
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

      if (ready.gate.kind === 'warmup') {
        channel.info(
          `[Warmup] ${modelProvider.label} / ${model.label}: ` +
            `round ${ready.gate.round}/${ready.gate.totalRounds}, ` +
            `tool: ${ready.gate.toolName}`,
        );
      }

      if (Settings.metaEnabled()) {
        logRequestBody(ready.body);
      }

      const { promptTokens } = await forwardStream(ready, progress, token, session.id);

      // Calibrate chars-per-token ratio when API returns real usage.
      // Use message character count (same path as estimateTokens) so the calibrated
      // ratio reflects the actual message-text-to-token relationship. Using the
      // serialized JSON body would include structural overhead (model, stream, tools,
      // JSON keys) that inflates the character count and anchors the ratio near 4.0,
      // preventing calibration from ever triggering.
      if (promptTokens > 0) {
        try {
          const defaultRatio =
            resolveTrait(model, 'tokenRatio') ?? Settings.tokenRatio() ?? DEFAULT_CHARS_PER_TOKEN;
          const bodyChars = countMessageChars(messages);
          const prevRatio = getCalibratedRatio(modelProvider.id, defaultRatio);
          const result = calibrateRatio(modelProvider.id, bodyChars, promptTokens, defaultRatio);

          if (result.changed) {
            channel.info(
              `Chars-per-token ratio calibrated for ${modelProvider.id}: ` +
                `${prevRatio.toFixed(2)} to ${result.newRatio.toFixed(2)} ` +
                `(based on API usage: ${bodyChars} chars / ${promptTokens} tokens)`,
            );
          }
        } catch (err) {
          channel.error('Failed to calibrate ratio:', err);
        }
      }
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
    const entry = registry.modelById.get(modelId) ?? this.dynamicModels.get(modelId);
    const defaultRatio = entry
      ? (resolveTrait(entry, 'tokenRatio') ?? Settings.tokenRatio() ?? DEFAULT_CHARS_PER_TOKEN)
      : (Settings.tokenRatio() ?? DEFAULT_CHARS_PER_TOKEN);
    const charsPerToken = getCalibratedRatio(entry?.provider.id ?? '', defaultRatio);

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
    let modelProvider = providerId
      ? registry.ALL_PROVIDERS.find((p) => p.id === providerId)
      : undefined;

    if (!modelProvider) {
      const items = registry.ALL_PROVIDERS.filter((p) => p.id !== 'custom').map((p) => ({
        label: p.label,
        description: p.id,
        detail: t(p.detailKey),
      }));

      const picked = await vscode.window.showQuickPick(items, {
        title: t('auth.chooseProvider'),
        ignoreFocusOut: true,
      });

      if (!picked) return;
      modelProvider = registry.ALL_PROVIDERS.find((p) => p.id === picked.description);
    }
    if (!modelProvider) return;

    let apiEndpoint: string | undefined;
    const endpoints = modelProvider.endpoints;
    if (endpoints && endpoints.length > 1) {
      const epItems = endpoints.map((ep) => ({
        label: ep.label,
        description: ep.id,
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

import vscode from 'vscode';
import { t } from '../nls';
import type { Model } from '../providers/types';

/** Extended chat model information returned to VS Code. */
export interface ChatInfo extends vscode.LanguageModelChatInformation {
  statusIcon?: vscode.ThemeIcon;
  configurationSchema?: Record<string, unknown>;
}

/** Extended request options from VS Code's language model chat. */
export interface ReqOptions extends vscode.ProvideLanguageModelChatResponseOptions {
  modelConfiguration?: Record<string, unknown>;
  /** Legacy alias for modelConfiguration used by older VS Code versions. */
  configuration?: Record<string, unknown>;
}

export function buildChatInfo(model: Model, hasKey: boolean, hasVisionProxy = false): ChatInfo {
  const provider = model.provider;
  const schema = model.configSchema?.();
  const notConfigured = !hasKey;

  return {
    id: model.id,
    name: model.label,
    family: model.family,
    version: model.version,
    maxInputTokens: model.maxInputTokens,
    maxOutputTokens: model.maxOutputTokens,
    capabilities: {
      imageInput: model.ability.acceptsImages || hasVisionProxy,
      toolCalling: model.ability.maxTools ?? (model.ability.maxTools === undefined ? true : false),
    },
    tooltip: notConfigured ? t('auth.noKeyTooltip', provider.label) : undefined,
    detail: t(model.detailKey),
    statusIcon: notConfigured ? new vscode.ThemeIcon('warning') : undefined,
    configurationSchema: schema,
  } as unknown as ChatInfo;
}

export function resolveModelConfig(options: ReqOptions): Record<string, unknown> {
  return (options.modelConfiguration ?? options.configuration ?? {}) as Record<string, unknown>;
}

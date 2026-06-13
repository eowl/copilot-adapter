import vscode from 'vscode';
import { t } from '../nls';
import { modelKey } from '../providers/utils';
import { customModelKey } from '../registry';
import type { ModelItem } from '../providers/types';

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

export function buildChatInfo(
  modelItem: ModelItem,
  hasKey: boolean,
  hasVisionProxy = false,
  idPrefix = '',
): ChatInfo {
  const modelProvider = modelItem.provider;
  const schema = modelItem.configSchema?.();
  const notConfigured = !hasKey;
  const detail = t(modelItem.detailKey) || modelItem.detailKey;

  const qualifiedId =
    modelItem.source === 'custom' ? customModelKey(modelItem) : modelKey(modelItem);
  const infoId = idPrefix ? `${idPrefix}::${qualifiedId}` : qualifiedId;
  const info = {
    id: infoId,
    name: modelItem.label,
    family: modelItem.family,
    version: modelItem.version,
    maxInputTokens: modelItem.maxInputTokens,
    maxOutputTokens: modelItem.maxOutputTokens,
    capabilities: {
      imageInput: modelItem.imageInput || hasVisionProxy,
      toolCalling: modelItem.maxTools ?? (modelItem.maxTools === undefined ? true : false),
    },
    tooltip: notConfigured ? t('auth.noKeyTooltip', modelProvider.label) : detail,
    detail: detail,
    statusIcon: notConfigured ? new vscode.ThemeIcon('warning') : undefined,
    configurationSchema: schema,
  } as unknown as ChatInfo;

  return info;
}

export function resolveModelConfig(options: ReqOptions): Record<string, unknown> {
  return (options.modelConfiguration ?? options.configuration ?? {}) as Record<string, unknown>;
}

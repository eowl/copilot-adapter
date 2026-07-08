import vscode from 'vscode';
import { t } from '../nls';
import { modelKey } from '../providers/utils';
import type { ModelItem, ModelPricing, PriceCategory, PricingCurrency } from '../providers/types';

export interface ChatInfo extends vscode.LanguageModelChatInformation {
  readonly isBYOK: true;
  readonly isUserSelectable: boolean;
  statusIcon?: vscode.ThemeIcon;
  configurationSchema?: Record<string, unknown>;

  readonly inputCost?: number;
  readonly outputCost?: number;
  readonly cacheCost?: number;
  readonly cacheWriteCost?: number;
  readonly longContextInputCost?: number;
  readonly longContextOutputCost?: number;
  readonly longContextCacheCost?: number;
  readonly longContextCacheWriteCost?: number;
  readonly priceCategory?: PriceCategory;
  readonly category?: string;
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
  pricingCurrency?: PricingCurrency,
  balance?: string,
): ChatInfo {
  const modelProvider = modelItem.provider;
  const schema = modelItem.configSchema?.();
  const notConfigured = !hasKey;
  const detail = t(modelItem.detailKey) || modelItem.detailKey;

  const qualifiedId = modelKey(modelItem);
  const infoId = idPrefix ? `${idPrefix}::${qualifiedId}` : qualifiedId;
  const costInfo = toModelCostInfo(
    modelItem.pricing,
    modelItem.endpoint?.billing === 'plan' ? 'plan' : modelItem.priceCategory,
    pricingCurrency,
  );

  const info = {
    id: infoId,
    name: modelItem.label,
    family: modelItem.family,
    version: modelItem.version,
    maxInputTokens: modelItem.maxInputTokens,
    maxOutputTokens: modelItem.maxOutputTokens,
    isBYOK: true,
    isUserSelectable: true,
    capabilities: {
      imageInput: modelItem.imageInput || hasVisionProxy,
      toolCalling: modelItem.maxTools ?? (modelItem.maxTools === undefined ? true : false),
    },
    tooltip: notConfigured ? t('auth.noKeyTooltip', modelProvider.label) : detail,
    detail: detail,
    statusIcon: notConfigured ? new vscode.ThemeIcon('warning') : undefined,
    configurationSchema: schema,
    ...costInfo,
    ...(balance ? { category: t('balance.label', balance) } : {}),
  } as unknown as ChatInfo;

  return info;
}

function toModelCostInfo(
  pricing: Readonly<Partial<Record<PricingCurrency, ModelPricing>>> | undefined,
  priceCategory: PriceCategory | undefined,
  currency?: PricingCurrency,
): Pick<ChatInfo, 'inputCost' | 'outputCost' | 'cacheCost' | 'cacheWriteCost' | 'longContextInputCost' | 'longContextOutputCost' | 'longContextCacheCost' | 'longContextCacheWriteCost' | 'priceCategory'> {
  if (!currency || !pricing) {
    return priceCategory ? { priceCategory } : {};
  }

  let p = pricing[currency];
  if (!p) {
    const fallback = (Object.keys(pricing) as PricingCurrency[])[0];
    p = pricing[fallback];

    if (!p) return priceCategory ? { priceCategory } : {};
  }

  return {
    inputCost: p.default.input,
    outputCost: p.default.output,
    cacheCost: p.default.cacheInput,
    cacheWriteCost: p.default.cacheWrite,
    longContextInputCost: p.longContext?.input,
    longContextOutputCost: p.longContext?.output,
    longContextCacheCost: p.longContext?.cacheInput,
    longContextCacheWriteCost: p.longContext?.cacheWrite,
    ...(priceCategory ? { priceCategory } : {}),
  };
}

export function resolveModelConfig(options: ReqOptions): Record<string, unknown> {
  return (options.modelConfiguration ?? options.configuration ?? {}) as Record<string, unknown>;
}

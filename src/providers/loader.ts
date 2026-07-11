import * as fs from 'node:fs';
import * as path from 'node:path';
import { channel } from '../logger';
import { t } from '../nls';
import { ThinkTagParser } from './parsers/tag';
import type {
  ContentParser,
  ModelItem,
  ModelItemConfig,
  ModelProvider,
  ModelEndpoint,
  ThinkingConfig,
} from './types';

function buildRequestExtras(
  thinkingConfig: ThinkingConfig,
): (modelConfig: Record<string, unknown> | undefined) => Record<string, unknown> {
  const defaultOpt = thinkingConfig.options.find((o) => o.value === thinkingConfig.default);
  const defaultFields = defaultOpt?.requestFields ?? {};

  return (modelConfig) => {
    const selectedValue = modelConfig?.thinkingMode;
    if (typeof selectedValue !== 'string') return { ...defaultFields };
    const opt = thinkingConfig.options.find((o) => o.value === selectedValue);

    return { ...(opt?.requestFields ?? defaultFields) };
  };
}

function buildConfigSchema(thinkingConfig: ThinkingConfig): () => Record<string, unknown> {
  const enums = thinkingConfig.options.map((o) => o.value);
  const labels = thinkingConfig.options.map((o) => t(o.label) || o.label || o.value);
  const hints = thinkingConfig.options.map((o) => t(o.hint) || o.hint || '');

  const schema = {
    properties: {
      thinkingMode: {
        type: 'string',
        title: t('think.label'),
        enum: enums,
        enumItemLabels: labels,
        enumDescriptions: hints,
        default: thinkingConfig.default,
        group: 'navigation',
      },
    },
  } as const;

  return () => schema;
}

function buildContentParser(thinkingTag: string): () => ContentParser {
  return () => new ThinkTagParser(thinkingTag);
}

export function backfillModel(item: ModelItem): void {
  const jsonLike = item as ModelItemConfig;

  if (!item.requestExtras && jsonLike.thinkingConfig) {
    item.requestExtras = buildRequestExtras(jsonLike.thinkingConfig);
  }
  if (!item.configSchema && jsonLike.thinkingConfig) {
    item.configSchema = buildConfigSchema(jsonLike.thinkingConfig);
  }
  if (!item.createContentParser && jsonLike.thinkingTag) {
    item.createContentParser = buildContentParser(jsonLike.thinkingTag);
  }
}

export interface ModelJsonModule {
  readonly providerId: string;
  readonly endpointId: string;
  readonly thinkingConfig?: ThinkingConfig;
  readonly models: readonly ModelItemConfig[];
}

interface Registries {
  readonly providerById: ReadonlyMap<string, ModelProvider>;
  readonly endpointById: ReadonlyMap<string, ModelEndpoint>;
}

export function loadModelsFromJson(
  module: ModelJsonModule,
  reg: Registries,
  source: 'builtin' | 'custom' = 'builtin',
): ModelItem[] {
  const provider = reg.providerById.get(module.providerId);
  if (!provider) {
    throw new Error(`Unknown providerId "${module.providerId}"`);
  }
  const targetEndpoint = reg.endpointById.get(module.endpointId);
  if (!targetEndpoint) {
    throw new Error(`Unknown endpointId "${module.endpointId}"`);
  }
  const belongs = provider.endpoints?.some((ep) => ep.id === module.endpointId) ?? false;
  if (!belongs) {
    throw new Error(`Endpoint "${module.endpointId}" not under provider "${module.providerId}"`);
  }

  const topThinkingConfig = module.thinkingConfig;

  return module.models.map((raw) => {
    const effectiveThinkingConfig = raw.thinkingConfig ?? topThinkingConfig;
    if (effectiveThinkingConfig && !raw.thinkingConfig) {
      (raw as { thinkingConfig?: ThinkingConfig }).thinkingConfig = effectiveThinkingConfig;
    }

    const item: ModelItem = {
      id: raw.id ?? '',
      label: raw.label ?? '',
      apiId: raw.apiId ?? '',
      family: raw.family ?? 'custom',
      version: raw.version ?? '',
      maxInputTokens: raw.maxInputTokens ?? 128_000,
      maxOutputTokens: raw.maxOutputTokens ?? 32_000,
      detailKey: raw.detailKey ?? '',
      thinking: raw.thinking ?? false,
      imageInput: raw.imageInput ?? false,
      maxTools: raw.maxTools,
      imageField: raw.imageField,
      thinkingTag: raw.thinkingTag,
      thinkingConfig: raw.thinkingConfig,
      source,
      provider,
      endpoint: targetEndpoint,
    };

    backfillModel(item);

    return item;
  });
}

/**
 * Scan `modelsDir` for `*.json` files and load them all.
 * Invalid files are logged and skipped — they never block startup.
 */
export function loadAllJsonModels(modelsDir: string, reg: Registries): ModelItem[] {
  const result: ModelItem[] = [];

  let files: string[];
  try {
    files = fs.readdirSync(modelsDir);
  } catch {
    return result;
  }

  for (const name of files) {
    if (!name.endsWith('.json')) continue;

    const filePath = path.join(modelsDir, name);
    let module: ModelJsonModule;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      module = JSON.parse(raw) as ModelJsonModule;
    } catch (err) {
      channel.warn(`Failed to load JSON model file ${filePath}:`, err);
      continue;
    }

    try {
      result.push(...loadModelsFromJson(module, reg));
    } catch (err) {
      channel.warn(`Failed to parse JSON model file ${filePath}:`, err);
    }
  }

  return result;
}

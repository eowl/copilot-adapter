import * as fs from 'node:fs';
import { channel } from '../logger';
import { t } from '../nls';
import { loadModelsFromJson } from '../providers/loader';
import type { ModelItem, ThinkingConfig } from '../providers/types';
import type { ModelJsonModule } from '../providers/loader';
import type { ModelProvider, ModelEndpoint } from '../providers/types';

export interface ValidationError {
  message: string;
  line: number;
}

export interface CustomModelEntry {
  id: string;
  label: string;
  provider: string;
  endpoint: string | string[]; // Single endpoint specifier or array. Each can be an endpoint id, label, or (partial) URL.
  family?: string;
  version?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  detail?: string;
  thinking?: boolean;
  thinkingConfig?: ThinkingConfig;
  imageInput?: boolean;
  imageField?: string;
  maxTools?: number;
  contentTag?: string;
}

interface Registries {
  readonly providerById: ReadonlyMap<string, ModelProvider>;
  readonly endpointById: ReadonlyMap<string, ModelEndpoint>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function isArrayOfStrings(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.length > 0);
}

export function validateCustomModelEntry(raw: unknown, idx: number): string[] {
  const errors: string[] = [];
  const prefix = `[${idx}]`;

  if (!isRecord(raw)) {
    errors.push(`${prefix}: ${t('customModels.validation.notAnObject')}`);

    return errors;
  }

  const m = raw as Record<string, unknown>;

  if (!isNonEmptyString(m.id)) {
    errors.push(`${prefix}.id: ${t('customModels.validation.requiredString')}`);
  }
  if (!isNonEmptyString(m.label)) {
    errors.push(`${prefix}.label: ${t('customModels.validation.requiredString')}`);
  }
  if (!isNonEmptyString(m.provider)) {
    errors.push(`${prefix}.provider: ${t('customModels.validation.requiredString')}`);
  }

  const epRaw = m.endpoint;
  if (typeof epRaw === 'string') {
    if (!isNonEmptyString(epRaw)) {
      errors.push(`${prefix}.endpoint: ${t('customModels.validation.requiredString')}`);
    }
  } else if (!isArrayOfStrings(epRaw)) {
    if (Array.isArray(epRaw)) {
      errors.push(`${prefix}.endpoint: ${t('customModels.validation.nonEmptyStringArray')}`);
    } else {
      errors.push(`${prefix}.endpoint: ${t('customModels.validation.requiredStringOrArray')}`);
    }
  }

  if (m.maxInputTokens !== undefined && !isPositiveInt(m.maxInputTokens)) {
    errors.push(`${prefix}.maxInputTokens: ${t('customModels.validation.positiveInt')}`);
  }

  if (m.maxOutputTokens !== undefined && !isPositiveInt(m.maxOutputTokens)) {
    errors.push(`${prefix}.maxOutputTokens: ${t('customModels.validation.positiveInt')}`);
  }

  if (m.thinking !== undefined && typeof m.thinking !== 'boolean') {
    errors.push(`${prefix}.thinking: ${t('customModels.validation.boolean')}`);
  }

  if (m.imageInput !== undefined && typeof m.imageInput !== 'boolean') {
    errors.push(`${prefix}.imageInput: ${t('customModels.validation.boolean')}`);
  }

  if (m.maxTools !== undefined && !isPositiveInt(m.maxTools)) {
    errors.push(`${prefix}.maxTools: ${t('customModels.validation.positiveInt')}`);
  }

  if (m.thinkingConfig !== undefined) {
    errors.push(...validateThinkingConfig(m.thinkingConfig, `${prefix}.thinkingConfig`));
  }

  return errors;
}

function validateThinkingConfig(raw: unknown, prefix: string): string[] {
  const errs: string[] = [];

  if (!isRecord(raw)) {
    errs.push(`${prefix}: ${t('customModels.validation.notAnObject')}`);

    return errs;
  }

  const th = raw as Record<string, unknown>;

  if (!isNonEmptyString(th.default)) {
    errs.push(`${prefix}.default: ${t('customModels.validation.requiredString')}`);
  }
  if (!Array.isArray(th.options)) {
    errs.push(`${prefix}.options: ${t('customModels.validation.array')}`);

    return errs;
  }

  const options = th.options as unknown[];
  const defaultVal = th.default as string | undefined;
  let foundDefault = false;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!isRecord(opt)) {
      errs.push(`${prefix}.options[${i}]: ${t('customModels.validation.notAnObject')}`);
      continue;
    }
    if (!isNonEmptyString(opt.value)) {
      errs.push(`${prefix}.options[${i}].value: ${t('customModels.validation.requiredString')}`);
    }
    if (defaultVal !== undefined && opt.value === defaultVal) {
      foundDefault = true;
    }
  }

  if (defaultVal !== undefined && !foundDefault) {
    errs.push(
      `${prefix}.default: ${t('customModels.validation.thinkingDefaultMismatch')} "${defaultVal}"`,
    );
  }

  return errs;
}

export function validateCustomModelArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [t('customModels.validation.topLevelArray')];
  }

  const errors: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    errors.push(...validateCustomModelEntry(raw[i], i));
  }

  return errors;
}

export interface CustomModelsResult {
  models: ModelItem[];
  errors: ValidationError[];
}

/**
 * Parse a JSON string into an array, returning parse errors
 * with approximate line numbers.
 */
function parseJsonArray(text: string): { data: unknown[]; parseErrors: ValidationError[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err: unknown) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    const lineMatch = message.match(/line\s+(\d+)/i);
    const line = lineMatch ? Number(lineMatch[1]) : 0;

    return {
      data: [],
      parseErrors: [{ message: `${t('customModels.validation.jsonParse')}: ${message}`, line }],
    };
  }

  if (!Array.isArray(raw)) {
    return {
      data: [],
      parseErrors: [{ message: t('customModels.validation.topLevelArray'), line: 0 }],
    };
  }

  return { data: raw, parseErrors: [] };
}

const CUSTOM_LABEL_PREFIX = t('customModels.labelPrefix');

function resolveEndpointId(input: string, provider: ModelProvider): ModelEndpoint | undefined {
  if (!provider.endpoints) return undefined;

  // Exact id match
  let ep = provider.endpoints.find((e) => e.id === input);
  if (ep) return ep;

  // Exact label match
  ep = provider.endpoints.find((e) => e.label === input);
  if (ep) return ep;

  // Input contains endpoint URL (e.g. user types full /chat/completions URL)
  ep = provider.endpoints.find((e) => e.url && input.includes(e.url));
  if (ep) return ep;

  // Input contains matchStr (legacy)
  ep = provider.endpoints.find((e) => e.matchStr && input.includes(e.matchStr));

  return ep;
}

function groupEntries(reg: Registries, entries: CustomModelEntry[]): ModelJsonModule[] {
  const groups = new Map<
    string,
    { providerId: string; endpointId: string; models: Record<string, unknown>[] }
  >();

  for (const entry of entries) {
    const provider = reg.providerById.get(entry.provider);
    if (!provider) continue;

    const eps = typeof entry.endpoint === 'string' ? [entry.endpoint] : entry.endpoint;
    for (const spec of eps) {
      const ep = resolveEndpointId(spec, provider);
      if (!ep) continue;

      const key = `${entry.provider}\0${ep.id}`;
      let group = groups.get(key);
      if (!group) {
        group = { providerId: entry.provider, endpointId: ep.id, models: [] };
        groups.set(key, group);
      }

      group.models.push({
        id: entry.id,
        label: `${entry.label} ${CUSTOM_LABEL_PREFIX}`,
        apiId: entry.id,
        family: entry.family ?? 'custom',
        version: entry.version ?? '',
        maxInputTokens: entry.maxInputTokens ?? 128_000,
        maxOutputTokens: entry.maxOutputTokens ?? 32_000,
        detailKey: entry.detail || '',
        thinking: entry.thinking ?? false,
        imageInput: entry.imageInput ?? false,
        ...(entry.maxTools !== undefined ? { maxTools: entry.maxTools } : {}),
        ...(entry.imageField !== undefined ? { imageField: entry.imageField } : {}),
        ...(entry.thinkingConfig ? { thinkingConfig: entry.thinkingConfig } : {}),
        ...(entry.contentTag ? { contentTag: entry.contentTag } : {}),
      });
    }
  }

  return [...groups.values()].map((g) => ({
    providerId: g.providerId,
    endpointId: g.endpointId,
    models: g.models,
  })) as ModelJsonModule[];
}

export function loadCustomModels(filePath: string, reg: Registries): CustomModelsResult {
  if (!filePath) {
    return { models: [], errors: [] };
  }

  let text: string;
  try {
    text = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { models: [], errors: [] };
  }

  const { data, parseErrors } = parseJsonArray(text);
  if (parseErrors.length > 0) {
    return { models: [], errors: parseErrors };
  }

  // Structural validation (flat entries)
  const validationErrors = validateCustomModelArray(data);
  if (validationErrors.length > 0) {
    return {
      models: [],
      errors: validationErrors.map((msg) => ({ message: msg, line: 0 })),
    };
  }

  const entries = data as CustomModelEntry[];

  // Validate provider/endpoint references exist in registries
  const refErrors: ValidationError[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!reg.providerById.has(e.provider)) {
      refErrors.push({
        message: `[${i}].provider: ${t('customModels.validation.unknownProvider')} "${e.provider}"`,
        line: 0,
      });
    } else {
      const provider = reg.providerById.get(e.provider)!;
      const eps = typeof e.endpoint === 'string' ? [e.endpoint] : e.endpoint;
      for (const spec of eps) {
        const matched = resolveEndpointId(spec, provider);
        if (!matched) {
          refErrors.push({
            message: `[${i}].endpoint: ${t('customModels.validation.unknownEndpoint')} "${spec}"`,
            line: 0,
          });
        }
      }
    }
  }
  if (refErrors.length > 0) {
    return { models: [], errors: refErrors };
  }

  // Group by (provider, endpoint) and feed to existing loader
  const modules = groupEntries(reg, entries);

  const models: ModelItem[] = [];
  for (const mod of modules) {
    try {
      models.push(...loadModelsFromJson(mod, reg, 'custom'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      channel.warn(`Failed to load custom models from ${filePath}:`, err);

      return { models: [], errors: [{ message, line: 0 }] };
    }
  }

  return { models, errors: [] };
}

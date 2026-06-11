import * as fs from 'node:fs';
import { channel } from '../logger';
import { t } from '../nls';
import { loadModelsFromJson } from '../providers/loader';
import type { ModelItem } from '../providers/types';
import type { ModelJsonModule } from '../providers/loader';
import type { ModelProvider, ModelEndpoint } from '../providers/types';

export interface ValidationError {
  message: string;
  line: number;
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

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function validateModelItem(raw: unknown, idx: number): string[] {
  const errors: string[] = [];
  const prefix = `models[${idx}]`;

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
  if (!isNonEmptyString(m.apiId)) {
    errors.push(`${prefix}.apiId: ${t('customModels.validation.requiredString')}`);
  }
  if (m.maxInputTokens !== undefined && !isPositiveInt(m.maxInputTokens)) {
    errors.push(`${prefix}.maxInputTokens: ${t('customModels.validation.positiveInt')}`);
  }
  if (m.maxOutputTokens !== undefined && !isPositiveInt(m.maxOutputTokens)) {
    errors.push(`${prefix}.maxOutputTokens: ${t('customModels.validation.positiveInt')}`);
  }
  if (m.ability !== undefined) {
    if (!isRecord(m.ability)) {
      errors.push(`${prefix}.ability: ${t('customModels.validation.notAnObject')}`);
    } else {
      const a = m.ability as Record<string, unknown>;
      if (a.reasoning !== undefined && typeof a.reasoning !== 'boolean') {
        errors.push(`${prefix}.ability.reasoning: ${t('customModels.validation.boolean')}`);
      }
      if (a.imageInput !== undefined && typeof a.imageInput !== 'boolean') {
        errors.push(`${prefix}.ability.imageInput: ${t('customModels.validation.boolean')}`);
      }
    }
  }

  if (m.thinking !== undefined) {
    errors.push(...validateThinking(m.thinking, `${prefix}.thinking`));
  }

  return errors;
}

function validateThinking(raw: unknown, prefix: string): string[] {
  const errs: string[] = [];

  if (!isRecord(raw)) {
    errs.push(`${prefix}: ${t('customModels.validation.notAnObject')}`);
    return errs;
  }

  const th = raw as Record<string, unknown>;

  if (!isNonEmptyString(th.default)) {
    errs.push(`${prefix}.default: ${t('customModels.validation.requiredString')}`);
  }
  if (!isArray(th.options)) {
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
    if (!isNonEmptyString(opt.label)) {
      errs.push(`${prefix}.options[${i}].label: ${t('customModels.validation.requiredString')}`);
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

export function validateModelJson(module: Partial<ModelJsonModule>): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(module.providerId)) {
    errors.push(`providerId: ${t('customModels.validation.requiredString')}`);
  }
  if (!isNonEmptyString(module.endpointId)) {
    errors.push(`endpointId: ${t('customModels.validation.requiredString')}`);
  }
  if (module.thinking !== undefined) {
    errors.push(...validateThinking(module.thinking, 'thinking'));
  }
  if (!isArray(module.models)) {
    errors.push(`models: ${t('customModels.validation.array')}`);
  } else {
    for (let i = 0; i < module.models.length; i++) {
      errors.push(...validateModelItem(module.models[i], i));
    }
  }

  return errors;
}

export interface CustomModelsResult {
  models: ModelItem[];
  errors: ValidationError[];
}

function parseJson(text: string): { module: Partial<ModelJsonModule>; parseErrors: ValidationError[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err: unknown) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    // Try to extract line number from JSON parse error (e.g. "at line 5 column 3")
    const lineMatch = message.match(/line\s+(\d+)/i);
    const line = lineMatch ? Number(lineMatch[1]) : 0;
    return {
      module: {},
      parseErrors: [{ message: `${t('customModels.validation.jsonParse')}: ${message}`, line }],
    };
  }

  if (!isRecord(raw)) {
    return {
      module: {},
      parseErrors: [{ message: t('customModels.validation.topLevelObject'), line: 0 }],
    };
  }

  return { module: raw as Partial<ModelJsonModule>, parseErrors: [] };
}

export function loadCustomModels(filePath: string, reg: Registries): CustomModelsResult {
  if (!filePath) {
    return { models: [], errors: [] };
  }

  let text: string;
  try {
    text = fs.readFileSync(filePath, 'utf-8');
  } catch {
    // File doesn't exist or can't be read — not an error, just no custom models.
    return { models: [], errors: [] };
  }

  const { module, parseErrors } = parseJson(text);
  if (parseErrors.length > 0) {
    return { models: [], errors: parseErrors };
  }

  const validationErrors = validateModelJson(module);
  if (validationErrors.length > 0) {
    return {
      models: [],
      errors: validationErrors.map((msg) => ({ message: msg, line: 0 })),
    };
  }

  try {
    const models = loadModelsFromJson(module as ModelJsonModule, reg);
    return { models, errors: [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    channel.warn(`Failed to load custom models from ${filePath}:`, err);
    return { models: [], errors: [{ message, line: 0 }] };
  }
}

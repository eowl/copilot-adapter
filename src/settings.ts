import vscode from 'vscode';
import { EXT_ID } from './defines';

const LEVEL_OFF = 'off' as const;
const LEVEL_INFO = 'info' as const;
const LEVEL_META = 'meta' as const;
const LEVEL_VERBOSE = 'verbose' as const;

const LEVELS = [LEVEL_OFF, LEVEL_INFO, LEVEL_META, LEVEL_VERBOSE] as const;
export type DebugLevel = (typeof LEVELS)[number];

function asLevel(v: unknown): DebugLevel | undefined {
  return LEVELS.includes(v as DebugLevel) ? (v as DebugLevel) : undefined;
}

export class Settings {
  private static section(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(EXT_ID);
  }

  static tokenLimit(): number | undefined {
    const n = this.section().get<number>('maxTokens', 0);

    return n > 0 ? n : undefined;
  }

  private static activeLevel(): DebugLevel {
    const scoped = this.section().inspect<unknown>('debugMode');

    return asLevel(scoped?.workspaceValue) ?? asLevel(scoped?.globalValue) ?? LEVEL_OFF;
  }

  static loggingEnabled(): boolean {
    return this.activeLevel() !== LEVEL_OFF;
  }

  static metaEnabled(): boolean {
    const level = this.activeLevel();

    return level === LEVEL_META || level === LEVEL_VERBOSE;
  }

  static dumpEnabled(): boolean {
    return this.activeLevel() === LEVEL_VERBOSE;
  }

  static visionModel(): string {
    return this.section().get<string>('visionProxyModel', '').trim();
  }

  static visionProxyPrompt(): string {
    return this.section().get<string>('visionProxyPrompt', '').trim();
  }

  static requestTimeout(): number {
    return this.section().get<number>('requestTimeout', 60);
  }

  static requestRetries(): number {
    return this.section().get<number>('requestRetries', 2);
  }

  static imageTokenEstimate(): number {
    return this.section().get<number>('imageTokenEstimate', 1020);
  }

  static maxWarmupRounds(): number {
    return this.section().get<number>('maxWarmupRounds', 3);
  }

  static tokenRatio(): number {
    return this.section().get<number>('tokenRatio', 4);
  }

  static tokenRatioGlobal(): boolean {
    return this.section().get<boolean>('tokenRatioGlobal', false);
  }

  static tokenRatioAutoCalibrate(): boolean {
    return this.section().get<boolean>('tokenRatioAutoCalibrate', true);
  }

  static tokenRatioCalibrationThreshold(): number {
    return this.section().get<number>('tokenRatioCalibrationThreshold', 0.1);
  }

  static providerEndpoint(providerId: string): string | undefined {
    const map = this.section().get<Record<string, unknown>>('providerEndpoints', {});
    const raw = map?.[providerId];

    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }
}

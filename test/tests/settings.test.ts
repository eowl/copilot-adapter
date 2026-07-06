import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { Settings, type DebugLevel } from '../../src/settings';
import { stub, stubConfig, stubNested } from '../helpers/stubs';

function stubDebugMode(level: DebugLevel | undefined): () => void {
  const mockConfig = {
    get<T>(_section: string, defaultValue?: T): T {
      return defaultValue as T;
    },
    has: () => false,
    inspect<T>(_section: string): { workspaceValue?: T } | undefined {
      return level !== undefined ? { workspaceValue: level as T } : undefined;
    },
    update: () => Promise.resolve(),
  } as unknown as vscode.WorkspaceConfiguration;

  return stub(vscode.workspace, 'getConfiguration', () => mockConfig);
}

suite('Settings debug level', () => {
  let restore: () => void;

  afterEach(() => restore?.());

  suite('loggingEnabled()', () => {
    test('returns false when level is "off"', () => {
      restore = stubDebugMode('off');
      assert.equal(Settings.loggingEnabled(), false);
    });

    test('returns true when level is "info"', () => {
      restore = stubDebugMode('info');
      assert.equal(Settings.loggingEnabled(), true);
    });

    test('returns true when level is "meta"', () => {
      restore = stubDebugMode('meta');
      assert.equal(Settings.loggingEnabled(), true);
    });

    test('returns true when level is "verbose"', () => {
      restore = stubDebugMode('verbose');
      assert.equal(Settings.loggingEnabled(), true);
    });
  });

  suite('metaEnabled()', () => {
    test('returns false when level is "off"', () => {
      restore = stubDebugMode('off');
      assert.equal(Settings.metaEnabled(), false);
    });

    test('returns false when level is "info"', () => {
      restore = stubDebugMode('info');
      assert.equal(Settings.metaEnabled(), false);
    });

    test('returns true when level is "meta"', () => {
      restore = stubDebugMode('meta');
      assert.equal(Settings.metaEnabled(), true);
    });

    test('returns true when level is "verbose"', () => {
      restore = stubDebugMode('verbose');
      assert.equal(Settings.metaEnabled(), true);
    });
  });

  suite('verboseEnabled()', () => {
    test('returns false when level is "off"', () => {
      restore = stubDebugMode('off');
      assert.equal(Settings.verboseEnabled(), false);
    });

    test('returns false when level is "info"', () => {
      restore = stubDebugMode('info');
      assert.equal(Settings.verboseEnabled(), false);
    });

    test('returns false when level is "meta"', () => {
      restore = stubDebugMode('meta');
      assert.equal(Settings.verboseEnabled(), false);
    });

    test('returns true when level is "verbose"', () => {
      restore = stubDebugMode('verbose');
      assert.equal(Settings.verboseEnabled(), true);
    });
  });

  suite('pricingCurrency()', () => {
    let restoreConfig: () => void;
    let restoreLang: () => void;

    afterEach(() => {
      restoreConfig?.();
      restoreLang?.();
    });

    test('returns CNY when settings has "CNY" regardless of locale', () => {
      restoreConfig = stubConfig({ pricingCurrency: 'CNY' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'en');
      assert.equal(Settings.pricingCurrency(), 'CNY');
    });

    test('returns USD when settings has "USD" regardless of locale', () => {
      restoreConfig = stubConfig({ pricingCurrency: 'USD' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'zh-cn');
      assert.equal(Settings.pricingCurrency(), 'USD');
    });

    test('returns CNY locale fallback when settings is empty and language is zh-cn', () => {
      restoreConfig = stubConfig({ pricingCurrency: '' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'zh-cn');
      assert.equal(Settings.pricingCurrency(), 'CNY');
    });

    test('returns CNY locale fallback when settings is empty and language is zh-tw', () => {
      restoreConfig = stubConfig({ pricingCurrency: '' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'zh-tw');
      assert.equal(Settings.pricingCurrency(), 'CNY');
    });

    test('returns USD locale fallback when settings is empty and language is en', () => {
      restoreConfig = stubConfig({ pricingCurrency: '' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'en');
      assert.equal(Settings.pricingCurrency(), 'USD');
    });

    test('returns USD locale fallback when settings is empty and language is ja', () => {
      restoreConfig = stubConfig({ pricingCurrency: '' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'ja');
      assert.equal(Settings.pricingCurrency(), 'USD');
    });

    test('returns locale fallback when settings has invalid value', () => {
      restoreConfig = stubConfig({ pricingCurrency: 'EUR' });
      restoreLang = stubNested(vscode as unknown as Record<string, unknown>, 'env.language', 'zh-cn');
      assert.equal(Settings.pricingCurrency(), 'CNY');
    });
  });
});

import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { Settings, type DebugLevel } from '../../src/settings';
import { stub } from '../helpers/stubs';

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

suite('Settings — debug level', () => {
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

  suite('dumpEnabled()', () => {
    test('returns false when level is "off"', () => {
      restore = stubDebugMode('off');
      assert.equal(Settings.dumpEnabled(), false);
    });

    test('returns false when level is "info"', () => {
      restore = stubDebugMode('info');
      assert.equal(Settings.dumpEnabled(), false);
    });

    test('returns false when level is "meta"', () => {
      restore = stubDebugMode('meta');
      assert.equal(Settings.dumpEnabled(), false);
    });

    test('returns true when level is "verbose"', () => {
      restore = stubDebugMode('verbose');
      assert.equal(Settings.dumpEnabled(), true);
    });
  });
});

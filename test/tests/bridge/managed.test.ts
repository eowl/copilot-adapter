import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { seedManagedGroup } from '../../../src/bridge/managed';
import { DEEPSEEK, QWEN } from '../../../src/providers';
import { stub } from '../../helpers/stubs';

suite('bridge/managed seedManagedGroup', () => {
  let lastExecutedArgs: unknown[] | null = null;
  let restoreExecuteCommand: () => void;

  setup(() => {
    lastExecutedArgs = null;
    restoreExecuteCommand = stub(
      vscode.commands,
      'executeCommand',
      ((...args: unknown[]) => {
        // If the first call is the migrate command, capture its args
        if (args[0] === 'lm.migrateLanguageModelsProviderGroup') {
          lastExecutedArgs = args;
        }

        return Promise.resolve();
      }) as unknown as typeof vscode.commands.executeCommand,
    );
  });

  afterEach(() => {
    restoreExecuteCommand();
    lastExecutedArgs = null;
  });

  test('passes vendor, name, apiKey to migrate command', async () => {
    const result = await seedManagedGroup(DEEPSEEK, 'sk-test-key');
    assert.equal(result, true);
    assert.ok(lastExecutedArgs, 'executeCommand should have been called');

    const cmdArg = lastExecutedArgs![1] as Record<string, unknown>;
    assert.equal(cmdArg.vendor, 'copilot-adapter-deepseek');
    assert.equal(cmdArg.name, 'DeepSeek');
    assert.equal(cmdArg.apiKey, 'sk-test-key');
  });

  test('passes apiEndpoint when provided', async () => {
    const result = await seedManagedGroup(QWEN, 'sk-qwen', 'cn');
    assert.equal(result, true);

    const cmdArg = lastExecutedArgs![1] as Record<string, unknown>;
    assert.equal(cmdArg.apiEndpoint, 'cn');
  });

  test('does not include apiEndpoint in args when not provided', async () => {
    const result = await seedManagedGroup(DEEPSEEK, 'sk-key');
    assert.equal(result, true);

    const cmdArg = lastExecutedArgs![1] as Record<string, unknown>;
    assert.ok(!('apiEndpoint' in cmdArg));
  });

  test('uses custom groupName when provided', async () => {
    const result = await seedManagedGroup(QWEN, 'sk-qwen2', 'us', 'Qwen 2');
    assert.equal(result, true);

    const cmdArg = lastExecutedArgs![1] as Record<string, unknown>;
    assert.equal(cmdArg.name, 'Qwen 2');
    assert.equal(cmdArg.apiEndpoint, 'us');
  });

  test('returns false when executeCommand throws', async () => {
    restoreExecuteCommand();
    restoreExecuteCommand = stub(vscode.commands, 'executeCommand', () => {
      throw new Error('Command not found');
    });

    const result = await seedManagedGroup(DEEPSEEK, 'sk-key');
    assert.equal(result, false);
  });
});

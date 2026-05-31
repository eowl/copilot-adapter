import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { routeToolFlow } from '../../../../src/bridge/utils/router';
import type { Model } from '../../../../src/providers/types';

function makeModel(maxTools?: number): Model {
  return {
    id: 'test-model',
    label: 'Test Model',
    apiId: 'test-model',
    family: 'test',
    version: '1',
    maxInputTokens: 100_000,
    maxOutputTokens: 4096,
    ability: {
      reasoning: false,
      maxTools,
      acceptsImages: false,
    },
    detailKey: 'model.test.detail',
  };
}

// Minimal stub for Provider (routeToolFlow does not use _provider for stabilize=false path)
const stubProvider = {} as never;

suite('bridge/utils/router — routeToolFlow', () => {
  test('always returns kind "proceed" (stabilize is false)', () => {
    const result = routeToolFlow([], [], makeModel(), stubProvider);
    assert.equal(result.kind, 'proceed');
  });

  test('passes tools through buildToolList', () => {
    const vsTools: vscode.LanguageModelChatTool[] = [
      { name: 'tool_a', description: 'A', inputSchema: {} as Record<string, unknown> },
      { name: 'tool_b', description: 'B', inputSchema: {} as Record<string, unknown> },
    ];
    const result = routeToolFlow(vsTools, [], makeModel(), stubProvider);
    assert.equal(result.kind, 'proceed');
    assert.ok(Array.isArray(result.tools));
    assert.equal(result.tools!.length, 2);
  });

  test('tools is undefined when no vsTools provided', () => {
    const result = routeToolFlow(undefined, [], makeModel(), stubProvider);
    assert.equal(result.kind, 'proceed');
    assert.equal(result.tools, undefined);
  });

  test('respects maxTools model limit via buildToolList', () => {
    const vsTools: vscode.LanguageModelChatTool[] = [
      { name: 'a', description: '', inputSchema: {} as Record<string, unknown> },
      { name: 'b', description: '', inputSchema: {} as Record<string, unknown> },
      { name: 'c', description: '', inputSchema: {} as Record<string, unknown> },
    ];
    const result = routeToolFlow(vsTools, [], makeModel(2), stubProvider);
    assert.equal(result.kind, 'proceed');
    assert.equal(result.tools!.length, 2);
  });

  test('messages returned unchanged (no drift cleaning when stabilize=false)', () => {
    const msgs = [
      vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('hello')]),
    ];
    const result = routeToolFlow([], msgs, makeModel(), stubProvider);
    assert.equal(result.kind, 'proceed');
    assert.strictEqual(result.messages, msgs);
  });
});

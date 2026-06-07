import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { buildToolList, gatherTrailingResultIds } from '../../../../src/bridge/utils/build';

function makeTool(name: string): vscode.LanguageModelChatTool {
  return {
    name,
    description: `Tool: ${name}`,
    inputSchema: { type: 'object', properties: {} } as Record<string, unknown>,
  };
}

suite('bridge/utils/build', () => {
  suite('buildToolList()', () => {
    test('returns undefined for undefined input', () => {
      assert.equal(buildToolList(undefined, undefined), undefined);
    });

    test('returns undefined for empty array', () => {
      assert.equal(buildToolList([], undefined), undefined);
    });

    test('maps a single tool to the expected shape', () => {
      const result = buildToolList([makeTool('my_tool')], undefined);
      assert.ok(Array.isArray(result));
      assert.equal(result!.length, 1);
      assert.equal(result![0].type, 'function');
      assert.equal(result![0].function.name, 'my_tool');
      assert.equal(result![0].function.description, 'Tool: my_tool');
    });

    test('preserves all tools when count is below maxTools', () => {
      const tools = [makeTool('a'), makeTool('b'), makeTool('c')];
      const result = buildToolList(tools, 5);
      assert.equal(result!.length, 3);
    });

    test('truncates to maxTools when count exceeds limit', () => {
      const tools = [makeTool('a'), makeTool('b'), makeTool('c'), makeTool('d')];
      const result = buildToolList(tools, 2);
      assert.equal(result!.length, 2);
      assert.equal(result![0].function.name, 'a');
      assert.equal(result![1].function.name, 'b');
    });

    test('passes undefined maxTools without truncation', () => {
      const tools = Array.from({ length: 10 }, (_, i) => makeTool(`tool_${i}`));
      const result = buildToolList(tools, undefined);
      assert.equal(result!.length, 10);
    });

    test('produces stable output regardless of inputSchema key order', () => {
      const toolA: vscode.LanguageModelChatTool = {
        name: 'search',
        description: 'Search',
        inputSchema: { type: 'object', properties: { z: { type: 'string' }, a: { type: 'number' } } } as Record<string, unknown>,
      };
      const toolB: vscode.LanguageModelChatTool = {
        name: 'search',
        description: 'Search',
        inputSchema: { type: 'object', properties: { a: { type: 'number' }, z: { type: 'string' } } } as Record<string, unknown>,
      };
      const resultA = buildToolList([toolA], undefined);
      const resultB = buildToolList([toolB], undefined);
      assert.equal(JSON.stringify(resultA), JSON.stringify(resultB));
    });
  });

  suite('gatherTrailingResultIds()', () => {
    test('returns [] for empty message list', () => {
      assert.deepEqual(gatherTrailingResultIds([]), []);
    });

    test('returns [] when last message has no tool results', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('hi')]),
      ];
      assert.deepEqual(gatherTrailingResultIds(messages), []);
    });

    test('returns the callId of a trailing tool result message', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('hi')]),
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart('call-1', [
            new vscode.LanguageModelTextPart('done'),
          ]),
        ]),
      ];
      assert.deepEqual(gatherTrailingResultIds(messages), ['call-1']);
    });

    test('collects callIds from multiple consecutive trailing result messages', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart('call-1', []),
        ]),
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart('call-2', []),
        ]),
      ];
      assert.deepEqual(gatherTrailingResultIds(messages), ['call-1', 'call-2']);
    });

    test('stops at the first non-result message', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart('call-1', []),
        ]),
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('not a result')]),
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart('call-3', []),
        ]),
      ];
      // last message has call-3, second-to-last is text (stop), call-1 not included
      assert.deepEqual(gatherTrailingResultIds(messages), ['call-3']);
    });
  });
});

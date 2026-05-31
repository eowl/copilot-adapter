import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { estimateTokens, refineRatio } from '../../../src/bridge/tally';

suite('bridge/tally', () => {
  suite('estimateTokens() — string input', () => {
    test('empty string returns 0', () => {
      assert.equal(estimateTokens('', 4), 0);
    });

    test('string of exactly one chars-per-token length returns 1', () => {
      assert.equal(estimateTokens('abcd', 4), 1);
    });

    test('rounds up when not evenly divisible', () => {
      // 5 chars / 4 = 1.25 → ceil → 2
      assert.equal(estimateTokens('abcde', 4), 2);
    });

    test('uses provided ratio', () => {
      assert.equal(estimateTokens('aaaaaa', 3), 2); // 6/3=2
      assert.equal(estimateTokens('aaaaaa', 6), 1); // 6/6=1
    });
  });

  suite('estimateTokens() — message input', () => {
    test('sums chars from TextParts in user message', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart('hello'), // 5
        new vscode.LanguageModelTextPart(' world'), // 6
      ]);
      // 11 chars / 4 = 2.75 → ceil → 3
      assert.equal(estimateTokens(msg, 4), 3);
    });

    test('counts ToolCallPart name + serialized input', () => {
      const msg = vscode.LanguageModelChatMessage.Assistant([
        new vscode.LanguageModelToolCallPart('call-1', 'my_tool', { arg: 'val' }),
      ]);
      const nameLen = 'my_tool'.length; // 7
      const inputLen = JSON.stringify({ arg: 'val' }).length; // 11
      const expected = Math.ceil((nameLen + inputLen) / 4);
      assert.equal(estimateTokens(msg, 4), expected);
    });

    test('sums text items inside ToolResultPart', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelToolResultPart('call-1', [
          new vscode.LanguageModelTextPart('done!'), // 5
        ]),
      ]);
      assert.equal(estimateTokens(msg, 5), 1); // 5/5=1
    });

    test('marker DataPart contributes 0 tokens', () => {
      const markerData = new TextEncoder().encode('copilot-adapter\\json:dGVzdA');
      const msg = vscode.LanguageModelChatMessage.Assistant([
        new vscode.LanguageModelDataPart(markerData, 'stateful_marker'),
      ]);
      assert.equal(estimateTokens(msg, 4), 0);
    });

    test('message with no parts returns 0', () => {
      const msg = vscode.LanguageModelChatMessage.User([]);
      assert.equal(estimateTokens(msg, 4), 0);
    });
  });

  suite('refineRatio()', () => {
    test('returns currentRatio when promptTokens <= 0', () => {
      assert.equal(refineRatio(1000, 0, 4.0), 4.0);
      assert.equal(refineRatio(1000, -1, 4.0), 4.0);
    });

    test('returns currentRatio when totalRequestChars <= 0', () => {
      assert.equal(refineRatio(0, 100, 4.0), 4.0);
      assert.equal(refineRatio(-1, 100, 4.0), 4.0);
    });

    test('applies EMA: new = old * 0.8 + observed * 0.2', () => {
      // 2000 chars / 500 tokens = 4.0 observed; currentRatio = 4.0
      // expected: 4.0 * 0.8 + 4.0 * 0.2 = 4.0
      assert.equal(refineRatio(2000, 500, 4.0), 4.0);
    });

    test('shifts ratio toward observed value', () => {
      // 1000 chars / 100 tokens = 10.0 observed; currentRatio = 4.0
      // expected: 4.0 * 0.8 + 10.0 * 0.2 = 3.2 + 2.0 = 5.2
      const result = refineRatio(1000, 100, 4.0);
      assert.ok(Math.abs(result - 5.2) < 1e-9, `Expected 5.2, got ${result}`);
    });
  });
});

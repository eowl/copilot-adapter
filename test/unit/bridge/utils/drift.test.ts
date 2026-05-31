import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { buildDriftWarning, stripDriftNotice, cleanDriftNotices } from '../../../../src/bridge/utils/drift';
import { DRIFT_NOTICE_START, DRIFT_NOTICE_END } from '../../../../src/bridge/utils/defines';

suite('bridge/utils/drift', () => {
  suite('buildDriftWarning()', () => {
    test('result contains the DRIFT_NOTICE_START sentinel', () => {
      const result = buildDriftWarning(['tool_a', 'tool_b']);
      assert.ok(result.includes(DRIFT_NOTICE_START), `Missing start sentinel: ${result}`);
    });

    test('result contains the DRIFT_NOTICE_END sentinel', () => {
      const result = buildDriftWarning(['tool_a']);
      assert.ok(result.includes(DRIFT_NOTICE_END), `Missing end sentinel: ${result}`);
    });

    test('result has content between the two sentinels', () => {
      const result = buildDriftWarning(['alpha', 'beta']);
      const start = result.indexOf(DRIFT_NOTICE_START);
      const end = result.indexOf(DRIFT_NOTICE_END);
      assert.ok(start >= 0 && end > start, 'Sentinels missing or in wrong order');
    });
  });

  suite('stripDriftNotice()', () => {
    test('returns text unchanged when no notice is present', () => {
      const text = 'plain text without any notice';
      assert.equal(stripDriftNotice(text), text);
    });

    test('removes an injected drift notice block', () => {
      const notice = buildDriftWarning(['removed_tool']);
      const text = `original content${notice}`;
      const stripped = stripDriftNotice(text);
      assert.ok(!stripped.includes(DRIFT_NOTICE_START), 'Start sentinel still present');
      assert.ok(!stripped.includes(DRIFT_NOTICE_END), 'End sentinel still present');
      assert.ok(stripped.includes('original content'), 'Original content was removed');
    });

    test('strips only the notice block, preserves content after it', () => {
      const notice = buildDriftWarning(['t']);
      const text = `before${notice}after`;
      const stripped = stripDriftNotice(text);
      assert.ok(stripped.includes('before'), 'Lost content before notice');
      assert.ok(stripped.includes('after'), 'Lost content after notice');
    });
  });

  suite('cleanDriftNotices()', () => {
    test('returns messages unchanged when no notices present', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart('clean text'),
      ]);
      const result = cleanDriftNotices([msg]);
      assert.strictEqual(result[0], msg, 'Message reference should be identical');
    });

    test('cleans drift notice from user text part', () => {
      const notice = buildDriftWarning(['gone_tool']);
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart(`user text${notice}`),
      ]);
      const result = cleanDriftNotices([msg]);
      const part = (result[0].content[0] as vscode.LanguageModelTextPart).value;
      assert.ok(!part.includes(DRIFT_NOTICE_START), `Sentinel still in text: ${part}`);
    });

    test('does not modify assistant messages', () => {
      const notice = buildDriftWarning(['t']);
      const msg = vscode.LanguageModelChatMessage.Assistant([
        new vscode.LanguageModelTextPart(`assistant${notice}`),
      ]);
      const result = cleanDriftNotices([msg]);
      // Assistant messages are passed through unchanged
      assert.strictEqual(result[0], msg);
    });

    test('preserves non-text parts in user messages', () => {
      const toolResult = new vscode.LanguageModelToolResultPart('call-1', [
        new vscode.LanguageModelTextPart('result'),
      ]);
      const msg = vscode.LanguageModelChatMessage.User([toolResult]);
      const result = cleanDriftNotices([msg]);
      assert.strictEqual(result[0].content[0], toolResult);
    });
  });
});

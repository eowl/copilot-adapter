import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import {
  makeWarmupCallId,
  parseWarmupCallId,
  scanWarmupState,
  stripWarmupMessages,
  needsWarmup,
} from '../../../../src/bridge/utils/preflight';
import { WARMUP_CALL_ID_PREFIX } from '../../../../src/bridge/utils/defines';
import { stubConfig } from '../../../helpers/stubs';

const ACTIVATE_TOOL = 'activate_coding';
const OTHER_TOOL = 'regular_tool';

suite('bridge/utils/preflight', () => {
  suite('makeWarmupCallId()', () => {
    test('starts with WARMUP_CALL_ID_PREFIX', () => {
      const id = makeWarmupCallId(1, ACTIVATE_TOOL);
      assert.ok(id.startsWith(WARMUP_CALL_ID_PREFIX), `Got: ${id}`);
    });

    test('includes the round number after the prefix', () => {
      const id = makeWarmupCallId(2, ACTIVATE_TOOL);
      const rest = id.slice(WARMUP_CALL_ID_PREFIX.length);
      assert.ok(rest.startsWith('2_'), `Expected "2_...", got: ${rest}`);
    });

    test('includes a 32-char hex hash', () => {
      const id = makeWarmupCallId(1, ACTIVATE_TOOL);
      const rest = id.slice(WARMUP_CALL_ID_PREFIX.length);
      const hash = rest.slice(rest.indexOf('_') + 1);
      assert.match(hash, /^[0-9a-f]{32}$/, `Hash should be 32 hex chars, got: ${hash}`);
    });

    test('same inputs produce same output (deterministic)', () => {
      const a = makeWarmupCallId(1, ACTIVATE_TOOL);
      const b = makeWarmupCallId(1, ACTIVATE_TOOL);
      assert.equal(a, b);
    });

    test('different round: different callId', () => {
      const a = makeWarmupCallId(1, ACTIVATE_TOOL);
      const b = makeWarmupCallId(2, ACTIVATE_TOOL);
      assert.notEqual(a, b);
    });

    test('different toolName: different callId', () => {
      const a = makeWarmupCallId(1, 'activate_a');
      const b = makeWarmupCallId(1, 'activate_b');
      assert.notEqual(a, b);
    });
  });

  suite('parseWarmupCallId()', () => {
    test('returns undefined for a non-warmup callId', () => {
      assert.equal(parseWarmupCallId('regular-call-id'), undefined);
    });

    test('round-trips with makeWarmupCallId', () => {
      const callId = makeWarmupCallId(3, ACTIVATE_TOOL);
      const parsed = parseWarmupCallId(callId);
      assert.ok(parsed !== undefined);
      assert.equal(parsed!.round, 3);
      assert.ok(parsed!.hash.length === 32);
    });

    test('returns undefined when prefix is present but no underscore after round', () => {
      const malformed = `${WARMUP_CALL_ID_PREFIX}1`;
      assert.equal(parseWarmupCallId(malformed), undefined);
    });
  });

  suite('scanWarmupState()', () => {
    test('returns inProgress=false, completedRounds=0 for empty messages', () => {
      const state = scanWarmupState([], [ACTIVATE_TOOL]);
      assert.equal(state.inProgress, false);
      assert.equal(state.completedRounds, 0);
      assert.deepEqual(state.pendingNames, []);
    });

    test('detects in-progress warmup: tool call present, no result yet', () => {
      const callId = makeWarmupCallId(1, ACTIVATE_TOOL);
      const messages = [
        vscode.LanguageModelChatMessage.Assistant([
          new vscode.LanguageModelToolCallPart(callId, ACTIVATE_TOOL, {}),
        ]),
      ];
      const state = scanWarmupState(messages, [ACTIVATE_TOOL]);
      assert.equal(state.inProgress, true);
      assert.equal(state.completedRounds, 1);
    });

    test('detects completed warmup: tool call + result present', () => {
      const callId = makeWarmupCallId(1, ACTIVATE_TOOL);
      const messages = [
        vscode.LanguageModelChatMessage.Assistant([
          new vscode.LanguageModelToolCallPart(callId, ACTIVATE_TOOL, {}),
        ]),
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart(callId, [
            new vscode.LanguageModelTextPart('activated'),
          ]),
        ]),
      ];
      const state = scanWarmupState(messages, [ACTIVATE_TOOL]);
      assert.equal(state.inProgress, false);
      assert.equal(state.completedRounds, 1);
    });
  });

  suite('stripWarmupMessages()', () => {
    test('keeps messages without warmup parts', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart('hello'),
      ]);
      const result = stripWarmupMessages([msg]);
      assert.equal(result.length, 1);
      assert.strictEqual(result[0], msg);
    });

    test('removes messages that contain a warmup tool call', () => {
      const callId = makeWarmupCallId(1, ACTIVATE_TOOL);
      const warmupMsg = vscode.LanguageModelChatMessage.Assistant([
        new vscode.LanguageModelToolCallPart(callId, ACTIVATE_TOOL, {}),
      ]);
      const result = stripWarmupMessages([warmupMsg]);
      assert.equal(result.length, 0);
    });

    test('removes messages that contain a warmup tool result', () => {
      const callId = makeWarmupCallId(1, ACTIVATE_TOOL);
      const resultMsg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelToolResultPart(callId, []),
      ]);
      const result = stripWarmupMessages([resultMsg]);
      assert.equal(result.length, 0);
    });
  });

  suite('needsWarmup()', () => {
    test('returns false when isEnabled is false', () => {
      assert.equal(needsWarmup([], [ACTIVATE_TOOL], false), false);
    });

    test('returns false when no activate_ tools in the list', () => {
      assert.equal(needsWarmup([], [OTHER_TOOL], true), false);
    });

    test('returns false for empty tool list', () => {
      assert.equal(needsWarmup([], [], true), false);
    });

    test('returns true when warmup has not started and maxWarmupRounds > 0', () => {
      const restore = stubConfig({ maxWarmupRounds: 3 });
      try {
        assert.equal(needsWarmup([], [ACTIVATE_TOOL], true), true);
      } finally {
        restore();
      }
    });

    test('returns true when warmup is partial (1/3 completed)', () => {
      const callId1 = makeWarmupCallId(1, ACTIVATE_TOOL);
      const messages = [
        vscode.LanguageModelChatMessage.Assistant([
          new vscode.LanguageModelToolCallPart(callId1, ACTIVATE_TOOL, {}),
        ]),
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelToolResultPart(callId1, []),
        ]),
      ];
      const restore = stubConfig({ maxWarmupRounds: 3 });
      try {
        assert.equal(needsWarmup(messages, [ACTIVATE_TOOL], true), true);
      } finally {
        restore();
      }
    });

    test('returns false when warmup reached maxWarmupRounds', () => {
      const restore = stubConfig({ maxWarmupRounds: 3 });
      try {
        const callId1 = makeWarmupCallId(1, ACTIVATE_TOOL);
        const callId2 = makeWarmupCallId(2, ACTIVATE_TOOL);
        const callId3 = makeWarmupCallId(3, ACTIVATE_TOOL);
        const messages = [
          vscode.LanguageModelChatMessage.Assistant([
            new vscode.LanguageModelToolCallPart(callId1, ACTIVATE_TOOL, {}),
          ]),
          vscode.LanguageModelChatMessage.User([
            new vscode.LanguageModelToolResultPart(callId1, []),
          ]),
          vscode.LanguageModelChatMessage.Assistant([
            new vscode.LanguageModelToolCallPart(callId2, ACTIVATE_TOOL, {}),
          ]),
          vscode.LanguageModelChatMessage.User([
            new vscode.LanguageModelToolResultPart(callId2, []),
          ]),
          vscode.LanguageModelChatMessage.Assistant([
            new vscode.LanguageModelToolCallPart(callId3, ACTIVATE_TOOL, {}),
          ]),
          vscode.LanguageModelChatMessage.User([
            new vscode.LanguageModelToolResultPart(callId3, []),
          ]),
        ];
        assert.equal(needsWarmup(messages, [ACTIVATE_TOOL], true), false);
      } finally {
        restore();
      }
    });

    test('returns false when warmup is in-progress (call without result)', () => {
      const callId = makeWarmupCallId(1, ACTIVATE_TOOL);
      const messages = [
        vscode.LanguageModelChatMessage.Assistant([
          new vscode.LanguageModelToolCallPart(callId, ACTIVATE_TOOL, {}),
        ]),
      ];
      const restore = stubConfig({ maxWarmupRounds: 3 });
      try {
        // inProgress is true so needsWarmup returns false (don't start a new round)
        assert.equal(needsWarmup(messages, [ACTIVATE_TOOL], true), false);
      } finally {
        restore();
      }
    });
  });
});

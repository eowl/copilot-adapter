import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { Session } from '../../../src/bridge/session';
import { encodeMarker } from '../../../src/marker/codec';
import { MARKER_MIME } from '../../../src/marker/defines';

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeAssistantWithMarker(segmentId?: string): vscode.LanguageModelChatMessage {
  const markerPart = encodeMarker({}, segmentId);
  return vscode.LanguageModelChatMessage.Assistant([
    new vscode.LanguageModelTextPart('response text'),
    markerPart,
  ]);
}

function makeAssistantWithInvalidMarker(): vscode.LanguageModelChatMessage {
  // A DataPart with the correct MIME but unparseable content
  const badData = new TextEncoder().encode('no-separator-here');
  return vscode.LanguageModelChatMessage.Assistant([
    new vscode.LanguageModelDataPart(badData, MARKER_MIME),
  ]);
}

suite('bridge/session', () => {
  suite('Session.fromMessages()', () => {
    test('source is "new" when there are no messages', () => {
      const session = Session.fromMessages([]);
      assert.equal(session.source, 'new');
    });

    test('source is "new" when no assistant messages have markers', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('hello')]),
        vscode.LanguageModelChatMessage.Assistant([new vscode.LanguageModelTextPart('hi')]),
      ];
      const session = Session.fromMessages(messages);
      assert.equal(session.source, 'new');
    });

    test('source is "marker" and id equals segmentId when valid marker found', () => {
      const messages = [
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('hello')]),
        makeAssistantWithMarker(SAMPLE_UUID),
      ];
      const session = Session.fromMessages(messages);
      assert.equal(session.source, 'marker');
      assert.equal(session.id, SAMPLE_UUID.toLowerCase());
    });

    test('source is "new" when marker has no segmentId', () => {
      // encodeMarker with no segmentId → marker without segmentId field
      const messages = [makeAssistantWithMarker()];
      const session = Session.fromMessages(messages);
      // valid marker but no segmentId → falls through to "new"
      assert.equal(session.source, 'new');
    });

    test('source is "invalid" when marker is malformed', () => {
      const messages = [makeAssistantWithInvalidMarker()];
      const session = Session.fromMessages(messages);
      assert.equal(session.source, 'invalid');
    });

    test('scans in reverse — uses the LAST assistant marker', () => {
      const uuid1 = '11111111-1111-1111-1111-111111111111';
      const uuid2 = '22222222-2222-2222-2222-222222222222';
      const messages = [
        makeAssistantWithMarker(uuid1),
        vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart('follow-up')]),
        makeAssistantWithMarker(uuid2),
      ];
      const session = Session.fromMessages(messages);
      assert.equal(session.source, 'marker');
      assert.equal(session.id, uuid2.toLowerCase());
    });

    test('id is a string (random UUID) for source "new"', () => {
      const session = Session.fromMessages([]);
      assert.equal(typeof session.id, 'string');
      assert.ok(session.id.length > 0);
    });
  });
});

import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { tagRequest } from '../../../src/trace/tag';

function userMsg(text: string): vscode.LanguageModelChatMessage {
  return vscode.LanguageModelChatMessage.User([new vscode.LanguageModelTextPart(text)]);
}

function makeTool(name: string): vscode.LanguageModelChatTool {
  return { name, description: name, inputSchema: {} as Record<string, unknown> };
}

suite('trace/tag — tagRequest()', () => {
  test('returns "unknown" when there are no messages', () => {
    assert.equal(tagRequest([], undefined), 'unknown');
  });

  test('returns "unknown" when there are no user messages', () => {
    const messages = [
      vscode.LanguageModelChatMessage.Assistant([new vscode.LanguageModelTextPart('hi')]),
    ];
    assert.equal(tagRequest(messages, undefined), 'unknown');
  });

  test('returns "terminal-steering" when runInTerminal tool is present', () => {
    const tools = [makeTool('runInTerminal')];
    assert.equal(tagRequest([userMsg('do stuff')], tools), 'terminal-steering');
  });

  test('returns "terminal-steering" for run_in_terminal (snake_case)', () => {
    const tools = [makeTool('run_in_terminal')];
    assert.equal(tagRequest([userMsg('do stuff')], tools), 'terminal-steering');
  });

  test('returns "todo-tracker" when message contains "todo"', () => {
    assert.equal(tagRequest([userMsg('update my todo list')], []), 'todo-tracker');
  });

  test('returns "todo-tracker" when message contains "task list"', () => {
    assert.equal(tagRequest([userMsg('here is a task list for you')], []), 'todo-tracker');
  });

  test('returns "todo-tracker" when message contains "checklist"', () => {
    assert.equal(tagRequest([userMsg('review the checklist')], []), 'todo-tracker');
  });

  test('returns "settings-resolver" when message contains "setting"', () => {
    assert.equal(tagRequest([userMsg('update the setting for linting')], []), 'settings-resolver');
  });

  test('returns "settings-resolver" when message contains "configuration"', () => {
    assert.equal(tagRequest([userMsg('check the configuration file')], []), 'settings-resolver');
  });

  test('returns "settings-resolver" when message contains "configure"', () => {
    assert.equal(tagRequest([userMsg('configure the editor')], []), 'settings-resolver');
  });

  test('returns "background" when no tools and no keyword match', () => {
    assert.equal(tagRequest([userMsg('plain user message')], undefined), 'background');
  });

  test('returns "background" when empty tools array and no keyword match', () => {
    assert.equal(tagRequest([userMsg('plain user message')], []), 'background');
  });

  test('returns "main-agent" when tools present and no special keyword', () => {
    const tools = [makeTool('file_write'), makeTool('shell_exec')];
    assert.equal(tagRequest([userMsg('implement a feature')], tools), 'main-agent');
  });

  test('terminal-steering check precedes keyword check (priority)', () => {
    // Message contains "todo" but has runInTerminal tool → terminal-steering wins
    const tools = [makeTool('runInTerminal')];
    assert.equal(tagRequest([userMsg('todo: run this')], tools), 'terminal-steering');
  });

  test('uses the LAST user message for classification', () => {
    const messages = [
      userMsg('configure the settings'),   // would match settings-resolver
      userMsg('implement a feature'),        // no keyword → main-agent
    ];
    const tools = [makeTool('some_tool')];
    // Last user message is "implement a feature" → main-agent
    assert.equal(tagRequest(messages, tools), 'main-agent');
  });
});

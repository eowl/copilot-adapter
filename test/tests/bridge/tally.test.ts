import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import {
  estimateTokens,
  refineRatio,
  getCalibratedRatio,
  calibrateRatio,
  DEFAULT_CHARS_PER_TOKEN,
} from '../../../src/bridge/tally';
import { Settings } from '../../../src/settings';
import { stubConfig } from '../../helpers/stubs';

suite('bridge/tally', () => {
  suite('estimateTokens() string input', () => {
    test('empty string returns 0', () => {
      assert.equal(estimateTokens('', 4), 0);
    });

    test('string of exactly one chars-per-token length returns 1', () => {
      assert.equal(estimateTokens('abcd', 4), 1);
    });

    test('rounds up when not evenly divisible', () => {
      assert.equal(estimateTokens('abcde', 4), 2);
    });

    test('uses provided ratio', () => {
      assert.equal(estimateTokens('aaaaaa', 3), 2); // 6/3=2
      assert.equal(estimateTokens('aaaaaa', 6), 1); // 6/6=1
    });
  });

  suite('estimateTokens() message input', () => {
    test('sums chars from TextParts in user message', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart('hello'), // 5
        new vscode.LanguageModelTextPart(' world'), // 6
      ]);
      assert.equal(estimateTokens(msg, 4), 3);
    });

    test('counts ToolCallPart callId + name + serialized input', () => {
      const msg = vscode.LanguageModelChatMessage.Assistant([
        new vscode.LanguageModelToolCallPart('call-1', 'my_tool', { arg: 'val' }),
      ]);
      const callIdLen = 'call-1'.length; // 6
      const nameLen = 'my_tool'.length; // 7
      const inputLen = JSON.stringify({ arg: 'val' }).length; // 11
      const expected = Math.ceil((callIdLen + nameLen + inputLen) / 4);
      assert.equal(estimateTokens(msg, 4), expected);
    });

    test('sums text items inside ToolResultPart (includes callId)', () => {
      const msg = vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelToolResultPart('call-1', [
          new vscode.LanguageModelTextPart('done!'), // 5
        ]),
      ]);
      assert.equal(estimateTokens(msg, 5), 3);
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

suite('tokenRatio settings & calibration', () => {
  let restore: () => void;

  afterEach(() => restore?.());

  test('Settings.tokenRatio() default is 4', () => {
    restore = stubConfig({});
    assert.equal(Settings.tokenRatio(), 4);
  });

  test('Settings.tokenRatio() custom', () => {
    restore = stubConfig({ tokenRatio: 3.5 });
    assert.equal(Settings.tokenRatio(), 3.5);
  });

  test('Settings.tokenRatioGlobal() default is false', () => {
    restore = stubConfig({});
    assert.equal(Settings.tokenRatioGlobal(), false);
  });

  test('Settings.tokenRatioGlobal() custom', () => {
    restore = stubConfig({ tokenRatioGlobal: true });
    assert.equal(Settings.tokenRatioGlobal(), true);
  });

  test('Settings.tokenRatioAutoCalibrate() default is true', () => {
    restore = stubConfig({});
    assert.equal(Settings.tokenRatioAutoCalibrate(), true);
  });

  test('Settings.tokenRatioAutoCalibrate() custom', () => {
    restore = stubConfig({ tokenRatioAutoCalibrate: false });
    assert.equal(Settings.tokenRatioAutoCalibrate(), false);
  });

  test('Settings.tokenRatioCalibrationThreshold() default is 0.1', () => {
    restore = stubConfig({});
    assert.equal(Settings.tokenRatioCalibrationThreshold(), 0.1);
  });

  test('Settings.tokenRatioCalibrationThreshold() custom', () => {
    restore = stubConfig({ tokenRatioCalibrationThreshold: 0.25 });
    assert.equal(Settings.tokenRatioCalibrationThreshold(), 0.25);
  });

  test('getCalibratedRatio returns default when no calibration data exists', () => {
    restore = stubConfig({});
    assert.equal(getCalibratedRatio('unknown-provider', 4.0), 4.0);
    assert.equal(getCalibratedRatio('unknown-provider', 2.5), 2.5);
  });

  test('getCalibratedRatio returns Settings.tokenRatio() when tokenRatioGlobal is true', () => {
    restore = stubConfig({ tokenRatioGlobal: true, tokenRatio: 3.0 });
    assert.equal(getCalibratedRatio('unknown-provider', 4.0), 3.0);
  });

  test('calibrateRatio returns changed=false when tokenRatioGlobal is true', () => {
    restore = stubConfig({ tokenRatioGlobal: true, tokenRatio: 3.0 });
    const result = calibrateRatio('test-provider', 100, 10, 3.0);
    assert.equal(result.changed, false);
    assert.equal(result.newRatio, 3.0);
  });

  test('calibrateRatio returns changed=false when tokenRatioAutoCalibrate is false', () => {
    restore = stubConfig({ tokenRatioAutoCalibrate: false });
    const result = calibrateRatio('test-provider', 100, 10, DEFAULT_CHARS_PER_TOKEN);
    assert.equal(result.changed, false);
    assert.equal(result.newRatio, DEFAULT_CHARS_PER_TOKEN);
  });

  test('calibrates when change exceeds threshold', () => {
    // observed=100/10=10, EMA: 4*0.8+10*0.2=5.2, change=|5.2-4|/4=30% > 5%
    restore = stubConfig({
      tokenRatioAutoCalibrate: true,
      tokenRatioCalibrationThreshold: 0.05,
    });
    const result = calibrateRatio('test-provider', 100, 10, DEFAULT_CHARS_PER_TOKEN);
    assert.equal(result.changed, true);
    assert.ok(Math.abs(result.newRatio - 5.2) < 1e-10);
  });

  test('does not calibrate when change is below threshold', () => {
    // observed=100/10=10, EMA=4*0.8+10*0.2=5.2, change=30% < 50%
    restore = stubConfig({
      tokenRatioAutoCalibrate: true,
      tokenRatioCalibrationThreshold: 0.5,
    });
    // Use unique provider to avoid pollution from previous tests
    const result = calibrateRatio('below-threshold-provider', 100, 10, DEFAULT_CHARS_PER_TOKEN);
    assert.equal(result.changed, false);
    assert.ok(Math.abs(result.newRatio - 5.2) < 1e-10);
  });

  test('returns safe result when promptChars is 0', () => {
    restore = stubConfig({
      tokenRatioAutoCalibrate: true,
      tokenRatioCalibrationThreshold: 0.1,
    });
    // Unique provider id to ensure clean calibration state
    const result = calibrateRatio('zero-chars-provider', 0, 10, DEFAULT_CHARS_PER_TOKEN);
    assert.equal(result.changed, false);
    assert.equal(result.newRatio, DEFAULT_CHARS_PER_TOKEN);
  });

  test('returns safe result when promptTokens is 0', () => {
    restore = stubConfig({
      tokenRatioAutoCalibrate: true,
      tokenRatioCalibrationThreshold: 0.1,
    });
    const result = calibrateRatio('zero-tokens-provider', 100, 0, DEFAULT_CHARS_PER_TOKEN);
    assert.equal(result.changed, false);
    assert.equal(result.newRatio, DEFAULT_CHARS_PER_TOKEN);
  });
});

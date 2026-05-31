import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import {
  ACTIVATE_PREFIX,
  WARMUP_CALL_ID_PREFIX,
  MAX_WARMUP_ROUNDS,
  DRIFT_NOTICE_START,
  DRIFT_NOTICE_END,
} from '../../../../src/bridge/utils/defines';

suite('bridge/utils/defines — constants', () => {
  test('ACTIVATE_PREFIX is "activate_"', () => {
    assert.equal(ACTIVATE_PREFIX, 'activate_');
  });

  test('WARMUP_CALL_ID_PREFIX starts with "copilot-adapter_preflight_activate_"', () => {
    assert.ok(
      WARMUP_CALL_ID_PREFIX.startsWith('copilot-adapter_preflight_activate_'),
      `Got: ${WARMUP_CALL_ID_PREFIX}`,
    );
  });

  test('MAX_WARMUP_ROUNDS is 3', () => {
    assert.equal(MAX_WARMUP_ROUNDS, 3);
  });

  test('DRIFT_NOTICE_START contains "copilot-adapter-tool-drift-notice-start"', () => {
    assert.ok(
      DRIFT_NOTICE_START.includes('copilot-adapter-tool-drift-notice-start'),
      `Got: ${DRIFT_NOTICE_START}`,
    );
  });

  test('DRIFT_NOTICE_END contains "copilot-adapter-tool-drift-notice-end"', () => {
    assert.ok(
      DRIFT_NOTICE_END.includes('copilot-adapter-tool-drift-notice-end'),
      `Got: ${DRIFT_NOTICE_END}`,
    );
  });
});

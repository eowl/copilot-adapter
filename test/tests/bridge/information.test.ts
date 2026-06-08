import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { buildChatInfo } from '../../../src/bridge/information';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { stub } from '../../helpers/stubs';
import type { ModelItem } from '../../../src/providers/types';

function makeTestModel(overrides: Partial<ModelItem> = {}): ModelItem {
  return {
    id: 'test-model',
    label: 'Test Model',
    apiId: 'test-model',
    family: 'test-family',
    version: '1',
    maxInputTokens: 1000,
    maxOutputTokens: 500,
    ability: { reasoning: true, acceptsImages: false, maxTools: 10 },
    detailKey: 'model.kimi-k2.5.detail',
    provider: DEEPSEEK,
    ...overrides,
  };
}

/** Stub t() to return the key itself so tests don't need NLS data. */
function stubNls(): () => void {
  return stub(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../../src/nls'),
    't',
    (key: string) => key,
  );
}

suite('bridge/information buildChatInfo', () => {
  let restoreNls: () => void;

  suiteSetup(() => {
    restoreNls = stubNls();
  });

  suiteTeardown(() => {
    restoreNls();
  });

  test('returns model id with provider suffix when idPrefix is empty', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true);

    assert.equal(info.id, 'test-model-deepseek');
    assert.equal(info.name, 'Test Model');
    assert.equal(info.family, 'test-family');
  });

  test('prefixes qualified model id with "PREFIX::" when idPrefix is non-empty', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true, false, '2');

    assert.equal(info.id, '2::test-model-deepseek');
  });

  test('prefixes qualified model id with group alias as prefix', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true, false, 'MyGroup');

    assert.equal(info.id, 'MyGroup::test-model-deepseek');
  });

  test('returns hasKey=true return no warning icon', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, true);

    assert.equal(info.statusIcon, undefined);
  });

  test('returns hasKey=false return warning icon', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, false);

    assert.ok(info.statusIcon instanceof vscode.ThemeIcon);
    assert.equal((info.statusIcon as vscode.ThemeIcon).id, 'warning');
  });

  test('hasKey=false return tooltip contains auth.noKeyTooltip', () => {
    const model = makeTestModel();
    const info = buildChatInfo(model, false);

    assert.ok(info.tooltip!.includes('auth.noKeyTooltip'));
  });

  test('visionProxy overrides imageInput capability', () => {
    const model = makeTestModel({ ability: { reasoning: true, acceptsImages: false } });
    const info = buildChatInfo(model, true, true); // hasVisionProxy = true

    assert.equal(info.capabilities!.imageInput, true);
  });

  test('passes through maxInputTokens and maxOutputTokens from model', () => {
    const model = makeTestModel({ maxInputTokens: 888, maxOutputTokens: 444 });
    const info = buildChatInfo(model, true);

    assert.equal(info.maxInputTokens, 888);
    assert.equal(info.maxOutputTokens, 444);
  });

  test('toolCalling passes through maxTools value from model ability', () => {
    const model = makeTestModel({ ability: { reasoning: true, acceptsImages: false, maxTools: 5 } });
    const info = buildChatInfo(model, true);

    assert.equal(info.capabilities!.toolCalling, 5);
  });

  test('multiple calls with same idPrefix produce distinct qualified ids for different models', () => {
    const modelA = makeTestModel({ id: 'model-a', label: 'Model A', family: 'family-a' });
    const modelB = makeTestModel({ id: 'model-b', label: 'Model B', family: 'family-b' });

    const infoA = buildChatInfo(modelA, true, false, '2');
    const infoB = buildChatInfo(modelB, true, false, '2');

    assert.equal(infoA.id, '2::model-a-deepseek');
    assert.equal(infoB.id, '2::model-b-deepseek');
    assert.notEqual(infoA.id, infoB.id);
  });

  test('idPrefix=empty string preserves qualified id without separator', () => {
    const model = makeTestModel({ id: 'some-model' });
    const info = buildChatInfo(model, true, false, '');

    assert.equal(info.id, 'some-model-deepseek');
    assert.ok(!info.id.includes('::'));
  });
});

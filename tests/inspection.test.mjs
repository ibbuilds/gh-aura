import test from 'node:test';
import assert from 'node:assert/strict';
import { describeReadme, inspectRepositories } from '../src/inspection.mjs';
import { configForTest, snapshotForTest } from './fixtures.mjs';

test('detects README structure without asserting source code quality', () => {
  const repo = snapshotForTest().repos[0];
  const response = {
    encoding: 'base64',
    content: Buffer.from('# Tool\n\n## Installation\nnpm install\n\n## Usage\nRun tool.\n').toString('base64'),
    html_url: 'https://github.com/example/backend-toolkit/blob/main/README.md',
  };
  const result = describeReadme(response, repo);
  assert.equal(result.state, 'available');
  assert.equal(result.features.installation, true);
  assert.equal(result.features.usage, true);
  assert.equal(result.features.testing, false);
});

test('missing README and uninspected repos are distinct states', async () => {
  const snapshot = snapshotForTest();
  const saved = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    headers: new Headers(),
  });
  try {
    const result = await inspectRepositories(snapshot, configForTest(), 1);
    const inspected = result.repos.filter((repo) => repo.inspection);
    assert.equal(inspected.length, 1);
    assert.equal(inspected[0].inspection.state, 'missing');
    assert.equal(result.repos.filter((repo) => !repo.inspection).length, 2);
  } finally { globalThis.fetch = saved; }
});

test('rejects excessive inspection budgets', async () => {
  await assert.rejects(inspectRepositories(snapshotForTest(), configForTest(), 100), /between 0 and 20/);
});

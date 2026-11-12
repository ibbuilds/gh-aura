import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRepositoryTree, inspectProjectEvidence } from '../src/project-evidence.mjs';
import { rankRepositories } from '../src/engine.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { snapshotForTest } from './fixtures.mjs';

const config = () => structuredClone(DEFAULT_CONFIG);
const tree = {
  truncated: false,
  tree: [
    { path: 'src/core.ts', type: 'blob' },
    { path: 'src/__tests__/core.test.ts', type: 'blob' },
    { path: '.github/workflows/ci.yml', type: 'blob' },
    { path: 'package.json', type: 'blob' },
    { path: 'docs/ARCHITECTURE.md', type: 'blob' },
    { path: 'examples/basic.ts', type: 'blob' },
    { path: 'LICENSE', type: 'blob' },
  ],
};

test('tree inspection recognizes verifiable FILE PRESENCE, not execution or code quality', () => {
  const repo = { full_name: 'example/backend-toolkit', default_branch: 'main', private: false };
  const result = classifyRepositoryTree(repo, tree, '2026-11-11T00:00:00Z');
  assert.equal(result.state, 'available');
  for (const kind of ['tests', 'ci', 'manifest', 'architecture', 'examples', 'license']) {
    assert.equal(result.categories[kind].status, 'observed', kind);
    assert.ok(result.categories[kind].sources[0].startsWith('https://github.com/example/backend-toolkit/blob/main/'));
  }
  assert.match(result.note, /not proof/i);
  assert.equal('passingTests' in result, false);
});

test('truncated Git trees report absent file types as unknown, not missing', () => {
  const repo = { full_name: 'example/repo', default_branch: 'main' };
  const result = classifyRepositoryTree(repo, { tree: [{ path: 'package.json', type: 'blob' }], truncated: true });
  assert.equal(result.state, 'partial');
  assert.equal(result.categories.tests.status, 'unknown');
  assert.equal(result.categories.ci.status, 'unknown');
  assert.equal(result.categories.manifest.status, 'observed');
});

test('deep CLI scan inspects the user-selected repo first with one public tree GET', async () => {
  const snapshot = snapshotForTest();
  snapshot.repos.forEach((repo) => { repo.default_branch = 'main'; });
  const selected = config();
  selected.profile.featured = ['quiet-scripting'];
  let calls = 0, requested = '';
  await inspectProjectEvidence(snapshot, selected, 1, {
    token: '', fetch: async (url, init) => {
      calls++; requested = url;
      assert.equal(init.method, undefined);
      return Response.json(tree);
    },
  });
  assert.equal(calls, 1);
  assert.match(requested, /\/repos\/example\/quiet-scripting\/git\/trees\/main\?recursive=1/);
  assert.equal(snapshot.repos[2].evidence.state, 'available');
  assert.equal(snapshot.repos[0].evidence, undefined);
});

test('source evidence improves explainable relative ranking but never certifies the author', () => {
  const snapshot = snapshotForTest();
  const cfg = config();
  const before = rankRepositories(snapshot, cfg);
  const item = snapshot.repos.find((repo) => repo.name === 'backend-toolkit');
  item.evidence = classifyRepositoryTree({ ...item, default_branch: 'main' }, tree);
  const after = rankRepositories(snapshot, cfg);
  const scored = after.find((entry) => entry.repo.name === 'backend-toolkit');
  assert.ok(scored.score >= before.find((entry) => entry.repo.name === 'backend-toolkit').score);
  assert.ok(scored.reasons.some((reason) => reason.includes('CI workflow')));
  assert.ok(scored.limitations.some((limit) => limit.includes('authorship')));
});

test('deep inspection validates budget and preserves privacy when metadata is inaccessible', async () => {
  await assert.rejects(inspectProjectEvidence(snapshotForTest(), config(), 6), /between 0 and 5/);
  const snapshot = snapshotForTest();
  snapshot.repos[0].default_branch = 'main';
  snapshot.repos[0].private = true;
  const selected = config();
  selected.profile.featured = ['backend-toolkit'];
  let calls = 0;
  await inspectProjectEvidence(snapshot, selected, 1, {
    token: '', fetch: async () => { calls++; throw Error('Should not download'); },
  });
  assert.equal(calls, 0);
  assert.equal(snapshot.repos[0].evidence.state, 'unknown');
});

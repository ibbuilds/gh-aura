import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRepositoryTree, inspectProjectEvidence } from '../src/project-evidence.mjs';
import { rankRepositories } from '../src/engine.mjs';
import { getJSON } from '../src/github.mjs';
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


test('optional --checks reads the latest Actions result and release with two extra public requests', async () => {
  const snapshot = snapshotForTest();
  const cfg = config();
  cfg.profile.featured = ['backend-toolkit'];
  snapshot.repos[0].default_branch = 'main';
  const urls = [];
  const fetch = async (url) => {
    urls.push(url);
    if (url.includes('/git/trees/')) return Response.json(tree);
    if (url.includes('/actions/runs?')) return Response.json({ total_count: 1, workflow_runs: [{
      status: 'completed', conclusion: 'success', head_sha: 'a'.repeat(40),
      created_at: '2026-11-10T00:00:00Z',
      html_url: 'https://github.com/example/backend-toolkit/actions/runs/123',
    }] });
    if (url.includes('/releases?')) return Response.json([{
      draft: false, tag_name: 'v1.0.0', published_at: '2026-11-09T00:00:00Z',
      html_url: 'https://github.com/example/backend-toolkit/releases/tag/v1.0.0',
    }]);
    throw Error('Unexpected URL: ' + url);
  };
  await inspectProjectEvidence(snapshot, cfg, 1, {
    token: '', verifyChecks: true, fetch,
  });
  assert.equal(urls.length, 3);
  const evidence = snapshot.repos[0].evidence;
  assert.equal(evidence.verifiedSignals.latestActionsRun.status, 'success');
  assert.equal(evidence.verifiedSignals.latestPublishedRelease.status, 'observed');
  assert.match(evidence.verifiedSignals.note, /not proof/i);
  assert.match(evidence.verifiedSignals.latestActionsRun.source, /actions\/runs\/123/);
  assert.match(evidence.verifiedSignals.latestPublishedRelease.source, /releases\/tag\/v1\.0\.0/);
});

test('missing GitHub Actions/release records do not imply failed tests or no deploys', async () => {
  const snapshot = snapshotForTest(), cfg = config();
  cfg.profile.featured = ['backend-toolkit'];
  snapshot.repos[0].default_branch = 'main';
  const fetch = async (url) => {
    if (url.includes('/git/trees/')) return Response.json(tree);
    if (url.includes('/actions/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
    if (url.includes('/releases?')) return Response.json([]);
    throw Error('Unexpected URL');
  };
  await inspectProjectEvidence(snapshot, cfg, 1, { token: '', verifyChecks: true, fetch });
  const observed = snapshot.repos[0].evidence.verifiedSignals;
  assert.equal(observed.latestActionsRun.status, 'no-actions-run-observed');
  assert.equal(observed.latestPublishedRelease.status, 'not-observed');
  assert.equal(snapshot.repos[0].evidence.state, 'available');
});


test('authenticated public Actions inspection rejects a repository that became private', async () => {
  const calls = [];
  await assert.rejects(getJSON('/repos/example/backend-toolkit/actions/runs?branch=main&per_page=1', {
    token: 'restricted-test-token', publicRead: true,
    fetch: async (url) => {
      calls.push(url);
      return Response.json({
        full_name: 'example/backend-toolkit', private: true, default_branch: 'main',
      });
    },
  }), /not publicly readable/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], 'https://api.github.com/repos/example/backend-toolkit');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { prepareAchievementTask, renderAchievementTask, validateRepositoryName } from '../src/achievement-actions.mjs';

test('public achievement preparation links real issues without posting anything', async () => {
  const calls = [];
  const report = await prepareAchievementTask('pull-shark', 'example/tool', {
    token: '', fetch: async (url, options) => {
      calls.push({ url, method: options.method || 'GET' });
      if (url.includes('/issues?')) return Response.json([
        { number: 12, title: 'Fix pagination when page is empty', html_url: 'https://github.com/example/tool/issues/12', labels: [{ name: 'bug' }] },
        { number: 13, title: 'PR masquerading as issue', html_url: 'https://github.com/example/tool/issues/13', pull_request: {} },
      ]);
      return Response.json({ full_name: 'example/tool', private: false, archived: false, has_issues: true });
    },
  });
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.method === 'GET'));
  assert.equal(report.writesPerformed, 0);
  assert.equal(report.awardsGranted, 0);
  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0].title, /pagination/);
  assert.match(renderAchievementTask(report), /not guaranteed/);
});

test('private repo preparation creates a local checklist without any remote reads', async () => {
  const plan = await prepareAchievementTask('pair-extraordinaire', 'example/private-work', {
    private: true, fetch: async () => { throw Error('No network allowed'); },
  });
  assert.equal(plan.reviewMode, 'private-local-no-repository-requests');
  assert.equal(plan.verifiedPublicRepository, null);
  assert.equal(plan.issues.length, 0);
  assert.equal(plan.writesPerformed, 0);
  assert.match(plan.tasks.join(' '), /real second engineer/);
});

test('unsafe/paid/historical badge preparation is refused', async () => {
  for (const id of ['yolo', 'quickdraw', 'public-sponsor', 'arctic-code-vault', 'mars-2020']) {
    await assert.rejects(prepareAchievementTask(id, 'example/tool', { private: true }), /No safe preparation workflow/);
  }
  await assert.rejects(prepareAchievementTask('made-up', 'example/tool'), /Unknown achievement/);
});

test('repo names are validated before any URL construction', () => {
  assert.equal(validateRepositoryName('example/tool'), 'example/tool');
  for (const name of ['../secret', 'foo/../bar', 'foo/tool.git', 'foo', 'https://github.com/foo/bar', 'foo/with spaces']) {
    assert.throws(() => validateRepositoryName(name), /--repo/);
  }
});

test('CLI can prepare a private local task without a configured GitHub account or token', () => {
  const result = spawnSync(process.execPath,
    ['src/cli.mjs', 'achievements', '--prepare', 'pull-shark', '--repo', 'example/private-work', '--private', '--json'],
    { encoding: 'utf8', timeout: 10000, env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' } });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.writesPerformed, 0);
  assert.equal(data.reviewMode, 'private-local-no-repository-requests');
  assert.ok(data.tasks.length > 0);
});

test('CLI rejects ambiguous/unintended achievement operations before network', () => {
  const result = spawnSync(process.execPath,
    ['src/cli.mjs', 'achievements', '--prepare', 'pull-shark'],
    { encoding: 'utf8', timeout: 10000 });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires an explicit --repo/);
});

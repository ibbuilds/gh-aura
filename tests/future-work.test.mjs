import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { futureWorkPlan, contributionsReport, renderContributions } from '../src/contributions.mjs';
import { snapshotForTest } from './fixtures.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

const now = new Date('2026-11-11T12:00:00Z');

test('future work suggestions are attached to real public owned repos, not fabricated activity', () => {
  const snapshot = snapshotForTest();
  const plan = futureWorkPlan(snapshot, now);
  assert.equal(plan.createdAt, now.toISOString());
  assert.equal(plan.status, 'user-verification-required');
  assert.ok(plan.tasks.length > 0);
  assert.ok(plan.tasks.every((task) => task.source.startsWith('https://github.com/example/')));
  assert.ok(plan.tasks.every((task) => task.approval.includes('User must inspect')));
  assert.ok(plan.tasks.every((task) => task.contributionCount === 'unknown-until-github-accepts-actual-work'));
  assert.ok(plan.tasks.every((task) => !task.repository.includes('old-popular-fork')));
  assert.doesNotMatch(JSON.stringify(plan), /commitDate|backdate|scheduledCommits/);
});

test('no public owned projects produces guidance, not invented issues', () => {
  const snapshot = snapshotForTest();
  snapshot.repos = [];
  const plan = futureWorkPlan(snapshot, now);
  assert.equal(plan.selected, 0);
  assert.deepEqual(plan.tasks, []);
  assert.match(plan.limitations.join(' '), /No calendars are painted/);
});

test('contributions --plan works without auth or additional network calls', async () => {
  const snapshot = snapshotForTest();
  snapshot.user.created_at = '2020-06-01T00:00:00Z';
  let calls = 0;
  const report = await contributionsReport(snapshot, {
    now, token: '', plan: true, fetch: async () => { calls++; throw new Error('NETWORK_FORBIDDEN'); },
  });
  assert.equal(calls, 0);
  assert.equal(report.status, 'authentication_required');
  assert.ok(report.futureWorkPlan.tasks.length > 0);
  assert.match(renderContributions(report), /Future meaningful work candidates/);
  assert.doesNotMatch(renderContributions(report), /automatically created a contribution/i);
});

test('contributions CLI accepts plan flag while unrelated commands reject it', () => {
  validateOptions('contributions', parseArgs(['--plan']));
  assert.throws(() => validateOptions('profile', parseArgs(['--plan'])), /not supported/);
  assert.throws(() => validateOptions('audit', parseArgs(['--plan'])), /not supported/);
});

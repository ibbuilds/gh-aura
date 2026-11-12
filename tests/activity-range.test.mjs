import test from 'node:test';
import assert from 'node:assert/strict';
import { historyWindows, contributionsReport } from '../src/contributions.mjs';
import { snapshotForTest } from './fixtures.mjs';

const now = new Date('2026-11-11T12:00:00Z');
const collection = {
  totalCommitContributions: 2, totalIssueContributions: 1, totalPullRequestContributions: 1,
  totalPullRequestReviewContributions: 0, totalRepositoryContributions: 0,
  restrictedContributionsCount: 2,
  contributionCalendar: {
    totalContributions: 4,
    weeks: [{ contributionDays: [
      { date: '2026-01-02', contributionCount: 4 },
      { date: '2026-01-03', contributionCount: 0 },
    ] }],
  },
};

test('requested UTC date interval splits by year and respects account creation', () => {
  const windows = historyWindows('2020-06-15T12:00:00Z',
    { from: '2020-01-01', to: '2021-02-01', now });
  assert.equal(windows.length, 2);
  assert.equal(windows[0].from, '2020-06-15T00:00:00.000Z');
  assert.equal(windows[0].to, '2020-12-31T23:59:59.000Z');
  assert.equal(windows[1].from, '2021-01-01T00:00:00.000Z');
  assert.equal(windows[1].to, '2021-02-01T23:59:59.999Z');
  assert.deepEqual(historyWindows('2020-06-15', { from: '2025', to: '2025', now })
    .map((x) => x.year), [2025]);
});

test('invalid/out-of-account ranges and mixed flags are rejected locally', () => {
  assert.throws(() => historyWindows('2020-01-01', { from: '2020-02-30', now }), /valid calendar date/);
  assert.throws(() => historyWindows('2020-01-01', { to: '2027', now }), /outside|empty/);
  assert.throws(() => historyWindows('2020-01-01', { from: '2026-11-12', now }), /outside|empty/);
  assert.throws(() => historyWindows('2020-01-01', { from: '2024', all: true, now }), /not both/);
  assert.throws(() => historyWindows('2020-01-01', { from: '2024', year: 2024, now }), /not both/);
});

test('five calendar-year windows batch into two authenticated read-only GraphQL calls', async () => {
  const snapshot = snapshotForTest();
  snapshot.user.created_at = '2020-01-01T00:00:00Z';
  let calls = 0;
  const report = await contributionsReport(snapshot, {
    token: 'test-token', now, from: '2020', to: '2024',
    fetch: async (_url, options) => {
      calls++;
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.doesNotMatch(body.query, /mutation/i);
      assert.ok(body.query.includes('contributionsCollection'));
      const data = {};
      if (body.query.includes('ProfileHistoryBatch')) {
        for (let i = 0; i < 4; i++) {
          if (Object.hasOwn(body.variables, 'from' + i)) data['y' + i] = collection;
        }
      } else data.contributionsCollection = collection;
      return Response.json({ data: { user: data } });
    },
  });
  assert.equal(calls, 2);
  assert.equal(report.years.length, 5);
  assert.equal(report.years[4].year, 2024);
  assert.ok(report.years.every((item) => item.restricted === 2));
  assert.equal(report.interval.timezone, 'UTC');
});

test('days and private activity are reported only as GitHub-visible anonymized counts', async () => {
  const snapshot = snapshotForTest();
  snapshot.user.created_at = '2020-01-01';
  const report = await contributionsReport(snapshot, {
    token: 'test-token', now, year: 2026, days: true, private: true, recover: true,
    fetch: async () => Response.json({ data: { user: { contributionsCollection: collection } } }),
  });
  assert.deepEqual(report.years[0].days, [
    { date: '2026-01-02', count: 4 }, { date: '2026-01-03', count: 0 },
  ]);
  assert.equal(report.privateVisibility.enabledByCLI, false);
  assert.ok(report.recoveryPlan.every((item) => item.status === 'manual'));
  assert.ok(report.recoveryPlan.some((item) => item.command?.includes('git log --all')));
  assert.doesNotMatch(JSON.stringify(report), /private-repo\/secret|privateRepoNames|authorEmail/);
});

test('unauthenticated user gets no invented historical counts', async () => {
  const snapshot = snapshotForTest();
  snapshot.user.created_at = '2020-01-01T00:00:00Z';
  const report = await contributionsReport(snapshot, {
    token: '', now, from: '2020', to: '2026-11-11', private: true, recover: true,
    fetch: async () => { throw Error('No API request allowed'); },
  });
  assert.equal(report.status, 'authentication_required');
  assert.deepEqual(report.years, []);
  assert.ok(report.interval.from?.startsWith('2020'));
  assert.equal(report.privateVisibility.status, 'manual-account-setting');
});

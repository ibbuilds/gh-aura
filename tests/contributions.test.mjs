import test from 'node:test';
import assert from 'node:assert/strict';
import { historyYears, summarizeYear, contributionsReport } from '../src/contributions.mjs';
import { snapshotForTest } from './fixtures.mjs';

const now = new Date('2026-11-11T12:00:00Z');
const collection = {
  totalCommitContributions: 2, totalIssueContributions: 1, totalPullRequestContributions: 1,
  totalPullRequestReviewContributions: 0, totalRepositoryContributions: 0, restrictedContributionsCount: 0,
  contributionCalendar: { totalContributions: 4, weeks: [{ contributionDays: [
    { date: '2026-01-01', contributionCount: 0 }, { date: '2026-01-02', contributionCount: 4 },
  ] }] },
};

test('year ranges include account creation and reject future/invalid ranges', () => {
  assert.deepEqual(historyYears('2020-06-01', { now, all: true }), [2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  assert.deepEqual(historyYears('2020-06-01', { now }), [2026]);
  assert.throws(() => historyYears('2020-06-01', { now, year: 2019 }), /between/);
  assert.throws(() => historyYears('2020-06-01', { now, year: 2027 }), /between/);
  assert.throws(() => historyYears('bad', { now }), /invalid/);
  assert.throws(() => historyYears('2020-06-01', { now, all: true, year: 2025 }), /not both/);
});

test('summary reflects actual observed counts without filling inactive dates', () => {
  const year = summarizeYear(2026, collection);
  assert.equal(year.activeDays, 1); assert.equal(year.total, 4);
  assert.equal(year.firstVisibleDay, '2026-01-02');
  assert.throws(() => summarizeYear(2026, {}), /incomplete/);
});

test('without authentication history remains unknown, not fabricated', async () => {
  const snapshot = snapshotForTest(); snapshot.user.created_at = '2020-06-01T00:00:00Z';
  const report = await contributionsReport(snapshot, { token: '', now, fetch: async () => { throw new Error('Must not call'); } });
  assert.equal(report.status, 'authentication_required'); assert.deepEqual(report.years, []);
  assert.equal(report.milestones[0].event, 'GitHub account created');
});

test('authenticated report uses read-only GraphQL with bounded annual windows', async () => {
  const snapshot = snapshotForTest(); snapshot.user.created_at = '2020-06-01T00:00:00Z';
  const report = await contributionsReport(snapshot, { token: 'test', now, year: 2026,
    fetch: async (_url, options) => {
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.doesNotMatch(body.query, /mutation/);
      assert.equal(body.variables.from, '2026-01-01T00:00:00.000Z');
      assert.equal(body.variables.to, now.toISOString());
      return Response.json({ data: { user: { contributionsCollection: collection } } });
    },
  });
  assert.equal(report.years[0].total, 4);
});

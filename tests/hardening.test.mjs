import test from 'node:test';
import assert from 'node:assert/strict';
import { configForTest, snapshotForTest } from './fixtures.mjs';
import { rankRepositories, selectFeatured } from '../src/engine.mjs';
import { validateConfig } from '../src/config.mjs';
import { renderProfile } from '../src/render.mjs';
import { achievementReport } from '../src/achievements.mjs';
import { httpsUrl, md, plain } from '../src/text.mjs';

test('explicit selection is exact, deduplicated and respects full-name exclusions', () => {
  const config = configForTest(), snapshot = snapshotForTest();
  config.profile.featured = ['backend-toolkit', 'example/backend-toolkit', 'quiet-scripting'];
  config.profile.excluded = ['example/quiet-scripting'];
  assert.deepEqual(selectFeatured(snapshot, config).map((repo) => repo.name), ['backend-toolkit']);
  config.profile.featured = ['does-not-exist'];
  assert.throws(() => selectFeatured(snapshot, config), /not found/);
});

test('ranking is reproducible and bounded even with explicit preferences', () => {
  const config = configForTest(), snapshot = snapshotForTest();
  config.showcase.preferred = ['backend-toolkit'];
  assert.deepEqual(rankRepositories(snapshot, config), rankRepositories(snapshot, config));
  assert.ok(rankRepositories(snapshot, config).every((entry) => entry.score >= 0 && entry.score <= 100));
});

test('unknown README evidence is not treated as a missing file', () => {
  const config = configForTest(), snapshot = snapshotForTest();
  const initial = rankRepositories(snapshot, config)[0];
  snapshot.repos[0].inspection = { state: 'unknown', features: {} };
  assert.equal(rankRepositories(snapshot, config)[0].factors.presentation, initial.factors.presentation);
});

test('profile settings allow no projects, explicit location and hidden metrics', () => {
  const config = configForTest(); config.profile.maxProjects = 0;
  config.profile.location = 'Remote'; config.profile.sections.stats = false;
  validateConfig(config);
  const result = renderProfile(snapshotForTest(), config, 'flashy');
  assert.match(result, /Remote/); assert.doesNotMatch(result, /snapshot|Featured work/);
});

test('URL validation rejects unsafe schemes, credentials and broken Markdown targets', () => {
  assert.equal(httpsUrl('javascript:alert(1)'), null);
  assert.equal(httpsUrl('https://secret:password@example.com'), null);
  assert.equal(httpsUrl('https://example.com/a b'), null);
  assert.equal(httpsUrl('https://example.com/a(b)'), 'https://example.com/a%28b%29');
  assert.doesNotMatch(md('[click](bad)\n<script>'), /<script>/);
  assert.equal(plain('\u001b[2J'), '[2J');
});

test('unknown config keys and terminal controls are rejected', () => {
  const config = configForTest(); config.profile.unusedOption = true;
  assert.throws(() => validateConfig(config), /Unknown configuration key/);
  delete config.profile.unusedOption; config.profile.name = '\u001b[2J';
  assert.throws(() => validateConfig(config), /control characters/);
});

test('achievement status distinguishes self-reports, historical awards and paid preferences', async () => {
  const config = configForTest(); config.achievements.earned = ['pull-shark'];
  config.achievements.excluded = ['yolo'];
  const report = await achievementReport(null, config);
  assert.equal(report.catalog.find((item) => item.id === 'pull-shark').status, 'self-reported-earned');
  assert.equal(report.catalog.find((item) => item.id === 'mars-2020').status, 'unavailable');
  assert.equal(report.catalog.find((item) => item.id === 'pro').status, 'disabled-by-preference');
  assert.equal(report.catalog.some((item) => item.id === 'yolo'), false);
  config.achievements.earned = ['invented'];
  await assert.rejects(achievementReport(null, config), /Unknown achievement/);
});

test('public merged PR counts are evidence, never automatic award claims', async () => {
  const report = await achievementReport(snapshotForTest(), configForTest(), { token: '', fetch: async (url) => {
    assert.match(decodeURIComponent(url), /is:public/);
    return Response.json({ total_count: 5, incomplete_results: false });
  } });
  const entry = report.catalog.find((item) => item.id === 'pull-shark');
  assert.equal(entry.evidence.observedPublicMergedPRs, 5);
  assert.equal(entry.status, 'opportunity-unverified');
});

// Real GitHub integration: only public reads and a read-only GraphQL query. Never publish here.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSnapshot } from '../src/github.mjs';
import { ReadCache } from '../src/cache.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { inspectRepositories } from '../src/inspection.mjs';
import { auditProfile } from '../src/engine.mjs';
import { renderProfile, preserveProfile } from '../src/render.mjs';
import { profileTarget, previewProfile } from '../src/workflow.mjs';
import { contributionsReport } from '../src/contributions.mjs';
import { achievementReport } from '../src/achievements.mjs';

const username = process.argv[2] || 'ibbuilds';
const directory = mkdtempSync(join(tmpdir(), 'gh-aura-live-'));
try {
  const config = structuredClone(DEFAULT_CONFIG);
  const cache = new ReadCache({ directory });
  let calls = 0;
  const read = { cache, maxRepos: 100, fetch: (...args) => { calls++; return fetch(...args); } };
  const snapshot = await getSnapshot(username, read);
  assert.equal(snapshot.username.toLowerCase(), username.toLowerCase());
  assert.ok(snapshot.repos.every((repo) => repo.private === false));
  assert.equal(new Set(snapshot.repos.map((repo) => repo.full_name)).size, snapshot.repos.length);
  const firstReadCount = calls;
  await getSnapshot(username, read);
  assert.equal(calls, firstReadCount, 'An immediate repeated snapshot must not hit GitHub again.');
  await inspectRepositories(snapshot, config, 3, read);
  const report = auditProfile(snapshot, config);
  assert.ok(report.findings.every((item) => item.source && item.action && item.confidence));
  for (const style of ['minimal', 'regular', 'flashy']) {
    const draft = renderProfile(snapshot, config, style);
    assert.ok(draft.trim().length > 0);
  }
  const target = await profileTarget(username);
  const draft = preserveProfile(target.content, renderProfile(snapshot, config));
  assert.match(previewProfile(target, draft), /Nothing has been published/);
  const achievements = await achievementReport(snapshot, config, read);
  assert.equal(achievements.user, snapshot.username);
  const history = await contributionsReport(snapshot, { ...read, details: true });
  assert.equal(history.status, 'observed');
  assert.equal(history.years.length, 1);
  assert.ok(history.detailCoverage.repositories.length <= 3);
  console.log(JSON.stringify({ checked: 'public audit, 3 styles, managed draft, preview, opportunities, contribution history',
    immediateRepeatRequests: 0, cache: cache.summary(), writes: 0 }, null, 2));
} finally { rmSync(directory, { recursive: true, force: true }); }

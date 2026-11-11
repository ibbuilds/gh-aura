// Explicit read-only integration test. Never import or invoke applyProfile here.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { getSnapshot } from '../src/github.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { inspectRepositories } from '../src/inspection.mjs';
import { auditProfile } from '../src/engine.mjs';
import { renderProfile } from '../src/render.mjs';
import { profileTarget, previewProfile } from '../src/workflow.mjs';
import { contributionsReport } from '../src/contributions.mjs';
import { achievementReport } from '../src/achievements.mjs';

const username = process.argv[2] || 'ibbuilds';
const config = structuredClone(DEFAULT_CONFIG);
const snapshot = await getSnapshot(username, { maxRepos: 100 });
assert.equal(snapshot.username.toLowerCase(), username.toLowerCase());
assert.ok(snapshot.repos.every((repo) => repo.private === false));
assert.equal(new Set(snapshot.repos.map((repo) => repo.full_name)).size, snapshot.repos.length);
await inspectRepositories(snapshot, config, 3);
const report = auditProfile(snapshot, config);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/live-audit.json', JSON.stringify(report, null, 2));
for (const style of ['minimal', 'regular', 'flashy']) {
  const draft = renderProfile(snapshot, config, style);
  assert.ok(draft.trim().length > 0);
  writeFileSync('dist/profile-' + style + '.md', draft);
}
const target = await profileTarget(username);
assert.match(previewProfile(target, renderProfile(snapshot, config)), /Nothing has been published/);
const achievements = await achievementReport(snapshot, config);
assert.equal(achievements.user, snapshot.username);
writeFileSync('dist/live-achievements.json', JSON.stringify(achievements, null, 2));
const history = await contributionsReport(snapshot);
assert.equal(history.status, 'observed');
assert.equal(history.years.length, 1);
writeFileSync('dist/live-contributions.json', JSON.stringify(history, null, 2));
console.log('Live public audit, three styles, preview, achievement evidence and contribution history passed. No remote writes.');

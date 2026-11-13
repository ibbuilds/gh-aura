// Real GitHub integration: public reads only. Never publish here.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSnapshot } from '../src/github.mjs';
import { ReadCache } from '../src/cache.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { inspectRepositories } from '../src/inspection.mjs';
import { auditProfile } from '../src/engine.mjs';
import { hiringReview } from '../src/readiness.mjs';
import { renderProfile, preserveProfile } from '../src/render.mjs';
import { profileTarget, previewProfile } from '../src/workflow.mjs';
import { contributionsReport } from '../src/contributions.mjs';
import { achievementReport } from '../src/achievements.mjs';
import { checkProfileResources } from '../src/profile-resources.mjs';
import { projectImprovements } from '../src/project-improvements.mjs';

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
  const recruiter = hiringReview(snapshot, { ...config, editorial: { ...config.editorial, targetRole: 'Backend engineer' } });
  assert.equal(recruiter.targetRole, 'Backend engineer');
  assert.ok(recruiter.checks.every((item) => item.source && item.action && item.state));
  assert.equal(recruiter.purpose.includes('NOT a hiring probability'), true);
  for (const style of ['minimal', 'regular', 'flashy']) assert.ok(renderProfile(snapshot, config, style).trim().length > 0);
  const target = await profileTarget(username);
  const draft = preserveProfile(target.content, renderProfile(snapshot, config));
  assert.match(previewProfile(target, draft), /Nothing has been published/);
  assert.equal((await achievementReport(snapshot, config, read)).user, snapshot.username);
  const history = await contributionsReport(snapshot, { ...read, details: true });
  assert.equal(history.status, 'observed');
  assert.equal(history.years.length, 1);
  assert.ok(history.detailCoverage.repositories.length <= 3);
  // Exercise the actual refactored CLI and bounded transport, not only the library functions.
  const profile = spawnSync(process.execPath, ['src/cli.mjs', 'profile', username, '--visual', '20', '--fresh', '--stats', '--budget', '5'], { encoding: 'utf8', timeout: 60000 });
  assert.equal(profile.status, 0, profile.stderr);
  const statsLine = profile.stderr.split('\n').find((line) => line.startsWith('GH Aura usage: '));
  assert.ok(statsLine);
  const cliUsage = JSON.parse(statsLine.slice('GH Aura usage: '.length));
  assert.ok(cliUsage.networkRequests <= 3, 'Plain draft generation should not fetch the existing profile README.');
  const prompt = spawnSync(process.execPath, ['src/cli.mjs', 'brief', username, '--prompt', '--fresh', '--budget', '10'], { encoding: 'utf8', timeout: 60000 });
  assert.equal(prompt.status, 0, prompt.stderr);
  assert.match(prompt.stdout, /BEGIN UNTRUSTED EDITORIAL DATA/);
  assert.ok(Buffer.byteLength(prompt.stdout) < 16000);
  const resources=await checkProfileResources('[Repository](https://github.com/ibbuilds/gh-aura)\n[License](https://raw.githubusercontent.com/ibbuilds/gh-aura/main/LICENSE)');
  assert.equal(resources.state,'checked');assert.equal(resources.networkRequests,2);
  const project=await projectImprovements('ibbuilds/gh-aura');
  assert.equal(project.readOnly,true);assert.equal(project.writesPerformed,0);assert.ok(project.readme.sha);assert.ok(project.readme.content.length<=8000);
  console.log(JSON.stringify({ checked: 'public audit, 3 styles, managed draft, preview, opportunities, contribution history, bounded CLI reads and editorial prompt',
    immediateRepeatRequests: 0, cliUsage,resourceChecks:resources.results.map(x=>({status:x.status,state:x.state})), cache: cache.summary(), writes: 0 }, null, 2));
} finally { rmSync(directory, { recursive: true, force: true }); }

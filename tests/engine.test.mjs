import test from 'node:test';
import assert from 'node:assert/strict';
import { auditProfile, rankRepositories } from '../src/engine.mjs';
import { renderProfile } from '../src/render.mjs';
import { configForTest, snapshotForTest } from './fixtures.mjs';

test('a relevant zero-star project outranks an irrelevant popular fork', () => {
  const config = configForTest();
  config.showcase.goal = 'backend';
  const result = rankRepositories(snapshotForTest(), config, { now: Date.parse('2026-11-11') });
  assert.equal(result[0].repo.name, 'backend-toolkit');
  assert.ok(result.find((entry) => entry.repo.name === 'old-popular-fork'));
});
test('a fork with an owner-supplied contribution and proof is considered without claiming verified authorship',()=>{
  const snapshot=snapshotForTest(),config=configForTest(),fork=snapshot.repos.find(r=>r.fork);
  const before=rankRepositories(snapshot,config).find(x=>x.repo.full_name===fork.full_name).score;
  config.profile.projectStories=[{repo:fork.full_name,contribution:'Implemented the documented fix',proof:'https://github.com/example/project/pull/1'}];
  const after=rankRepositories(snapshot,config).find(x=>x.repo.full_name===fork.full_name);
  assert.ok(after.score>before);assert.ok(after.reasons.some(x=>x.includes('not independently verified')));
});

test('respects excludes and manually selected featured projects', () => {
  const config = configForTest();
  config.profile.excluded = ['example/quiet-scripting'];
  config.profile.featured = ['backend-toolkit'];
  const markdown = renderProfile(snapshotForTest(), config);
  assert.match(markdown, /backend-toolkit/);
  assert.doesNotMatch(markdown, /quiet-scripting/);
});

test('minimal README has no badges, flashy README has badges, regular has structured project table', () => {
  const snapshot = snapshotForTest();
  const config = configForTest();
  config.profile.headline = 'Backend systems and developer tools';
  const minimal = renderProfile(snapshot, config, 'minimal');
  const regular = renderProfile(snapshot, config, 'regular');
  const flashy = renderProfile(snapshot, config, 'flashy');
  assert.match(minimal, /# Example Developer/);
  assert.doesNotMatch(minimal, /shields.io/);
  assert.match(regular, /\| Project \| Description \|/);
  assert.match(flashy, /img.shields.io/);
  assert.match(flashy, /backend-toolkit/);
});

test('section toggles can suppress projects and any additional sections', () => {
  const config = configForTest();
  config.profile.sections.projects = false;
  config.profile.extras = [{ title: 'Now', body: 'Maintaining real projects.' }];
  const output = renderProfile(snapshotForTest(), config, 'minimal');
  assert.doesNotMatch(output, /Selected work/);
  assert.match(output, /Maintaining real projects/);
});

test('inspected README absence produces evidence-backed guidance', () => {
  const config = configForTest();
  const snapshot = snapshotForTest();
  snapshot.repos[0].inspection = { state: 'missing', url: 'https://github.com/example/backend-toolkit', features: {} };
  const report = auditProfile(snapshot, config);
  assert.equal(report.repositoryReadmesInspected, 1);
  assert.ok(report.findings.some((finding) => finding.title.includes('Showcase candidate lacks a README')));
});

test('audit identifies sparse README and repository metadata without rewriting history', () => {
  const report = auditProfile(snapshotForTest(), configForTest());
  assert.ok(report.findings.some((finding) => finding.title === 'Profile presentation without a README' && finding.severity === 'info'));
  assert.ok(!report.findings.some(finding=>finding.action.startsWith('Create a public')));
  assert.ok(report.findings.some((finding) => finding.title === 'Repositories without descriptions'));
  assert.equal(report.publicRepositoriesScanned, 3);
  assert.match(report.caveat, /Does not inspect repository source code/);
});

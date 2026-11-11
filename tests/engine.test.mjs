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

test('audit identifies sparse README and repository metadata without rewriting history', () => {
  const report = auditProfile(snapshotForTest(), configForTest());
  assert.ok(report.findings.some((finding) => finding.title === 'No profile README'));
  assert.ok(report.findings.some((finding) => finding.title === 'Repositories without descriptions'));
  assert.equal(report.publicRepositoriesScanned, 3);
  assert.match(report.caveat, /Does not inspect repository source code/);
});

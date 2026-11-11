import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { hiringReview, renderHiringReview } from '../src/readiness.mjs';
import { snapshotForTest } from './fixtures.mjs';

const find = (report, id) => {
  const item = report.checks.find((check) => check.id === id);
  assert.ok(item, 'Expected ' + id + ' check');
  return item;
};

test('first-minute review separates unknown evidence from missing profile facts', () => {
  const report = hiringReview(snapshotForTest(), structuredClone(DEFAULT_CONFIG));
  assert.equal(find(report, 'target-role').state, 'unknown');
  assert.equal(find(report, 'navigation').state, 'needs-work');
  assert.equal(find(report, 'project-onboarding').state, 'unknown');
  assert.equal(find(report, 'technical-evidence').state, 'unknown');
  assert.equal(report.purpose.includes('NOT a hiring probability'), true);
  assert.equal('hireabilityScore' in report, false);
  assert.equal('interviewProbability' in report, false);
  assert.ok(report.actions.every((action) => action.source.startsWith('https://github.com/')));
  assert.match(renderHiringReview(report), /not a hiring score/i);
});

test('desired job is an application preference, not an employment claim', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.editorial.targetRole = 'Backend Engineer';
  config.editorial.targetCompany = 'Google';
  const report = hiringReview(snapshotForTest(), config);
  assert.equal(report.targetRole, 'Backend Engineer');
  assert.match(find(report, 'target-role').observation, /not an employment claim/);
  assert.doesNotMatch(JSON.stringify(report), /works at Google|employed by Google/i);
});

test('inspection checks onboarding headings but never certifies tests or technical skill', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.featured = ['backend-toolkit', 'quiet-scripting'];
  config.profile.maxProjects = 2;
  const snapshot = snapshotForTest();
  snapshot.profileReadme = { content: '# Example\n\nA documented portfolio.', url: 'https://github.com/example/example' };
  snapshot.repos[0].inspection = {
    state: 'available',
    features: { installation: true, usage: true, testing: true },
    url: 'https://github.com/example/backend-toolkit',
  };
  snapshot.repos[2].inspection = {
    state: 'missing', features: {}, url: 'https://github.com/example/quiet-scripting',
  };
  const report = hiringReview(snapshot, config);
  assert.equal(find(report, 'navigation').state, 'clear');
  assert.equal(find(report, 'project-onboarding').state, 'needs-work');
  assert.equal(report.featuredProjects.length, 2);
  assert.equal(report.featuredProjects[0].setupHeadingDetected, true);
  assert.equal(report.featuredProjects[0].testedCode, 'unknown');
  assert.equal(report.featuredProjects[0].personalOwnershipOfWork, 'unverified');
  assert.equal(report.featuredProjects[1].documentation, 'missing');
  assert.match(renderHiringReview(report), /not verified/i);
});

test('manually excluded projects do not become recruiter-facing evidence', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.featured = ['backend-toolkit', 'quiet-scripting'];
  config.profile.excluded = ['quiet-scripting'];
  const report = hiringReview(snapshotForTest(), config);
  assert.deepEqual(report.featuredProjects.map((x) => x.repository), ['example/backend-toolkit']);
  assert.equal(find(report, 'showcase').state, 'needs-work');
});

test('availability of user-controlled links is never claimed as verified', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.links = [{ label: 'Portfolio', url: 'https://example.com' }];
  const report = hiringReview(snapshotForTest(), config);
  assert.equal(find(report, 'contact').state, 'clear');
  assert.match(find(report, 'contact').observation, /not checked/);
});

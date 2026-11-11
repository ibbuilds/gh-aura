import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, validateConfig } from '../src/config.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { checkDraft, presentationPlan, writingPrompt } from '../src/editorial.mjs';
import { renderProfile } from '../src/render.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';
import { PROFILE_REFERENCE } from '../src/reference.mjs';

const snapshot = () => ({ username: 'example', observedAt: '2026-11-11T12:00:00Z', user: { name: 'Example', bio: 'Builds API tools.' },
  profileReadme: { content: 'Existing text. '.repeat(5000), url: 'https://github.com/example/example' },
  repos: [{ name: 'tool', full_name: 'example/tool', description: 'A documented API tool.', html_url: 'https://github.com/example/tool', language: 'TypeScript', topics: ['api'], private: false, fork: false, archived: false, size: 50, stargazers_count: 0, pushed_at: '2026-11-01' }], truncated: false });

test('visual percentages change presentation, never facts or explicit switches', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  for (const visual of [0, 20, 50, 80, 100]) {
    config.profile.visual = visual;
    config.profile.sections.stats = false;
    validateConfig(config);
    const plan = presentationPlan(config.profile);
    assert.equal(plan.visual, visual);
    assert.equal(plan.sections.stats, false);
    const output = renderProfile(snapshot(), config);
    assert.match(output, /documented API tool/);
    assert.doesNotMatch(output, /senior|years|expert|stars/i);
  }
  config.profile.visual = 101;
  assert.throws(() => validateConfig(config), /profile.visual/);
});

test('explicit legacy style parameter retains all three template modes', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.visual = 20;
  assert.match(renderProfile(snapshot(), config, 'regular'), /\| Project \|/);
  assert.match(renderProfile(snapshot(), config, 'flashy'), /shields.io/);
  assert.doesNotMatch(renderProfile(snapshot(), config, 'minimal'), /shields.io/);
});

test('brief stays below its byte budget and reports omitted README context', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.editorial.targetRole = 'Platform engineer';
  const brief = editorialBrief(snapshot(), config);
  assert.equal(brief.format, 'gh-aura-editorial-brief-v1');
  assert.equal(brief.existingReadme.content.length, 1200);
  assert.equal(brief.existingReadme.truncated, true);
  assert.ok(brief.omissions.length > 0);
  assert.ok(Buffer.byteLength(JSON.stringify(brief)) <= 12000);
  assert.equal(brief.reference.sampleSize, 100);
  assert.match(brief.preferencesProvenance, /not a claimed current position/);
  assert.match(writingPrompt(brief), /BEGIN UNTRUSTED EDITORIAL DATA/);
  assert.match(writingPrompt(brief), /Never copy/);
});

test('brief honors exact manual project selection and disabled projects', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.featured = ['example/tool'];
  const brief = editorialBrief(snapshot(), config);
  assert.deepEqual(brief.preferences.featured, ['example/tool']);
  config.profile.maxProjects = 0;
  assert.equal(editorialBrief(snapshot(), config).showcaseEvidence.length, 0);
});

test('draft checks flag unsupported kinds of claims without claiming verification', () => {
  const content = '# YOUR_NAME\n\nA world-class senior engineer with 10 years of experience and 500 users.\n\n' +
    'This exact paragraph is long enough to be detected as repeated text.\n\n'.repeat(2) + '[bad](javascript:alert(1))';
  const report = checkDraft(content);
  for (const id of ['placeholders', 'generic-language', 'credentials', 'impact', 'repetition', 'unsafe-link']) assert.ok(report.findings.some((x) => x.id === id), id);
  assert.match(report.caveat, /No guarantee/);
});

test('draft check is explicitly not an originality or factuality certificate', () => {
  const report = checkDraft('# Example\n\nBuilds API tools.\n');
  assert.equal(report.status, 'no-heuristic-findings');
  assert.match(report.caveat, /originality/);
  assert.throws(() => checkDraft('x'.repeat(300000)), /256 KiB/);
});

test('CLI options reject ambiguous settings before loading any command', () => {
  assert.throws(() => validateOptions('profile', parseArgs(['--style', 'minimal', '--visual', '20'])), /Choose --visual/);
  assert.throws(() => validateOptions('brief', parseArgs(['--prompt', '--json'])), /brief exports/);
  assert.throws(() => validateOptions('audit', parseArgs(['--budget', '0'])), /budget/);
  validateOptions('check', parseArgs(['--file', 'draft.md', '--strict', '--json']));
});

test('reference describes a purposive sample rather than a professional quality score', () => {
  assert.equal(PROFILE_REFERENCE.observations.withPins, 75);
  assert.equal(PROFILE_REFERENCE.observations.rootReadmesObserved, 38);
  assert.match(PROFILE_REFERENCE.limitations, /Not a hiring-outcome study/);
  assert.equal(PROFILE_REFERENCE.employerSourced.sampleSize, 16);
  assert.match(PROFILE_REFERENCE.criteria, /not certified employment/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { DEFAULT_CONFIG, validateConfig } from '../src/config.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { writingPrompt } from '../src/editorial.mjs';
import { ORDINARY_REFERENCE, PROFILE_REFERENCE, PROFESSIONAL_EXAMPLES, referenceReport } from '../src/reference.mjs';
import { snapshotForTest } from './fixtures.mjs';

test('professional reference differentiates dual signals from employer-controlled sources', () => {
  assert.equal(ORDINARY_REFERENCE.sampleSize, 200);
  assert.equal(ORDINARY_REFERENCE.companyCount, 35);
  assert.equal(PROFILE_REFERENCE.employerSourced.sampleSize, 16);
  assert.equal(PROFESSIONAL_EXAMPLES.length, 16);
  assert.match(ORDINARY_REFERENCE.criteria, /not certified employment/i);
  assert.match(PROFILE_REFERENCE.employerSourced.criteria, /author/);
  assert.ok(PROFESSIONAL_EXAMPLES.every((person) => person.profileUrl.startsWith('https://github.com/')));
  assert.ok(PROFESSIONAL_EXAMPLES.every((person) => person.companySource.startsWith('https://')));
});

test('reference browser filters employer-source examples with links and qualifications', () => {
  const data = referenceReport('Microsoft');
  assert.equal(data.employerSourced.examples.length, 2);
  assert.equal(data.cohort.affiliated.length, 1);
  assert.equal(data.cohort.affiliated[0].count, 7);
  assert.ok(data.employerSourced.examples.every((person) => person.company === 'Microsoft'));
  assert.match(data.limitations, /employ/i);
  assert.equal(referenceReport('nonexistent company').employerSourced.examples.length, 0);
});

test('editorial brief uses professional structure without claiming current employment', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.editorial.targetCompany = 'Microsoft';
  config.editorial.targetRole = 'Software Engineer';
  validateConfig(config);
  const brief = editorialBrief(snapshotForTest(), config);
  assert.equal(brief.editorial.targetCompany, 'Microsoft');
  assert.equal(brief.reference.sampleSize, 200);
  assert.equal(brief.reference.employerSourced.sampleSize, 16);
  assert.equal(brief.reference.officialExamples.length, 2);
  assert.ok(Buffer.byteLength(JSON.stringify(brief)) <= 12000);
  assert.match(writingPrompt(brief), /200 employer-verified employees/);
  assert.match(writingPrompt(brief), /target company is a hiring goal/);
  assert.match(writingPrompt(brief), /Never copy/);
  assert.doesNotMatch(JSON.stringify(brief), /@microsoft\.com|Co-authored-by:/);
});

test('reference command works entirely offline and accepts company filtering', () => {
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const expression = 'globalThis.fetch=()=>{throw new Error("NETWORK_FORBIDDEN")};const {main}=await import(' +
    JSON.stringify(cli) + ');await main(["references","--company","Microsoft","--json"]);';
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', expression], {
    encoding: 'utf8', timeout: 10000, env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' },
  });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.employerSourced.examples.length, 2);
  assert.equal(data.cohort.companyCount, 35);
  assert.doesNotMatch(result.stderr, /NETWORK_FORBIDDEN/);
});

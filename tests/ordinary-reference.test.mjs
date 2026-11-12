import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ORDINARY_REFERENCE, PROFILE_REFERENCE, referenceReport } from '../src/reference.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { snapshotForTest } from './fixtures.mjs';

const raw = readFileSync(new URL('../research/ordinary-engineers-200.json', import.meta.url));
const research = JSON.parse(raw.toString('utf8'));
const gitBlobSha = createHash('sha1').update('blob ' + raw.length + '\0').update(raw).digest('hex');

test('200-person primary reference is identical to the versioned Git research source', () => {
  assert.equal(research.schema, 'gh-aura-ordinary-visibility-engineers-200-v1');
  assert.equal(research.selected, 200);
  assert.equal(research.records.length, 200);
  assert.equal(gitBlobSha, ORDINARY_REFERENCE.sourceBlob);
  assert.equal(ORDINARY_REFERENCE.sampleSize, research.selected);
  assert.equal(ORDINARY_REFERENCE.companyCount, Object.keys(research.companyCounts).length);
  assert.deepEqual(ORDINARY_REFERENCE.companyCounts, research.companyCounts);
  assert.equal(ORDINARY_REFERENCE.completeRunRequests, research.requests);
  assert.equal(ORDINARY_REFERENCE.observations.withPins, research.summary.withPins);
  assert.equal(ORDINARY_REFERENCE.observations.rootReadmesObserved, research.summary.rootReadmes);
  assert.equal(ORDINARY_REFERENCE.observations.readmeWords.median, research.summary.medianReadmeWords);
  assert.equal(ORDINARY_REFERENCE.observations.readmesWithStatCards, research.summary.readmesWithStatWidgets);
});

test('observations contain public profile structure, not copied biographies/private repo data', () => {
  const logins = new Set();
  const bands = {};
  for (const person of research.records) {
    assert.ok(person.profile.startsWith('https://github.com/'));
    assert.equal(person.evidence.employerVerified, false);
    assert.equal(typeof person.structure.pins, 'number');
    assert.ok(person.structure.pins <= 6);
    assert.ok(!Object.hasOwn(person, 'bio') && !Object.hasOwn(person, 'email'));
    assert.ok(!Object.hasOwn(person.structure.readme, 'text'));
    assert.ok(!Object.hasOwn(person.structure.readme, 'source'));
    assert.ok(!Object.hasOwn(person, 'privateRepos'));
    const key = person.login.toLowerCase();
    assert.ok(!logins.has(key), 'duplicate account: ' + key);
    logins.add(key);
    bands[person.structure.followerBand] = (bands[person.structure.followerBand] || 0) + 1;
  }
  assert.deepEqual(bands, ORDINARY_REFERENCE.followerBands);
  assert.equal(Object.values(bands).reduce((a, b) => a + b, 0), 200);
  assert.equal(PROFILE_REFERENCE.sampleSize, 100, 'historical baseline remains separate');
  assert.equal(PROFILE_REFERENCE.employerSourced.sampleSize, 16, 'employer-sourced evidence remains separate');
});

test('ordinary-visibility reference flows to the CLI report and vendor-neutral brief', () => {
  const report = referenceReport();
  assert.equal(report.cohort.sampleSize, 200);
  assert.equal(report.cohort.companyCount, 35);
  assert.match(report.cohort.criteria, /not certified employment/);
  assert.match(report.methodology, /ORDINARY_STUDY\.md/);
  const microsoft = referenceReport('Microsoft');
  assert.equal(microsoft.cohort.affiliated[0].count, 7);
  assert.equal(microsoft.employerSourced.examples.length, 2);
  const brief = editorialBrief(snapshotForTest(), structuredClone(DEFAULT_CONFIG));
  assert.equal(brief.reference.sampleSize, 200);
  assert.equal(brief.reference.companyCount, 35);
  assert.equal(brief.reference.sources[0], ORDINARY_REFERENCE.source);
  assert.ok(Buffer.byteLength(JSON.stringify(brief)) <= 12000);
});

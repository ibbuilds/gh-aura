import test from 'node:test';
import assert from 'node:assert/strict';
import {ORDINARY_REFERENCE,referenceReport} from '../src/reference.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {DEFAULT_CONFIG} from '../src/config.mjs';
import {snapshotForTest} from './fixtures.mjs';

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

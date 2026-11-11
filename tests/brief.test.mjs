import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialBrief } from '../src/brief.mjs';
import { configForTest, snapshotForTest } from './fixtures.mjs';

test('editorial brief exports public evidence and human review instructions', () => {
  const brief = editorialBrief(snapshotForTest(), configForTest());
  assert.equal(brief.format, 'gh-aura-editorial-brief-v1');
  assert.equal(brief.username, 'example');
  assert.equal(brief.preferences.style, 'minimal');
  assert.ok(brief.showcaseEvidence.length > 0);
  assert.equal(brief.showcaseEvidence[0].readmeInspection.state, 'not_inspected');
  assert.match(brief.constraints.join(' '), /Do not invent employers/);
  assert.match(brief.publishing, /No AI service/);
});

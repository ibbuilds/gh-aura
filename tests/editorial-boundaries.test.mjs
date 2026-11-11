import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { checkDraft } from '../src/editorial.mjs';
import { snapshotForTest } from './fixtures.mjs';

test('hidden project sections are excluded from required editorial links', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.sections.projects = false;
  const brief = editorialBrief(snapshotForTest(), config);
  assert.equal(brief.showcaseEvidence.length, 0);
  assert.equal(brief.preferences.sections.projects, false);
});

test('untrusted brief cannot silently disable the word target', () => {
  assert.throws(() => checkDraft('# Hello', { format: 'gh-aura-editorial-brief-v1', editorial: { maxWords: 'unlimited' } }), /word target/);
});

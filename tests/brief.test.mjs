import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialBrief } from '../src/brief.mjs';
import { configForTest, snapshotForTest } from './fixtures.mjs';

test('editorial brief exports public evidence and human review instructions', () => {
  const brief = editorialBrief(snapshotForTest(), configForTest());
  assert.equal(brief.format, 'gh-aura-editorial-brief-v1');
  assert.equal(brief.username, 'example');
  assert.equal(brief.preferences.style, 'minimal');
  assert.equal(brief.profileSpec.format,'gh-aura-profile-spec-v1');
  assert.equal(brief.profileSpec.direction,'minimal');
  assert.ok(brief.profileSpec.sourceIds.length>0);
  assert.ok(brief.sourceSuggestions.length>0);
  assert.ok(brief.sourceSuggestions.every(x=>x.url.startsWith('https://')));

  assert.ok(brief.showcaseEvidence.length > 0);
  assert.equal(brief.showcaseEvidence[0].readmeInspection.state, 'not_inspected');
  assert.match(brief.constraints.join(' '), /Do not invent employers/);
  assert.match(brief.publishing, /No AI service/);
});

test('portable brief surfaces source URLs without embedding external assets',async()=>{
  const cfg=configForTest();
  cfg.editorial.direction='technical';
  cfg.editorial.targetRole='backend engineer';
  const brief=editorialBrief(snapshotForTest(),cfg);
  assert.equal(brief.profileSpec.direction,'technical');
  assert.equal(brief.profileSpec.goal,'backend engineer');
  assert.ok(brief.sourceSuggestions.every(x=>x.trust!=='third-party'));
  const prompt=(await import('../src/editorial.mjs')).writingPrompt(brief);
  assert.match(prompt,/profileSpec as editable composition intent/);
  assert.match(prompt,/sourceSuggestions contain reference URLs/);
  assert.doesNotMatch(JSON.stringify(brief),/GH_TOKEN|GITHUB_TOKEN/);
});

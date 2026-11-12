import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, validateConfig } from '../src/config.mjs';
import { renderProfile } from '../src/render.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { snapshotForTest } from './fixtures.mjs';

const story = {
  repo: 'example/backend-toolkit',
  problem: 'A developer onboarding tool needed reliable API requests.',
  contribution: 'I implemented the API client, pagination and integration tests.',
  tradeoffs: 'Chose explicit pagination and bounded retries over background polling.',
  outcome: 'Published a documented CLI used by our small team.',
  proof: 'https://github.com/example/backend-toolkit/blob/main/src/client.ts',
};

test('project stories require strict repo names, safe proof links, and unique entries', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.projectStories = [story];
  assert.equal(validateConfig(config), config);
  config.profile.projectStories = [{ ...story, proof: 'javascript:alert(1)' }];
  assert.throws(() => validateConfig(config), /safe https/);
  config.profile.projectStories = [story, { ...story, contribution: 'Duplicate' }];
  assert.throws(() => validateConfig(config), /Duplicate project story/);
  config.profile.projectStories = [{ repo: 'a/b', extra: 'unexpected' }];
  assert.throws(() => validateConfig(config), /Project stories accept only/);
  config.profile.projectStories = [{ repo: 'a/b', contribution: 'x'.repeat(701) }];
  assert.throws(() => validateConfig(config), /700 characters/);
});

test('minimal mode adds only concise user-confirmed evidence for selected work', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.projectStories = [story];
  config.profile.featured = ['backend-toolkit'];
  const text = renderProfile(snapshotForTest(), config, 'minimal');
  assert.match(text, /My work: I implemented the API client/);
  assert.match(text, /Evidence\]\(https:\/\/github.com\/example\/backend-toolkit\/blob\/main\/src\/client.ts/);
  assert.doesNotMatch(text, /Engineering trade-offs/);
  assert.doesNotMatch(text, /quiet-scripting/);
});

test('regular mode shows user-supplied work beside project purpose, flashy expands trade-offs', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.projectStories = [story];
  config.profile.featured = ['backend-toolkit'];
  const regular = renderProfile(snapshotForTest(), config, 'regular');
  assert.match(regular, /\| Project \| Description \| My contribution \|/);
  assert.match(regular, /I implemented the API client/);
  const flashy = renderProfile(snapshotForTest(), config, 'flashy');
  assert.match(flashy, /Engineering trade-offs/);
  assert.match(flashy, /Problem:/);
  assert.match(flashy, /Outcome \(user-provided\)/);
});

test('editorial brief separates user-supplied narrative from observed repository evidence', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.projectStories = [story];
  config.profile.featured = ['backend-toolkit'];
  const brief = editorialBrief(snapshotForTest(), config);
  assert.equal(brief.showcaseEvidence.length, 1);
  assert.equal(brief.showcaseEvidence[0].userStory.source, 'user-supplied-not-independently-verified');
  assert.match(brief.showcaseEvidence[0].userStory.tradeoffs, /bounded retries/);
  assert.match(brief.constraints.join(' '), /not automatically verified/);
  assert.ok(Buffer.byteLength(JSON.stringify(brief)) < 12000);
});

test('unfeatured project story never leaks into an unrelated generated profile', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.projectStories = [story];
  config.profile.featured = ['quiet-scripting'];
  const text = renderProfile(snapshotForTest(), config, 'flashy');
  assert.doesNotMatch(text, /I implemented the API client/);
  assert.doesNotMatch(text, /bounded retries/);
});

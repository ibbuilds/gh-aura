import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_CONFIG, initConfig, loadConfig } from '../src/config.mjs';
import { storyCommand } from '../src/story-cli.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';
import { renderProfile } from '../src/render.mjs';
import { snapshotForTest } from './fixtures.mjs';

function withConfig(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'aura-story-'));
  try {
    const file = join(dir, 'profile.json');
    initConfig(file);
    return callback(file);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('story commands are local, idempotent and preserve fields on updates', () => withConfig((file) => {
  storyCommand('set', 'example/backend-toolkit', {
    config: file, contribution: 'Implemented a real API integration',
    proof: 'https://github.com/example/backend-toolkit',
  });
  assert.equal(loadConfig(file).profile.projectStories.length, 1);
  storyCommand('set', 'example/backend-toolkit', { config: file, problem: 'Reliable API requests' });
  const list = loadConfig(file).profile.projectStories;
  assert.equal(list.length, 1);
  assert.equal(list[0].contribution, 'Implemented a real API integration');
  assert.equal(list[0].problem, 'Reliable API requests');
  assert.match(storyCommand('list', null, { config: file }), /Implemented a real API integration/);
  storyCommand('remove', 'example/backend-toolkit', { config: file });
  assert.deepEqual(loadConfig(file).profile.projectStories, []);
  assert.match(storyCommand('remove', 'example/backend-toolkit', { config: file }), /No project story/);
}));

test('dry run never changes local config and invalid proof is rejected', () => withConfig((file) => {
  const before = readFileSync(file, 'utf8');
  const diff = storyCommand('set', 'example/backend-toolkit', {
    config: file, contribution: 'A tested integration', 'dry-run': true,
  });
  assert.match(diff, /Local configuration preview/);
  assert.equal(readFileSync(file, 'utf8'), before);
  assert.throws(() => storyCommand('set', 'example/backend-toolkit', {
    config: file, proof: 'javascript:alert(1)',
  }), /https/);
  assert.equal(readFileSync(file, 'utf8'), before);
}));

test('configured user story is rendered only for an explicitly featured real repository', () => withConfig((file) => {
  storyCommand('set', 'example/backend-toolkit', { config: file,
    contribution: 'Built a real service layer and verified it with tests.',
  });
  const config = loadConfig(file);
  config.profile.featured = ['example/backend-toolkit'];
  const shown = renderProfile(snapshotForTest(), config, 'minimal');
  assert.match(shown, /Built a real service layer/);
  config.profile.featured = ['example/quiet-scripting'];
  const hidden = renderProfile(snapshotForTest(), config, 'minimal');
  assert.doesNotMatch(hidden, /Built a real service layer/);
}));

test('invalid story edits fail before writing', () => {
  validateOptions('story', parseArgs(['set', 'example/backend-toolkit', '--contribution', 'Built actual tests']));
  validateOptions('story', parseArgs(['list']));
  validateOptions('story', parseArgs(['remove', 'example/backend-toolkit', '--dry-run']));
  assert.throws(() => validateOptions('story', parseArgs(['set', 'example/backend-toolkit'])), /requires/);
  assert.throws(() => validateOptions('story', parseArgs(['list', '--proof', 'https://example.com'])), /takes no/);
  assert.throws(() => validateOptions('story', parseArgs(['remove', 'example/backend-toolkit', '--outcome', 'fake'])), /needs only/);
});

test('story commands never call the GitHub API', () => withConfig((file) => {
  const before = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK_FORBIDDEN'); };
  try {
    storyCommand('set', 'example/backend-toolkit', { config: file, contribution: 'Tested a real feature' });
    assert.equal(loadConfig(file).profile.projectStories.length, 1);
  } finally { globalThis.fetch = before; }
}));

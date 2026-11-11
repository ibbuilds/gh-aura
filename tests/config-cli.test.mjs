import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configCommand } from '../src/config-cli.mjs';

function withTemp(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'gh-aura-config-'));
  try { return callback(join(dir, 'settings.json')); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

test('config show and get work with an explicit, initialized local file', () => withTemp((file) => {
  configCommand('set', 'profile.style', 'regular', { file });
  const value = JSON.parse(configCommand('show', null, null, { file }));
  assert.equal(value.profile.style, 'regular');
  assert.equal(configCommand('get', 'profile.style', undefined, { file }), 'regular\n');
}));

test('dry-run previews config changes without creating a local file', () => withTemp((file) => {
  const preview = configCommand('set', 'profile.style', 'regular', { dryRun: true, file });
  assert.match(preview, /\+.*regular/);
  assert.equal(existsSync(file), false);
}));

test('set initializes selected config and supports array and boolean settings', () => withTemp((file) => {
  configCommand('set', 'profile.style', 'regular', { file });
  configCommand('set', 'profile.sections.stats', 'true', { file });
  configCommand('set', 'profile.technologies', '["TypeScript","Python"]', { file });
  const written = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(written.profile.style, 'regular');
  assert.equal(written.profile.sections.stats, true);
  assert.deepEqual(written.profile.technologies, ['TypeScript', 'Python']);
}));

test('invalid keys and types fail without modifying the file', () => withTemp((file) => {
  configCommand('set', 'profile.style', 'regular', { file });
  const old = readFileSync(file, 'utf8');
  assert.throws(() => configCommand('set', 'owner.admin', 'true', { file }), /Unknown configuration path/);
  assert.throws(() => configCommand('set', 'profile.style', 'neon', { file }), /minimal, regular, or flashy/);
  assert.throws(() => configCommand('set', 'profile.sections.stats', 'yes', { file }), /must be true or false/);
  assert.equal(readFileSync(file, 'utf8'), old);
}));

test('reset restores the inherited style default for section toggles', () => withTemp((file) => {
  configCommand('set', 'profile.sections.stats', 'true', { file });
  configCommand('reset', 'profile.sections.stats', undefined, { file });
  const updated = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(updated.profile.sections.stats, undefined);
  assert.match(configCommand('get', 'profile.sections.stats', undefined, { file }), /inherited/);
}));

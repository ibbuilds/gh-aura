import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_CONFIG, initConfig, loadConfig, validateConfig } from '../src/config.mjs';

test('defaults to minimalist style', () => {
  assert.equal(DEFAULT_CONFIG.profile.style, 'minimal');
  assert.equal(DEFAULT_CONFIG.profile.sections.stats, undefined);
});

test('validates the three styles and section switches', () => {
  for (const style of ['minimal', 'regular', 'flashy']) {
    const config = structuredClone(DEFAULT_CONFIG);
    config.profile.style = style;
    config.profile.sections.projects = false;
    assert.equal(validateConfig(config).profile.style, style);
  }
  const invalid = structuredClone(DEFAULT_CONFIG);
  invalid.profile.style = 'holographic';
  assert.throws(() => validateConfig(invalid), /minimal, regular, or flashy/);
});

test('writes configuration locally without overwriting by default', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gh-aura-'));
  try {
    const path = join(dir, 'config.json');
    initConfig(path);
    assert.match(readFileSync(path, 'utf8'), /"style": "minimal"/);
    assert.throws(() => initConfig(path), /EEXIST/);
    assert.equal(loadConfig(path).profile.style, 'minimal');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

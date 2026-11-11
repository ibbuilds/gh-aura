import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));

test('CLI runs through a directory link as installed npm binaries do', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aura-entry-'));
  try {
    const alias = join(directory, 'linked-src');
    symlinkSync(fileURLToPath(new URL('../src/', import.meta.url)), alias, 'junction');
    const result = spawnSync(process.execPath, [join(alias, 'cli.mjs'), '--help'], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /GH Aura/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('importing CLI exports does not execute commands or print help', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', 'await import(' + JSON.stringify(new URL('../src/cli.mjs', import.meta.url).href) + ')'], {
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
});

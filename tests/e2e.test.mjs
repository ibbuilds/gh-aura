import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
const fixture = new URL('./helpers/mock-github.mjs', import.meta.url).href;

test('installed command flow: configure, inspect, draft, review, publish, stale rejection and no-op', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aura-e2e-'));
  const state = join(dir, 'remote.json');
  const run = (...args) => spawnSync(process.execPath, ['--import', fixture, cli, ...args], {
    cwd: dir, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GH_TOKEN: 'test-only', GITHUB_TOKEN: '', GH_AURA_TEST_STATE: state },
  });
  const ok = (...args) => { const result = run(...args); assert.equal(result.status, 0, result.stderr); return result.stdout; };
  try {
    ok('init', 'example');
    ok('config', 'set', 'profile.style', 'regular');
    ok('config', 'set', 'profile.featured', '["backend-toolkit"]');
    const audit = JSON.parse(ok('audit', '--inspect', '2', '--json'));
    assert.equal(audit.publicRepositoriesScanned, 3); assert.equal(audit.repositoryReadmesInspected, 2);
    ok('profile', '--output', 'draft.md');
    assert.match(readFileSync(join(dir, 'draft.md'), 'utf8'), /backend-toolkit/);
    const brief = JSON.parse(ok('brief')); assert.equal(brief.preferences.style, 'regular');
    assert.equal(existsSync(state), false, 'No analysis or draft operation may write remotely');
    ok('preview', '--file', 'draft.md', '--save', 'review.json');
    assert.equal(existsSync(state), false);
    const published = JSON.parse(ok('apply', '--review', 'review.json', '--json'));
    assert.equal(published.changed, true);
    assert.equal(JSON.parse(readFileSync(state, 'utf8')).puts, 1);
    const stale = run('apply', '--review', 'review.json');
    assert.notEqual(stale.status, 0); assert.match(stale.stderr, /Approval code mismatch/);
    ok('preview', '--file', 'draft.md', '--save', 'review.json', '--force');
    assert.equal(JSON.parse(ok('apply', '--review', 'review.json', '--json')).changed, false);
    writeFileSync(join(dir, 'draft.md'), '# Changed after approval\n');
    assert.match(run('apply', '--review', 'review.json').stderr, /Approval code mismatch/);
    assert.equal(JSON.parse(readFileSync(state, 'utf8')).puts, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

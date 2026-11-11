import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function command(args) {
  return spawnSync(process.execPath, ['src/cli.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('help works without a GitHub token or network access', () => {
  const result = command(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /minimal\|regular\|flashy/);
});

test('achievement catalog works fully offline', () => {
  const result = command(['achievements', '--json']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.catalog.some((achievement) => achievement.name === 'Pull Shark'));
  assert.match(parsed.status, /unverified/);
});

test('invalid GitHub usernames produce actionable CLI errors', () => {
  const result = command(['audit', '../bad']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /valid GitHub username/);
});

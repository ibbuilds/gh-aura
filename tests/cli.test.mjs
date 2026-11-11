import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { parseArgs } from '../src/cli.mjs';

function command(args) {
  return spawnSync(process.execPath, ['src/cli.mjs', ...args], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' },
  });
}

test('help is short, offline and shows the primary workflow', () => {
  const result = command(['--help']);
  assert.equal(result.status, 0); assert.match(result.stdout, /init USER/);
  assert.match(result.stdout, /apply --review/); assert.ok(result.stdout.split('\n').length < 30);
});

test('command help exposes three styles without a network call', () => {
  const result = command(['profile', '--help']);
  assert.equal(result.status, 0); assert.match(result.stdout, /minimal\|regular\|flashy/);
});

test('achievement catalog works fully offline', () => {
  const result = command(['achievements', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.catalog.some((item) => item.name === 'Pull Shark'));
  assert.match(parsed.status, /unverified/);
});

test('invalid usernames fail before network access', () => {
  const result = command(['audit', '../bad']);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /valid GitHub username/);
});

test('apply --dry-run never reads a draft or publishes', () => {
  const result = command(['apply', 'octocat', '--dry-run', '--file', 'missing.md', '--approve', '0'.repeat(64)]);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /apply --dry-run never publishes/);
});

for (const args of [
  ['profile', 'example', '--json'], ['apply', 'example', '--style', 'flashy'],
  ['audit', 'example', '--all'], ['config', 'set', 'profile.style'],
  ['config', 'get', 'profile.style', '--dry-run'], ['audit', 'example', '--force'],
  ['audit', 'example', '--user', 'other'], ['audit', 'example', '--json', '--format', 'json'],
  ['audit', 'example', 'extra'], ['contributions', 'example', '--all', '--year', '2020'],
]) test('invalid invocation fails rather than silently ignoring options: ' + args.join(' '), () => {
  const result = command(args);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /GH Aura:/);
  assert.doesNotMatch(result.stderr, /could not be reached/);
});

test('argument parser handles quoted values, aliases and duplicate detection', () => {
  assert.equal(parseArgs(['--style=regular']).style, 'regular');
  assert.equal(parseArgs(['-o', 'draft.md']).output, 'draft.md');
  assert.deepEqual(parseArgs(['--', '--literal']).positional, ['--literal']);
  assert.throws(() => parseArgs(['--style', 'minimal', '--style', 'regular']), /Duplicate/);
  assert.throws(() => parseArgs(['--force=true']), /takes no value/);
  assert.throws(() => parseArgs(['--output']), /Missing value/);
});

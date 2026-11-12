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


test('CI/release checks are opt-in and require an explicit deep repository scan', () => {
  const result = command(['audit', 'octocat', '--checks']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--checks needs --deep/);
  const forbidden = command(['profile', 'octocat', '--checks']);
  assert.notEqual(forbidden.status, 0);
  assert.match(forbidden.stderr, /not supported/);
});


test('short CLI aliases stay offline and preserve original command help', () => {
  const top = command(['--help']);
  assert.equal(top.status, 0);
  for (const name of ['activity', 'badges', 'readme', 'pins']) {
    assert.match(top.stdout, new RegExp('gh-aura ' + name));
  }
  assert.ok(top.stdout.split('\n').length < 30);
  for (const [args, expected] of [
    [['activity', '2022', '--help'], /contributions/],
    [['activity', '2020..2024', '--help'], /contributions/],
    [['readme', 'minimal', '--help'], /profile/],
    [['readme', '80', '--help'], /profile/],
    [['pins', '--help'], /showcase/],
  ]) {
    const r = command(args);
    assert.equal(r.status, 0, args.join(' ') + ' ' + r.stderr);
    assert.match(r.stdout, expected);
  }
});

test('badges shortcut produces free planning and one badge without authentication', () => {
  const free = command(['badges', 'free', '--json']);
  assert.equal(free.status, 0, free.stderr);
  const report = JSON.parse(free.stdout);
  assert.equal(report.scope, 'free');
  assert.ok(report.catalog.length > 0);
  assert.ok(Array.isArray(report.plan));
  assert.ok(report.catalog.every((item) => !item.requiresPayment));
  const targeted = command(['badges', 'pull-shark', '--json']);
  assert.equal(targeted.status, 0, targeted.stderr);
  assert.deepEqual(JSON.parse(targeted.stdout).catalog.map((x) => x.id), ['pull-shark']);
});

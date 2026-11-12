import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectLocalGit, renderLocalAttribution } from '../src/local-attribution.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

function git(repo, args, env = undefined) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    ...(env ? { env: { ...process.env, ...env } } : {}),
  }).trim();
}

function fixture(action) {
  const root = mkdtempSync(join(tmpdir(), 'aura-local-attribution-'));
  try {
    git(root, ['init', '--quiet']);
    git(root, ['config', 'user.name', 'Fixture Engineer']);
    git(root, ['config', 'user.email', 'initial@example.test']);
    writeFileSync(join(root, 'README.md'), '# Useful project\n');
    git(root, ['add', 'README.md']);
    git(root, ['commit', '--quiet', '-m', 'Document working example']);
    writeFileSync(join(root, 'README.md'), '# Useful project\n\nAdd a reproducible example.\n');
    git(root, ['add', 'README.md']);
    git(root, ['commit', '--quiet', '-m', 'Improve example'], {
      GIT_AUTHOR_NAME: 'Real Collaborator',
      GIT_AUTHOR_EMAIL: 'second@example.test',
      GIT_COMMITTER_NAME: 'Real Collaborator',
      GIT_COMMITTER_EMAIL: 'second@example.test',
    });
    return action(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('identifies actual local author email metadata without printing identities', () => fixture((root) => {
  const r = inspectLocalGit(root);
  assert.equal(r.mode, 'local-git-attribution-read-only');
  assert.equal(r.scanned, 2);
  assert.equal(r.matchingConfiguredIdentity, 1);
  assert.equal(r.otherAuthoredCommits, 1);
  assert.equal(r.truncated, false);
  assert.equal(r.identityCount, 1);
  assert.equal(r.shallow, false);
  for (const output of [JSON.stringify(r), renderLocalAttribution(r)]) {
    assert.doesNotMatch(output, /initial@example|second@example|Fixture Engineer|Real Collaborator/);
  }
  assert.match(r.claims, /not GitHub-verified/);
}));

test('optional identity list is local, private and never treated as GitHub-verified', () => fixture((root) => {
  const file = join(root, 'verified-emails.txt');
  writeFileSync(file, 'initial@example.test\nsecond@example.test\n');
  const r = inspectLocalGit(root, { emailsFile: file });
  assert.equal(r.matchingConfiguredIdentity, 2);
  assert.equal(r.otherAuthoredCommits, 0);
  assert.equal(r.identityCount, 2);
  assert.equal(r.identitySource, 'user-provided-local-file');
  assert.doesNotMatch(JSON.stringify(r), /example\.test/);
  writeFileSync(file, 'not-an-email\n');
  assert.throws(() => inspectLocalGit(root, { emailsFile: file }), /email addresses/);
}));

test('local date filtering reports outside-window author metadata rather than filling a graph', () => fixture((root) => {
  const r = inspectLocalGit(root, { from: '1900', to: '1901' });
  assert.equal(r.scanned, 0);
  assert.equal(r.outsideRequestedPeriod, 2);
  assert.equal(r.oldestAuthorDate, null);
  assert.throws(() => inspectLocalGit(root, { from: '2026-12-31', to: '2026-01-01' }), /empty/);
  assert.throws(() => inspectLocalGit(root, { from: '2026-02-30' }), /real calendar date/);
}));

test('a new empty repository is reported without inventing history', () => {
  const root = mkdtempSync(join(tmpdir(), 'aura-empty-'));
  try {
    git(root, ['init', '--quiet']);
    const r = inspectLocalGit(root);
    assert.equal(r.scanned, 0);
    assert.equal(r.truncated, false);
    assert.equal(r.shallow, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CLI local attribution never performs an API call or needs a configured GitHub username', () => fixture((root) => {
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const script = 'globalThis.fetch=()=>{throw Error("NETWORK_FORBIDDEN")};const {main}=await import(' +
    JSON.stringify(cli) + ');await main(["contributions","--local",' + JSON.stringify(root) + ',"--json"]);';
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8', timeout: 10000,
    cwd: root, env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' },
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.scanned, 2);
  assert.doesNotMatch(result.stderr, /NETWORK_FORBIDDEN/);
}));

test('local CLI options reject contradictory platform and local collection requests', () => {
  validateOptions('contributions', parseArgs(['--local', '.', '--emails-file', 'identities.txt', '--recover']));
  assert.throws(() => validateOptions('contributions', parseArgs(['--emails-file', 'identities.txt'])), /requires --local/);
  assert.throws(() => validateOptions('contributions', parseArgs(['--local', '.', '--all'])), /offline/);
  assert.throws(() => validateOptions('audit', parseArgs(['--local', '.'])), /not supported/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJobPosting, matchJobPosting, renderJobMatch } from '../src/job-match.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { snapshotForTest } from './fixtures.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

test('requirements map only to selected repos and distinguish public metadata from user claims', () => {
  const snapshot = snapshotForTest();
  const config = structuredClone(DEFAULT_CONFIG);
  config.profile.featured = ['backend-toolkit'];
  config.profile.maxProjects = 1;
  config.profile.projectStories = [{
    repo: 'example/backend-toolkit', contribution: 'Built a TypeScript service',
    proof: 'https://github.com/example/backend-toolkit',
  }];
  const report = matchJobPosting('Role requires Node.js, TypeScript, Docker, and Kubernetes.', snapshot, config);
  const node = report.requirements.find((item) => item.id === 'nodejs');
  const ts = report.requirements.find((item) => item.id === 'typescript');
  const docker = report.requirements.find((item) => item.id === 'docker');
  assert.equal(node.state, 'mentioned-in-public-metadata');
  assert.equal(ts.state, 'user-claimed');
  assert.equal(ts.evidence[0].kind, 'user-supplied-project-story');
  assert.equal(docker.state, 'not-observed-in-selected-projects');
  assert.equal(report.selectedPublicProjects.length, 1);
  assert.ok(report.requirements.every((item) =>
    item.evidence.every((proof) => proof.project === 'example/backend-toolkit')));
  assert.equal(report.postingSentToGitHub, false);
  assert.equal(report.postingStored, false);
  assert.ok(!JSON.stringify(report).includes('Role requires'));
  assert.match(renderJobMatch(report), /not a skill certification/i);
});

test('no matching keyword never becomes a zero expertise score', () => {
  const r = matchJobPosting('Support the team and communicate with colleagues.', snapshotForTest(), structuredClone(DEFAULT_CONFIG));
  assert.equal(r.recognizedTerms, 0);
  assert.equal(r.requirements.length, 0);
  assert.match(r.nextSteps[0], /No supported skill/);
  assert.equal('score' in r, false);
});

test('local job posting validates size, text encoding and control characters', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gh-aura-job-'));
  try {
    const file = join(dir, 'job.txt');
    writeFileSync(file, 'Remote backend engineer with Node.js and PostgreSQL.\n');
    assert.match(readJobPosting(file), /PostgreSQL/);
    writeFileSync(file, Buffer.from([0xff, 0xfe]));
    assert.throws(() => readJobPosting(file), /UTF-8/);
    writeFileSync(file, 'Hi\u0000there');
    assert.throws(() => readJobPosting(file), /control characters/);
    writeFileSync(file, 'x'.repeat(65537));
    assert.throws(() => readJobPosting(file), /65536/);
    writeFileSync(file, '');
    assert.throws(() => readJobPosting(file), /65536/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('audit rejects nonexistent local posting before attempting GitHub requests', () => {
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const expression = 'globalThis.fetch=()=>{throw Error("NETWORK_FORBIDDEN")};const {main}=await import(' +
    JSON.stringify(cli) + ');await main(["audit","octocat","--job","/nonexistent/gh-aura-posting.txt"]);';
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', expression], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' },
  });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /NETWORK_FORBIDDEN/);
  assert.match(result.stderr, /ENOENT|no such file/i);
});

test('CLI accepts job only for audit and rejects ambiguous command flags', () => {
  validateOptions('audit', parseArgs(['--job', 'posting.txt', '--deep', '2']));
  assert.throws(() => validateOptions('profile', parseArgs(['--job', 'posting.txt'])), /not supported/);
  assert.throws(() => validateOptions('showcase', parseArgs(['--job', 'posting.txt'])), /not supported/);
});

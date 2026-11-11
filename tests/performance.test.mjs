import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { measure } from '../scripts/benchmark.mjs';
import { PROFILE_REFERENCE } from '../src/reference.mjs';

const readData = (url) => {
  const content = readFileSync(new URL(url, import.meta.url));
  const data = JSON.parse(content);
  const sha = createHash('sha1').update('blob ' + content.length + '\0').update(content).digest('hex');
  return { data, sha };
};

test('profile generation has a measured request budget and warm-cache regression gate', async () => {
  const result = await measure();
  assert.deepEqual(result.profileGeneration, { previousReadPlanRequests: 4, currentColdRequests: 2, currentWarmRequests: 0 });
});

test('company-associated 100-account reference matches exact recorded structural observations', () => {
  const { data, sha } = readData('../research/company-profiles.json');
  assert.equal(sha, PROFILE_REFERENCE.sourceBlob);
  assert.equal(data.selected, 100);
  assert.equal(data.records.length, 100);
  assert.equal(new Set(data.records.map((x) => x.login.toLowerCase())).size, 100);
  assert.equal(new Set(data.records.map((x) => x.company)).size, PROFILE_REFERENCE.companyCount);
  assert.equal(data.records.filter((x) => x.structure.pins > 0).length, PROFILE_REFERENCE.observations.withPins);
  assert.equal(data.records.filter((x) => x.structure.readme.state === 'observed').length, PROFILE_REFERENCE.observations.rootReadmesObserved);
  assert.ok(data.records.every((x) => x.evidence.employerVerified === false));
  assert.ok(data.records.every((x) => !Object.hasOwn(x, 'bio') && !Object.hasOwn(x, 'email')));
  assert.ok(data.records.every((x) => !Object.hasOwn(x.structure.readme, 'text')));
  assert.match(data.employmentStatus, /UNVERIFIED/);
});

test('employer-sourced 16-account reference retains source links without copying biographies', () => {
  const { data, sha } = readData('../research/employer-observations.json');
  assert.equal(sha, PROFILE_REFERENCE.employerSourced.sourceBlob);
  assert.equal(data.observed, 16);
  assert.equal(data.selected, 16);
  assert.equal(data.records.length, 16);
  assert.equal(data.records.filter((x) => x.structure.pins > 0).length, PROFILE_REFERENCE.employerSourced.observations.withPins);
  assert.equal(data.records.filter((x) => x.structure.readme.status === 'observed').length, PROFILE_REFERENCE.employerSourced.observations.rootReadmesObserved);
  assert.ok(data.records.every((x) => x.employerSource?.startsWith('https://')));
  assert.ok(data.records.every((x) => !Object.hasOwn(x, 'bio') && !Object.hasOwn(x.structure.readme, 'text')));
  assert.match(data.limitations.join(' '), /outdated|stale|changes jobs|older employer/i);
});

test('local editorial check makes zero network calls and strict mode is useful in scripts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gh-aura-editor-'));
  const file = join(directory, 'draft.md');
  writeFileSync(file, '# YOUR_NAME\n\nTODO\n');
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const expression = 'globalThis.fetch=()=>{throw new Error("NETWORK_FORBIDDEN")};const {main}=await import(' +
    JSON.stringify(cli) + ');await main(["check","--file",' + JSON.stringify(file) + ',"--strict","--json"]);';
  try {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', expression], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).status, 'needs-review');
    assert.doesNotMatch(result.stderr, /NETWORK_FORBIDDEN/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

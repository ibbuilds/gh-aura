import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { measure } from '../scripts/benchmark.mjs';
import { PROFILE_REFERENCE } from '../src/reference.mjs';

test('profile generation has a measured request budget and warm-cache regression gate', async () => {
  const result = await measure();
  assert.deepEqual(result.profileGeneration, { previousReadPlanRequests: 4, currentColdRequests: 2, currentWarmRequests: 0 });
});

test('shipped reference summary matches the recorded 100-account dataset', () => {
  const content = readFileSync(new URL('../research/profiles.json', import.meta.url));
  const study = JSON.parse(content);
  const blob = createHash('sha1').update('blob ' + content.length + '\0').update(content).digest('hex');
  assert.equal(blob, PROFILE_REFERENCE.sourceBlob);
  assert.equal(study.observed, 100);
  assert.equal(new Set(study.records.map((x) => x.login.toLowerCase())).size, 100);
  assert.equal(study.records.filter((x) => x.pinnedCount > 0).length, PROFILE_REFERENCE.observations.withPins);
  assert.equal(study.records.filter((x) => x.readme.status === 'observed').length, PROFILE_REFERENCE.observations.rootReadmesObserved);
  assert.ok(study.records.every((x) => !['bors', 'homu', 'pytorchbot'].includes(x.login.toLowerCase())));
  assert.ok(study.records.every((x) => !Object.hasOwn(x.readme, 'text')));
});

test('local editorial check makes zero network calls and strict mode is useful in scripts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gh-aura-editor-'));
  const file = join(directory, 'draft.md');
  writeFileSync(file, '# YOUR_NAME\n\nTODO\n');
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const expression = `globalThis.fetch=()=>{throw new Error('NETWORK_FORBIDDEN')};const {main}=await import(${JSON.stringify(cli)});await main(['check','--file',${JSON.stringify(file)},'--strict','--json']);`;
  try {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', expression], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).status, 'needs-review');
    assert.doesNotMatch(result.stderr, /NETWORK_FORBIDDEN/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

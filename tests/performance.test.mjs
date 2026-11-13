import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { measure } from '../scripts/benchmark.mjs';

test('profile generation has a measured request budget and warm-cache regression gate', async () => {
  const result = await measure();
  assert.deepEqual(result.profileGeneration, { previousReadPlanRequests: 4, currentColdRequests: 2, currentWarmRequests: 0 });
  assert.equal(result.wholeProfile.previousContextRequests,11);assert.equal(result.wholeProfile.currentContextRequests,8);
  assert.equal(result.wholeProfile.nativeDraftRequests,2);assert.ok(result.wholeProfile.contextBytes<16000);
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

// Development-only verification of the immutable research checkpoint.
// No network, tokens, browser, account writes or current-tree corpus required.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ORDINARY_REFERENCE, PROFILE_REFERENCE } from '../src/reference.mjs';
import { CURATED_PROFILE_PATTERNS } from '../src/profile-patterns.mjs';
import { correctVisualCollector } from './research-corrections.mjs';

const COMMIT = 'd978bbae0234b30390885fc17bb7f2b6d52bc21b';
const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 2 * 1024 * 1024,
    windowsHide: true, ...options,
  });
  if (result.error || result.status !== 0)
    throw new Error(result.error?.message || result.stderr || result.stdout || command + ' failed.');
  return result.stdout;
}

// Fail with an actionable instruction instead of silently downloading anything.
try { run('git', ['cat-file', '-e', COMMIT + '^{commit}']); }
catch {
  throw new Error('Research checkpoint is not present locally. Explicitly fetch it with: git fetch origin ' + COMMIT);
}
const directory = mkdtempSync(join(tmpdir(), 'gh-aura-research-verify-'));
try {
  const archive = join(directory, 'checkpoint.tar');
  run('git', ['archive', '--format=tar', '--output', archive, COMMIT]);
  run('tar', ['-xf', archive, '-C', directory]);
  const read = name => {
    const raw = readFileSync(join(directory, 'research', name));
    const blob = createHash('sha1').update('blob ' + raw.length + '\0').update(raw).digest('hex');
    return { data: JSON.parse(raw), blob };
  };
  for (const [file, reference] of [
    ['ordinary-engineers-200.json', ORDINARY_REFERENCE],
    ['company-profiles.json', PROFILE_REFERENCE],
    ['employer-observations.json', PROFILE_REFERENCE.employerSourced],
  ]) {
    const { data, blob } = read(file);
    assert.equal(blob, reference.sourceBlob, 'Research source changed: ' + file);
    assert.equal(data.records.length, reference.sampleSize);
    assert.equal(data.records.filter(x => x.structure.pins > 0).length, reference.observations.withPins);
    assert.ok(reference.source.includes('/' + COMMIT + '/'), 'Runtime citation must identify the checkpoint.');
  }
  const { data: bank } = read('profile-design-references.json');
  const originals = new Map(bank.entries.map(x => [x.id.toLowerCase(), x]));
  for (const pattern of CURATED_PROFILE_PATTERNS) {
    const source = originals.get(pattern.id.toLowerCase());
    assert.ok(source, 'Pattern has no archived source: ' + pattern.id);
    assert.equal(pattern.readmeUrl, source.readmeUrl);
    assert.ok(pattern.status.includes('provisional'));
  }
  // Keep the original collector, corpus, privacy and browser-summary tests with
  // the data and implementation they actually describe. These remain executable.
  const files = [
    'holistic-editorial-queue', 'holistic-graphql-retry', 'holistic-profile-curation',
    'holistic-profile-research', 'holistic-public-corpus', 'holistic-public-observations',
    'holistic-style-triage', 'holistic-visual-smoke', 'ordinary-reference',
    'performance', 'profile-patterns', 'profile-reference-bank',
  ].map(name => 'tests/' + name + '.test.mjs');
  const result = run(process.execPath, ['--test', ...files], {
    cwd: directory, env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '', GH_AURA_COLLAB_TOKEN: '' },
  });
  process.stdout.write(result.split('\n').filter(line => /^(ℹ |# (tests|pass|fail|skipped|duration))/.test(line)).join('\n') + '\n');
  process.stdout.write('Research checkpoint ' + COMMIT + ' and current runtime citations verified offline.\n');
  const collector=join(directory,'scripts','visual-profile-smoke.mjs'),fixed=correctVisualCollector(readFileSync(collector,'utf8'));
  writeFileSync(collector,fixed.source);
  run(process.execPath,['--test','tests/holistic-visual-smoke.test.mjs'],{cwd:directory,env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
  process.stdout.write('Corrected viewport collector passes archived summary contracts; historical observations remain unchanged.\n');
} finally {
  rmSync(directory, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (name) => resolve(root, name);

test('the first-run docs stay short and reference actual maintained files', () => {
  const limits = {
    'README.md': 6000,
    'docs/CLI.md': 8500,
    'docs/PRODUCT_PLAN.md': 6500,
    'docs/ARCHITECTURE.md': 5000,
  };
  for (const [path, maxLength] of Object.entries(limits)) {
    const body = readFileSync(file(path), 'utf8');
    assert.ok(body.length <= maxLength, path + ' grew beyond the concise reference budget');
    for (const match of body.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/i.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(file(path)), decodeURI(target))), path + ' has a missing link: ' + target);
    }
  }
});

test('legacy project-contributor collector is not in the current tree', () => {
  assert.equal(existsSync(file('research/profiles.json')), false);
  assert.equal(existsSync(file('scripts/research-profiles.mjs')), false);
  assert.equal(existsSync(file('research/ordinary-engineers-200.json')), true);
  assert.equal(existsSync(file('research/company-profiles.json')), true);
  assert.equal(existsSync(file('research/employer-observations.json')), true);
});

test('packaged surface is restricted to the runtime and essential documentation', () => {
  const manifest = JSON.parse(readFileSync(file('package.json'), 'utf8'));
  assert.deepEqual(manifest.files, ['src/', 'README.md', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md']);
  assert.deepEqual(Object.keys(manifest.bin), ['gh-aura']);
  assert.deepEqual(Object.keys(manifest.dependencies || {}), []);
});

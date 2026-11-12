import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (name) => resolve(root, name);

test('the first-run docs stay short and reference actual maintained files', () => {
  const limits = {
    'README.md': 3000,
    'CONTRIBUTING.md': 1000,
    'CHANGELOG.md': 1200,
    'SECURITY.md': 2700,
    'docs/CLI.md': 4000,
    'docs/ACTIVITY.md': 2500,
    'docs/ACHIEVEMENTS.md': 2500,
    'docs/BADGE_RUN.md': 2800,
    'docs/PRODUCT_PLAN.md': 2700,
    'docs/ARCHITECTURE.md': 2000,
    'docs/RELEASE_READINESS.md': 2200,
    'docs/RELEASE_NOTES.md': 1200,
    'docs/WORK.md': 1300,
    'docs/HUMAN_VALIDATION.md': 1400,
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
  assert.deepEqual(manifest.files, ['src/', 'README.md', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md',
    'AGENTS.md', 'llms.txt', 'skills/']);
  assert.deepEqual(Object.keys(manifest.bin), ['gh-aura']);
  assert.deepEqual(Object.keys(manifest.dependencies || {}), []);
  assert.ok(existsSync(file('AGENTS.md')));
  assert.ok(existsSync(file('llms.txt')));
  const skill=readFileSync(file('skills/gh-aura-profile/SKILL.md'),'utf8');
  assert.match(skill,/^---\nname: gh-aura-profile\ndescription:/);
  assert.match(skill,/agent's tools never publish|No agent tool can publish/);
});

test('published version and product plan remain in sync', () => {
  const manifest = JSON.parse(readFileSync(file('package.json'), 'utf8'));
  const plan = readFileSync(file('docs/PRODUCT_PLAN.md'), 'utf8');
  const release = readFileSync(file('docs/RELEASE_NOTES.md'), 'utf8');
  const changelog = readFileSync(file('CHANGELOG.md'), 'utf8');
  assert.ok(plan.includes('**Current release:** v' + manifest.version), 'stale product plan release');
  assert.ok(release.startsWith('# GH Aura v' + manifest.version), 'stale GitHub release notes');
  assert.ok(changelog.includes('## ' + manifest.version + ' —'), 'missing changelog release');
});

test('documentation is consolidated into ten short, linked product guides', () => {
  const docs = readdirSync(file('docs')).filter((name) => name.endsWith('.md'));
  assert.deepEqual(docs.sort(), [
    'ACHIEVEMENTS.md', 'ACTIVITY.md', 'ARCHITECTURE.md',
    'BADGE_RUN.md', 'CLI.md', 'HUMAN_VALIDATION.md',
    'PRODUCT_PLAN.md', 'RELEASE_NOTES.md', 'RELEASE_READINESS.md',
    'WORK.md',
  ]);
  const kept = ['README.md', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
    ...docs.map(name => 'docs/' + name), 'research/README.md'];
  for (const path of kept) {
    const body = readFileSync(file(path), 'utf8');
    for (const match of body.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/i.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(file(path)), decodeURI(target))),
        path + ' links to a deleted file: ' + target);
    }
  }
});

test('release workflow retains only latest release objects without deleting tags', () => {
  const script = readFileSync(file('.github/workflows/ci.yml'), 'utf8');
  assert.match(script, /gh release create "\$TAG"/);
  assert.match(script, /Keep only the current published GitHub Release/);
  assert.match(script, /gh release delete "\$old" --yes/);
  assert.match(script, /SHA256SUMS\.txt/);
  assert.doesNotMatch(script, /--cleanup-tag/);
  assert.doesNotMatch(script, /One-time, lease-guarded deletion of obsolete heads/);
});

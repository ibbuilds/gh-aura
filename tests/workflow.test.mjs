import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyProfile, approvalCode, previewProfile, profileTarget, readDraft, saveReview, readReview } from '../src/workflow.mjs';

const target = () => ({ login: 'octocat', repo: 'octocat/octocat', branch: 'main', path: 'README.md', sha: 'a'.repeat(40), content: '# Existing\n', exists: true });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('approval binds user, branch, path, revision and exact draft', () => {
  const before = target(), draft = '# Proposed\n';
  const code = approvalCode(before, draft);
  assert.equal(code.length, 64);
  for (const edit of [{ login: 'someone' }, { branch: 'other' }, { sha: 'b'.repeat(40) }, { path: 'other.md' }]) assert.notEqual(code, approvalCode({ ...before, ...edit }, draft));
  assert.notEqual(code, approvalCode(before, draft + '\n'));
  assert.match(previewProfile(before, draft), /--approve [a-f0-9]{64}/);
});

test('invalid approval never sends a write', async () => {
  let calls = 0;
  await assert.rejects(applyProfile(target(), '# Draft', '0'.repeat(64), { token: 'fake', fetch: async () => { calls++; } }), /Approval code mismatch/);
  assert.equal(calls, 0);
});

test('a newly reviewed identical draft is a no-op', async () => {
  const before = target();
  assert.equal((await applyProfile(before, before.content, approvalCode(before, before.content), { token: '' })).changed, false);
});

test('approved publishing requires token, pins branch and supplies GitHub SHA', async () => {
  const before = target(), draft = '# Proposed\n', code = approvalCode(before, draft);
  await assert.rejects(applyProfile(before, draft, code, { token: '' }), /requires GH_TOKEN/);
  let calls = 0;
  const result = await applyProfile(before, draft, code, { token: 'fake', fetch: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.github.com/repos/octocat/octocat/contents/README.md');
    assert.equal(options.method, 'PUT'); assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.branch, 'main'); assert.equal(body.sha, before.sha);
    assert.equal(Buffer.from(body.content, 'base64').toString(), draft);
    return response({ commit: { sha: 'b'.repeat(40), html_url: 'https://github.com/octocat/octocat/commit/b' } });
  } });
  assert.equal(calls, 1); assert.equal(result.changed, true);
});

for (const status of [403, 409, 422, 500]) test('publish HTTP ' + status + ' fails without retry', async () => {
  const before = target(), draft = '# New'; let calls = 0;
  await assert.rejects(applyProfile(before, draft, approvalCode(before, draft), { token: 'fake', fetch: async () => { calls++; return response({}, status); } }));
  assert.equal(calls, 1);
});

test('network failure during publish reports an uncertain outcome', async () => {
  const before = target(), draft = '# New';
  await assert.rejects(applyProfile(before, draft, approvalCode(before, draft), { token: 'fake', fetch: async () => { throw new Error('secret'); } }), /result is unknown/);
});

test('profile target reads only the public root README on a named branch', async () => {
  const remote = await profileTarget('octocat', { token: '', fetch: async (url, options) => {
    assert.equal(options.method, undefined);
    if (url.includes('/contents/')) {
      assert.match(url, /README.md\?ref=main$/);
      return response({ path: 'README.md', type: 'file', sha: 'a'.repeat(40), encoding: 'base64', content: Buffer.from('# Existing\n').toString('base64') });
    }
    return response({ full_name: 'octocat/octocat', private: false, default_branch: 'main' });
  } });
  assert.equal(remote.content, '# Existing\n'); assert.equal(remote.branch, 'main');
});

test('private, missing and malformed profile targets fail closed', async () => {
  await assert.rejects(profileTarget('octocat', { fetch: async () => response({ private: true }) }), /must be public/);
  await assert.rejects(profileTarget('octocat', { fetch: async () => response({}, 404) }), /Create the public/);
  await assert.rejects(profileTarget('octocat', { fetch: async () => response({ full_name: 'other/repo' }) }), /unexpected/);
});

test('oversized or terminal-controlled previews cannot produce approval', () => {
  assert.throws(() => previewProfile(target(), 'x\n'.repeat(601)), /No approval/);
  assert.throws(() => previewProfile(target(), '\u001b[2Jhidden'), /control characters/);
});

test('review files are explicit and bind the exact draft without copying tokens', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aura-review-'));
  try {
    const draft = join(dir, 'draft.md'), file = join(dir, 'review.json');
    writeFileSync(draft, '# Draft\n');
    const content = readDraft(draft);
    saveReview(file, target(), draft, content);
    assert.equal(readReview(file).approval, approvalCode(target(), content));
    assert.throws(() => saveReview(file, target(), draft, content), /EEXIST/);
    assert.throws(() => saveReview(draft, target(), draft, content, true), /overwrite the draft/);
    writeFileSync(draft, '# Different\n');
    assert.notEqual(readReview(file).approval, approvalCode(target(), readDraft(draft)));
    assert.doesNotMatch(readFileSync(file, 'utf8'), /GH_TOKEN/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

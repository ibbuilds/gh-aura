import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProfile, approvalCode, previewProfile, profileTarget } from '../src/workflow.mjs';

function target() {
  return {
    login: 'octocat', repo: 'octocat/octocat',
    path: 'README.md', sha: 'a'.repeat(40),
    content: '# Existing\n', exists: true,
  };
}

test('approval code is bound to the username, README revision and exact draft', () => {
  const remote = target();
  const code = approvalCode(remote, '# Proposed\n');
  assert.equal(code.length, 64);
  assert.notEqual(code, approvalCode(remote, '# Changed\n'));
  assert.notEqual(code, approvalCode({ ...remote, sha: 'b'.repeat(40) }, '# Proposed\n'));
  assert.notEqual(code, approvalCode({ ...remote, login: 'someoneelse' }, '# Proposed\n'));
});

test('preview contains diff and requires an explicit approval token', () => {
  const report = previewProfile(target(), '# Proposed\n');
  assert.match(report, /-# Existing/);
  assert.match(report, /\+# Proposed/);
  assert.match(report, /--approve [a-f0-9]{64}/);
  assert.match(report, /octocat\/octocat\/README.md/);
});

test('invalid approval never attempts a GitHub write', async () => {
  let called = 0;
  const before = globalThis.fetch;
  globalThis.fetch = async () => { called++; throw new Error('Must not send request'); };
  try {
    await assert.rejects(applyProfile(target(), '# Proposed\n', '0'.repeat(64), { token: 'fake' }), /Approval code mismatch/);
    assert.equal(called, 0);
  } finally { globalThis.fetch = before; }
});

test('approved unchanged draft is an idempotent no-op', async () => {
  const remote = target();
  const r = await applyProfile(remote, remote.content, approvalCode(remote, remote.content));
  assert.equal(r.changed, false);
});

test('approved change requires a token and uses existing SHA when writing', async () => {
  const remote = target();
  const proposed = '# Proposed\n';
  const code = approvalCode(remote, proposed);
  await assert.rejects(
    applyProfile(remote, proposed, code, { token: '' }), /requires GH_TOKEN/,
  );
  const before = globalThis.fetch;
  let putCount = 0;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers.Authorization, 'Bearer test-value');
    const payload = JSON.parse(options.body);
    assert.equal(payload.sha, 'a'.repeat(40));
    assert.equal(Buffer.from(payload.content, 'base64').toString('utf8'), proposed);
    putCount++;
    return {
      ok: true, status: 200,
      json: async () => ({ commit: { html_url: 'https://github.com/octocat/octocat/commit/abc' } }),
    };
  };
  try {
    const result = await applyProfile(remote, proposed, code, { token: 'test-value' });
    assert.equal(result.changed, true);
    assert.equal(putCount, 1);
    assert.match(result.commit, /\/commit\//);
  } finally { globalThis.fetch = before; }
});

test('profile target reads current GitHub README SHA and content without writing', async () => {
  const before = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, undefined);
    calls++;
    if (url.endsWith('/readme')) {
      return { ok: true, status: 200, json: async () => ({
        path: 'README.md', sha: 'c'.repeat(40), encoding: 'base64',
        content: Buffer.from('# Remote\n').toString('base64'),
      }) };
    }
    return { ok: true, status: 200, json: async () => ({ full_name: 'octocat/octocat' }) };
  };
  try {
    const remote = await profileTarget('octocat', { token: '' });
    assert.equal(remote.content, '# Remote\n');
    assert.equal(remote.sha, 'c'.repeat(40));
    assert.equal(calls, 2);
  } finally { globalThis.fetch = before; }
});

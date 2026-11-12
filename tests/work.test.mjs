import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { workTarget, validateWorkPath, workApproval, previewWork,
  saveWorkReview, readWorkReview, applyWork } from '../src/work.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

const repo = 'example/working-project';
const before = () => ({ repo, path: 'docs/setup.md', branch: 'main', private: false,
  exists: true, sha: 'a'.repeat(40), content: '# Old setup\n' });
const draft = '# Better setup\n\nThis is a real improved explanation of the setup procedure.\n';
const response = (body, status = 200) => Response.json(body, { status });

test('work path scope is limited to Markdown docs and root README', () => {
  for (const path of ['README.md', 'docs/guide.md', 'docs/reference/quick-start.md'])
    assert.equal(validateWorkPath(path), path);
  for (const path of ['src/auth.js', '.github/workflows/ci.yml', '../README.md',
    'docs/../../secrets.md', 'docs/.hidden.md', 'docs/README.txt'])
    assert.throws(() => validateWorkPath(path), /Markdown|unsafe/);
});

test('review fingerprint binds draft, current revision, repository, path and visibility', () => {
  const target = before();
  const code = workApproval(target, draft);
  assert.equal(code.length, 64);
  assert.notEqual(code, workApproval({ ...target, sha: 'b'.repeat(40) }, draft));
  assert.notEqual(code, workApproval({ ...target, private: true }, draft));
  assert.notEqual(code, workApproval({ ...target, path: 'docs/other.md' }, draft));
  assert.notEqual(code, workApproval(target, draft + 'changed'));
  const preview = previewWork(target, draft);
  assert.match(preview, /-# Old setup/);
  assert.match(preview, /\+# Better setup/);
  assert.match(preview, /No document, issue, PR, commit, achievement, or contribution has been created/);
});

test('review is saved locally without full text or tokens, never replacing the draft', () => {
  const folder = mkdtempSync(join(tmpdir(), 'aura-work-review-'));
  try {
    const file = join(folder, 'improvement.md');
    const review = join(folder, 'review.json');
    writeFileSync(file, draft);
    saveWorkReview(review, before(), file, draft);
    const saved = readWorkReview(review);
    assert.equal(saved.approval, workApproval(before(), draft));
    assert.equal(saved.path, 'docs/setup.md');
    assert.doesNotMatch(readFileSync(review, 'utf8'), /Better setup|GH_TOKEN/);
    assert.throws(() => saveWorkReview(review, before(), file, draft), /EEXIST/);
    assert.throws(() => saveWorkReview(file, before(), file, draft, true), /cannot replace/);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test('private repository requires explicit opt-in even when authenticated', async () => {
  const fetcher = async (url) => {
    assert.match(url, /\/repos\/example\/working-project$/);
    return response({ full_name: repo, default_branch: 'main', private: true, archived: false });
  };
  await assert.rejects(workTarget(repo, 'README.md', { token: 'testing', fetch: fetcher }), /explicitly pass --private/);
});

test('a wrong approval or identical document can never create a remote change', async () => {
  const current = before();
  let calls = 0;
  const fakeFetch = async () => { calls++; throw Error('NETWORK_FORBIDDEN'); };
  await assert.rejects(applyWork(current, draft, '0'.repeat(64),
    { token: 'testing', fetch: fakeFetch }), /Approval mismatch/);
  const result = await applyWork(current, current.content, workApproval(current, current.content),
    { token: '', fetch: fakeFetch });
  assert.equal(result.changed, false);
  assert.equal(calls, 0);
  await assert.rejects(applyWork(current, draft, workApproval(current, draft),
    { token: '', fetch: fakeFetch }), /scoped GitHub token/);
  assert.equal(calls, 0);
});

function createMockWorkAPI(target, proposed, alreadyOpen = false, extraChangedFile = false) {
  const calls = [];
  const branch = 'gh-aura/docs-' + workApproval(target, proposed).slice(0, 20);
  const fetch = async (url, init = {}) => {
    const path = url.replace('https://api.github.com', '');
    const method = init.method || 'GET';
    calls.push({ path, method, body: init.body ? JSON.parse(init.body) : null });
    if (path.includes('/git/ref/heads/' + branch)) {
      if (alreadyOpen) return response({ object: { sha: 'd'.repeat(40) } });
      return response({}, 404);
    }
    if (path.endsWith('/git/ref/heads/main')) return response({ object: { sha: 'b'.repeat(40) } });
    if (path.endsWith('/git/refs') && method === 'POST') return response({ ref: 'refs/heads/' + branch });
    if (path.endsWith('/contents/docs/setup.md') && method === 'PUT') {
      const body = JSON.parse(init.body);
      assert.equal(body.branch, branch);
      assert.equal(body.sha, target.sha);
      assert.equal(Buffer.from(body.content, 'base64').toString('utf8'), proposed);
      return response({ content: { path: 'docs/setup.md' }, commit: { sha: 'e'.repeat(40) } });
    }
    if (path.includes('/contents/docs/setup.md?ref=')) {
      return response({ type: 'file', sha: 'e'.repeat(40), path: 'docs/setup.md', size: Buffer.byteLength(proposed),
        encoding: 'base64', content: Buffer.from(proposed, 'utf8').toString('base64') });
    }
    if (path.includes('/compare/')) return response({ files: [
      { filename: target.path, status: 'modified' },
      ...(extraChangedFile ? [{ filename: 'src/unexpected.js', status: 'modified' }] : []),
    ] });
    if (path.includes('/pulls?') && method === 'GET') {
      return response(alreadyOpen ? [{ html_url: 'https://github.com/example/working-project/pull/12' }] : []);
    }
    if (path.endsWith('/pulls') && method === 'POST') return response({
      number: 12, html_url: 'https://github.com/example/working-project/pull/12',
    });
    throw new Error('Unexpected test URL: ' + method + ' ' + path);
  };
  return { fetch, calls, branch };
}

test('explicitly approved docs PR changes only the reviewed Markdown file', async () => {
  const target = before(), api = createMockWorkAPI(target, draft);
  const result = await applyWork(target, draft, workApproval(target, draft),
    { token: 'testing', fetch: api.fetch, sleep: async () => {} });
  assert.equal(result.changed, true);
  assert.equal(result.pullRequest, 'https://github.com/example/working-project/pull/12');
  assert.deepEqual(api.calls.filter((x) => x.method !== 'GET').map((x) => x.method),
    ['POST', 'PUT', 'POST']);
  assert.ok(api.calls.every((x) => !x.body?.autoMerge));
});

test('existing matching PR is reused without changing remote history', async () => {
  const target = before(), api = createMockWorkAPI(target, draft, true);
  const result = await applyWork(target, draft, workApproval(target, draft),
    { token: 'testing', fetch: api.fetch, sleep: async () => {} });
  assert.equal(result.changed, false);
  assert.match(result.message, /already open/);
  assert.equal(api.calls.filter((x) => x.method !== 'GET').length, 0);
});

test('unexpected extra files in branch abort PR creation and never merge', async () => {
  const target = before(), api = createMockWorkAPI(target, draft, false, true);
  await assert.rejects(applyWork(target, draft, workApproval(target, draft),
    { token: 'testing', fetch: api.fetch, sleep: async () => {} }), /unexpected changes/);
  assert.equal(api.calls.filter((x) => x.path.endsWith('/pulls') && x.method === 'POST').length, 0);
});

test('CLI refuses ambiguous or incomplete work writes before importing network code', () => {
  validateOptions('work', parseArgs(['preview', '--repo', repo, '--path', 'README.md',
    '--file', 'draft.md', '--save', 'review.json']));
  validateOptions('work', parseArgs(['apply', '--review', 'review.json']));
  assert.throws(() => validateOptions('work', parseArgs(['apply', '--repo', repo,
    '--review', 'review.json'])), /requires only --review/);
  assert.throws(() => validateOptions('work', parseArgs(['preview', '--file', 'draft.md'])), /requires --repo/);
  assert.throws(() => validateOptions('work', parseArgs(['apply', '--review', 'review.json', '--private'])), /requires only/);
});

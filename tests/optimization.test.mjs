import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReadCache } from '../src/cache.mjs';
import { getJSON, getSnapshot } from '../src/github.mjs';
import { preserveProfile } from '../src/render.mjs';
import { profileTarget, approvalCode } from '../src/workflow.mjs';
import { proposeProfile } from '../src/pull-request.mjs';
import { describeReadme } from '../src/inspection.mjs';
import { contributionsReport } from '../src/contributions.mjs';

const json = (body, status = 200, headers = {}) => new Response(status === 304 ? null : JSON.stringify(body), { status, headers });
const temporary = () => mkdtempSync(join(tmpdir(), 'gh-aura-cache-'));
const target = () => ({ login: 'example', repo: 'example/example', branch: 'main', path: 'README.md', sha: 'a'.repeat(40), content: '# Before\n', exists: true });
const content = (value) => ({ type: 'file', path: 'README.md', sha: 'a'.repeat(40), size: Buffer.byteLength(value), encoding: 'base64', content: Buffer.from(value).toString('base64') });

test('public cache reuses a response, revalidates ETag and never stores the token', async () => {
  const directory = temporary(); let now = 1000; let calls = 0;
  const cache = new ReadCache({ directory, now: () => now, ttl: 100 });
  const options = { cache, publicRead: true, token: 'secret-that-must-not-be-stored', fetch: async (_url, init) => {
    calls++;
    if (calls === 1) return json({ name: 'public' }, 200, { etag: '"revision-1"' });
    assert.equal(init.headers['If-None-Match'], '"revision-1"');
    return json(null, 304);
  } };
  try {
    assert.deepEqual(await getJSON('/repos/example/public', options), { name: 'public' });
    assert.deepEqual(await getJSON('/repos/example/public', options), { name: 'public' });
    assert.equal(calls, 1);
    now += 101;
    assert.deepEqual(await getJSON('/repos/example/public', options), { name: 'public' });
    assert.equal(calls, 2); assert.equal(cache.revalidated, 1);
    const files = readdirSync(directory);
    assert.equal(files.length, 1);
    assert.doesNotMatch(readFileSync(join(directory, files[0]), 'utf8'), /secret-that-must-not-be-stored/);
    assert.notEqual(cache.key('/a', 'first'), cache.key('/a', 'second'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('cached data never masks a stale-cache permission or rate-limit failure', async () => {
  const directory = temporary(); let now = 1000;
  const cache = new ReadCache({ directory, now: () => now, ttl: 10 });
  try {
    await getJSON('/users/example', { cache, token: '', publicRead: true, fetch: async () => json({ login: 'example' }) });
    now += 11;
    await assert.rejects(getJSON('/users/example', { cache, token: '', publicRead: true, fetch: async () => json({}, 429) }), /rate limit/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('private responses and unmarked reads are not written to disk', async () => {
  const directory = temporary(); const cache = new ReadCache({ directory });
  try {
    await getJSON('/repos/example/private', { cache, publicRead: true, fetch: async () => json({ private: true }) });
    await getJSON('/repos/example/public', { cache, fetch: async () => json({ private: false }) });
    assert.equal(readdirSync(directory).length, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('corrupt cache and oversized entries fail open to normal online reads', async () => {
  const directory = temporary(); const cache = new ReadCache({ directory });
  try {
    writeFileSync(join(directory, cache.key('/bad', '')), 'not JSON');
    assert.equal(cache.read('/bad', ''), null);
    cache.write('/large', '', 'x'.repeat(3 * 1024 * 1024));
    assert.equal(cache.read('/large', ''), null);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('bounded cache keeps at most 128 owned entries', () => {
  const directory = temporary(); const cache = new ReadCache({ directory });
  try {
    for (let n = 0; n < 135; n++) cache.write('/users/example-' + n, '', { n });
    assert.equal(readdirSync(directory).length, 128);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('a repeated public snapshot makes zero additional API calls', async () => {
  const directory = temporary(); const cache = new ReadCache({ directory }); let calls = 0;
  const options = { cache, token: '', fetch: async (url) => {
    calls++;
    if (url.includes('/contents/')) return json(content('# Example\n'));
    if (url.includes('/users/example/repos')) return json([]);
    if (url.includes('/users/')) return json({ login: 'example', type: 'User', public_repos: 0 });
    return json({ private: false, full_name: 'example/example', default_branch: 'main' });
  } };
  try {
    await getSnapshot('example', options); assert.equal(calls, 4);
    const second = await getSnapshot('example', options); assert.equal(calls, 4);
    assert.equal(second.dataAccess.cacheHits, 4);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('achievements/showcase/history can skip unused profile README calls', async () => {
  let calls = 0;
  await getSnapshot('example', { includeProfile: false, token: '', fetch: async (url) => {
    calls++;
    if (url.includes('/users/example/repos')) return json([]);
    assert.equal(url, 'https://api.github.com/users/example');
    return json({ login: 'example', type: 'User', public_repos: 0 });
  } });
  assert.equal(calls, 2);
});

test('publication targets always bypass caches, including caller-supplied ones', async () => {
  const cache = { read() { throw new Error('Publication read cache!'); } };
  let calls = 0;
  await profileTarget('example', { cache, publicRead: true, token: '', fetch: async (url) => {
    calls++;
    return url.includes('/contents/') ? json(content('# Current\n')) : json({ private: false, full_name: 'example/example', default_branch: 'main' });
  } });
  assert.equal(calls, 2);
});

test('managed README preserves all unmarked user text and supports repeated updates', () => {
  const original = '# Personal intro\n\nCustom links stay here.\n';
  const first = preserveProfile(original, '# Generated\n');
  assert.ok(first.startsWith(original));
  const withFooter = first + '\nCustom footer.\n';
  const second = preserveProfile(withFooter, '# Revised\n');
  assert.ok(second.startsWith(original)); assert.ok(second.endsWith('\nCustom footer.\n'));
  assert.match(second, /# Revised/); assert.doesNotMatch(second, /# Generated/);
  assert.throws(() => preserveProfile('<!-- gh-aura:end --><!-- gh-aura:start -->', '# New'), /one ordered/);
});

test('invalid inspected README is unknown rather than a fabricated successful inspection', () => {
  const result = describeReadme({ encoding: 'base64', content: '???' }, { full_name: 'example/repo' });
  assert.equal(result.state, 'unknown');
});

test('PR publishing opens one isolated branch and PR without merging', async () => {
  const remote = target(), draft = '# Proposed\n', code = approvalCode(remote, draft); const writes = [];
  const result = await proposeProfile(remote, draft, code, { token: 'fake', sleep: async () => {}, fetch: async (url, options) => {
    const method = options.method || 'GET';
    if (method !== 'GET') {
      writes.push({ url, method, body: JSON.parse(options.body) });
      return url.endsWith('/pulls') ? json({ number: 1, html_url: 'https://github.com/example/example/pull/1' }) : json({ object: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } });
    }
    if (url.includes('/git/ref/heads/gh-aura/')) return json({}, 404);
    if (url.endsWith('/git/ref/heads/main')) return json({ object: { sha: 'b'.repeat(40) } });
    if (url.includes('/contents/')) return json(content(draft));
    if (url.includes('/pulls?')) return json([]);
    throw new Error('Unexpected read: ' + url);
  } });
  assert.equal(writes.length, 3); assert.equal(writes[1].body.sha, remote.sha);
  assert.ok(writes[1].body.branch.startsWith('gh-aura/profile-'));
  assert.equal(writes[2].body.base, 'main'); assert.equal(result.changed, true);
  assert.ok(writes.every((entry) => !entry.url.includes('/merge')));
});

test('existing matching PR is reused without any writes', async () => {
  const remote = target(), draft = '# Proposed\n';
  const result = await proposeProfile(remote, draft, approvalCode(remote, draft), { token: 'fake', fetch: async (url, options) => {
    assert.equal(options.method, undefined);
    if (url.includes('/git/ref/')) return json({ object: { sha: 'b'.repeat(40) } });
    if (url.includes('/contents/')) return json(content(draft));
    return json([{ number: 1, html_url: 'https://github.com/example/example/pull/1' }]);
  } });
  assert.equal(result.changed, false);
});

test('stale approval and conflicting review branches never trigger writes', async () => {
  const remote = target(), draft = '# Proposed\n';
  await assert.rejects(proposeProfile(remote, draft, '0'.repeat(64), { token: 'fake', fetch: () => { throw new Error('Unexpected request'); } }), /Approval code mismatch/);
  await assert.rejects(proposeProfile(remote, draft, approvalCode(remote, draft), { token: 'fake', fetch: async (url, options) => {
    assert.equal(options.method, undefined);
    return url.includes('/contents/') ? json(content('# Someone else\n')) : json({ object: { sha: 'b'.repeat(40) } });
  } }), /not overwritten/);
});

test('detailed timeline is bounded, sourced and labels PR creation dates correctly', async () => {
  let calls = 0;
  const snapshot = { username: 'example', user: { created_at: '2020-01-01T00:00:00Z' }, repos: [{
    full_name: 'example/tool', name: 'tool', private: false, fork: false, archived: false, created_at: '2021-01-01T00:00:00Z',
  }] };
  const report = await contributionsReport(snapshot, { token: '', details: true, now: new Date('2026-11-11T12:00:00Z'), fetch: async (url) => {
    calls++;
    if (url.includes('/releases')) return json([{ published_at: '2022-01-01T00:00:00Z', tag_name: 'v1', html_url: 'https://github.com/example/tool/releases/tag/v1' }]);
    if (url.includes('/commits')) return json([{ sha: 'a'.repeat(40), author: { login: 'example' }, commit: { author: { date: '2021-06-01T00:00:00Z' } }, html_url: 'https://github.com/example/tool/commit/abc' }]);
    return json({ incomplete_results: false, items: [{ title: 'Fix a bug', created_at: '2023-01-01T00:00:00Z', pull_request: {}, html_url: 'https://github.com/example/tool/pull/1' }] });
  } });
  assert.equal(calls, 3); assert.equal(report.status, 'authentication_required');
  assert.ok(report.milestones.some((item) => item.event.startsWith('Opened PR (now merged)')));
  assert.equal(report.milestones.length, 5);
});


test('new authenticated content reads recheck visibility even when a listing was public', async () => {
  let calls = 0;
  await assert.rejects(getJSON('/repos/example/tool/readme', {
    publicRead: true, token: 'read-token', fetch: async (url) => {
      calls++; assert.equal(url, 'https://api.github.com/repos/example/tool');
      return json({ private: true });
    },
  }), /not publicly readable/);
  assert.equal(calls, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getSnapshot, getJSON, requestJSON, graphql, decodeReadme, validateLogin } from '../src/github.mjs';

const response = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const account = { login: 'example', type: 'User', public_repos: 200 };
function mockInventory(count, privateProfile = false) {
  const requests = [];
  return { requests, fetch: async (address, options) => {
    const url = new URL(address); requests.push(url);
    assert.equal(options.redirect, 'error');
    if (url.pathname === '/users/example') return response({ ...account, public_repos: count });
    if (url.pathname === '/users/example/repos') {
      assert.equal(url.searchParams.get('per_page'), '100');
      const first = (Number(url.searchParams.get('page')) - 1) * 100;
      return response(Array.from({ length: Math.min(100, Math.max(0, count - first)) }, (_, i) => ({
        full_name: 'example/repo-' + (first + i), name: 'repo-' + (first + i), private: false,
      })));
    }
    if (url.pathname === '/repos/example/example') return response({ private: privateProfile });
    if (url.pathname.endsWith('/contents/README.md')) return response(null, 404);
    throw new Error('Unexpected request');
  } };
}

for (const cap of [1, 99, 100, 101, 150, 200]) test('pagination is unique and capped at ' + cap, async () => {
  const mock = mockInventory(200);
  const snapshot = await getSnapshot('example', { maxRepos: cap, fetch: mock.fetch, token: '' });
  assert.equal(snapshot.repos.length, cap);
  assert.equal(new Set(snapshot.repos.map((repo) => repo.full_name)).size, cap);
  assert.equal(snapshot.truncated, cap < 200);
});

test('private profile README is not fetched or exported even with a token', async () => {
  const mock = mockInventory(1, true);
  const snapshot = await getSnapshot('example', { fetch: mock.fetch, token: 'private-access' });
  assert.equal(snapshot.profileReadme, null);
  assert.equal(mock.requests.some((url) => url.pathname.endsWith('README.md')), false);
});

test('missing resources differ from authentication failures', async () => {
  assert.equal(await getJSON('/test', { fetch: async () => response(null, 404) }), null);
  await assert.rejects(getJSON('/test', { fetch: async () => response({ message: 'do not print secret' }, 401) }), /rejected the token/);
});

for (const status of [403, 429]) test('rate limiting stops without immediate retry: ' + status, async () => {
  let count = 0;
  await assert.rejects(getJSON('/test', { fetch: async () => { count++; return response({}, status, { 'retry-after': '60' }); } }), /rate limit/);
  assert.equal(count, 1);
});

test('temporary read failure retries once; publishing never retries', async () => {
  let count = 0;
  const fetch = async () => response({}, ++count === 1 ? 503 : 200);
  assert.deepEqual(await getJSON('/test', { fetch, sleep: async () => {} }), {});
  assert.equal(count, 2);
  count = 0;
  await assert.rejects(requestJSON('/test', { method: 'PUT', body: {}, fetch }), /HTTP 503/);
  assert.equal(count, 1);
});

test('rejects unsafe API paths and malformed data', async () => {
  await assert.rejects(getJSON('//evil.example'), /relative GitHub API path/);
  await assert.rejects(getJSON('/test', { fetch: async () => new Response('not json') }), /invalid JSON/);
  assert.throws(() => validateLogin('../bad'), /valid GitHub username/);
  assert.throws(() => decodeReadme({ encoding: 'base64', content: 'a' }), /encoding/);
  assert.throws(() => decodeReadme({ encoding: 'none', content: '' }), /unavailable/);
});

test('GraphQL partial errors are not converted to invented counts', async () => {
  await assert.rejects(graphql('query { viewer { login } }', {}, { token: '', fetch: async () => response({}) }), /requires GH_TOKEN/);
  await assert.rejects(graphql('query { viewer { login } }', {}, { token: 'test', fetch: async () => response({ data: {}, errors: [{ message: 'private' }] }) }), /complete GraphQL data/);
});

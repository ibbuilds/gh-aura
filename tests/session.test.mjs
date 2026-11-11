import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadSession } from '../src/session.mjs';
const url = 'https://api.github.com/users/example';

test('request budget stops before an additional network call', async () => {
  let calls = 0;
  const session = new ReadSession({ maxRequests: 2, fetch: async () => { calls++; return new Response('{}'); } });
  for (let i = 0; i < 2; i++) await (await session.fetch(url)).json();
  await assert.rejects(session.fetch(url), /Request budget reached/);
  assert.equal(calls, 2);
  assert.equal(session.summary().responseBytes, 4);
});

test('oversized streamed response is cancelled instead of parsed partially', async () => {
  const session = new ReadSession({ maxResponseBytes: 10, fetch: async () => new Response(JSON.stringify({ large: 'x'.repeat(100) })) });
  await assert.rejects((await session.fetch(url)).json(), /bounded read budget/);
  assert.equal(session.failure.code, 'GH_AURA_BUDGET');
});

test('aggregate byte budget bounds many individually valid responses', async () => {
  const session = new ReadSession({ maxTotalBytes: 3, fetch: async () => new Response('{}') });
  await (await session.fetch(url)).json();
  await assert.rejects((await session.fetch(url)).json(), /bounded read budget/);
  await assert.rejects(session.fetch(url), /byte budget reached/);
  assert.equal(session.requests, 2);
});

test('read sessions cannot be used as a publishing path', async () => {
  let calls = 0;
  const session = new ReadSession({ fetch: async () => { calls++; return new Response('{}'); } });
  await assert.rejects(session.fetch(url, { method: 'PUT' }), /do not permit/);
  await assert.rejects(session.fetch('https://api.github.com/graphql', { method: 'POST', body: JSON.stringify({ query: 'mutation{danger}' }) }), /read-only/);
  assert.equal(calls, 0);
});

test('GraphQL query and 304 responses preserve transport semantics', async () => {
  const session = new ReadSession({ fetch: async () => new Response(null, { status: 304 }) });
  const response = await session.fetch('https://api.github.com/graphql', { method: 'POST', body: JSON.stringify({ query: 'query{viewer{login}}' }) });
  assert.equal(response.status, 304);
  assert.equal(session.bytes, 0);
});

test('summaries contain measurements but never tokens or URLs', async () => {
  const session = new ReadSession({ fetch: async () => new Response('{}') });
  await (await session.fetch(url, { headers: { Authorization: 'Bearer SECRET' } })).json();
  assert.doesNotMatch(JSON.stringify(session.summary()), /SECRET|https|Authorization/);
  assert.equal(session.summary().networkRequests, 1);
});

// Isolated subprocess fixture. Never forwards a request to a real service.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { snapshotForTest } from '../fixtures.mjs';
const snapshot = snapshotForTest();
const stateFile = process.env.GH_AURA_TEST_STATE;
const sha = (text) => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0' + text).digest('hex');
const initial = { content: '# Existing\n', puts: 0 };
const state = () => existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : initial;

globalThis.fetch = async (address, options = {}) => {
  const url = new URL(address), current = state();
  if (url.origin !== 'https://api.github.com') throw new Error('Fixture refuses other hosts');
  if (url.pathname === '/users/example') return Response.json({ ...snapshot.user, type: 'User', created_at: '2020-01-01T00:00:00Z' });
  if (url.pathname === '/users/example/repos') return Response.json(snapshot.repos);
  if (url.pathname === '/repos/example/example') return Response.json({ full_name: 'example/example', private: false, default_branch: 'main' });
  if (url.pathname === '/repos/example/example/contents/README.md') {
    if (options.method === 'PUT') {
      const body = JSON.parse(options.body);
      if (body.sha !== sha(current.content) || body.branch !== 'main') return Response.json({}, { status: 409 });
      const next = { content: Buffer.from(body.content, 'base64').toString(), puts: current.puts + 1 };
      writeFileSync(stateFile, JSON.stringify(next));
      return Response.json({ commit: { sha: sha(next.content), html_url: 'https://github.com/example/example/commit/' + sha(next.content) } });
    }
    return Response.json({ path: 'README.md', type: 'file', encoding: 'base64', sha: sha(current.content), content: Buffer.from(current.content).toString('base64') });
  }
  if (url.pathname.endsWith('/readme')) return Response.json({ encoding: 'base64', content: Buffer.from('# Tool\n\n## Installation\nInstall.\n\n## Usage\nRun.\n').toString('base64'), html_url: 'https://github.com/example/project' });
  if (url.pathname === '/search/issues') return Response.json({ total_count: 3, incomplete_results: false });
  throw new Error('Unexpected fixture URL: ' + url.pathname);
};

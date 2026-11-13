import { getJSON, requestJSON, validateLogin, tokenFor } from './github.mjs';
import { DEFAULT_CONFIG } from './config.mjs';
import { rankRepositories } from './engine.mjs';
import { describeReadme } from './inspection.mjs';
import { classifyRepositoryTree } from './project-evidence.mjs';
import { ReadSession } from './session.mjs';

const repoName = value => {
  if (typeof value !== 'string' || !/^[a-z\d-]{1,39}\/[a-z\d_.-]{1,100}$/i.test(value)) throw Error('Expected public OWNER/REPO.');
  validateLogin(value.split('/')[0]); return value;
};
export async function includeSelectedPublicProjects(snapshot,spec,options={}){
  for(const name of spec.sections.projects===false?[]:spec.featured.slice(0,spec.maxProjects)){
    const full=name.includes('/')?name:snapshot.username+'/'+name;repoName(full);
    if(snapshot.repos.some(r=>r.full_name.toLowerCase()===full.toLowerCase()))continue;
    const repo=await getJSON('/repos/'+full.split('/').map(encodeURIComponent).join('/'),{...options,publicRead:false,cache:undefined});
    if(!repo||repo.private!==false||repo.full_name?.toLowerCase()!==full.toLowerCase())throw Error('Selected public project is unavailable: '+full);
    snapshot.repos.push(repo);
  }
  return snapshot;
}
export async function inspectPublicProject(name, options = {}) {
  repoName(name);
  const base = '/repos/' + name.split('/').map(encodeURIComponent).join('/');
  const repo = await getJSON(base, { ...options, cache: undefined, publicRead: false });
  if (!repo || repo.private !== false || repo.full_name?.toLowerCase() !== name.toLowerCase()) throw Error('Public project is unavailable; no private data was exported.');
  const read = { ...options, publicRead: true };
  const readme = await getJSON(base + '/readme', read);
  const tree = await getJSON(base + '/git/trees/' + encodeURIComponent(repo.default_branch) + '?recursive=1', read);
  return { repository: repo.full_name, url: 'https://github.com/' + repo.full_name,
    description: repo.description || null, readme: describeReadme(readme, repo), source: classifyRepositoryTree(repo, tree),
    ownership: 'Public observation; the owner must confirm their personal contribution.', testsExecuted: false };
}
export async function inspectCurrentPins(user, options = {}) {
  validateLogin(user);
  if (!tokenFor(options)) return { state: 'unavailable', reason: 'Authenticated public GraphQL read is not configured.' };
  const response = await requestJSON('/graphql', { ...options, cache: undefined, method: 'POST', body: {
    query: 'query($login:String!){user(login:$login){pinnedItems(first:6){nodes{__typename ... on Repository{nameWithOwner url description isPrivate} ... on Gist{name url description isPublic}}}}}',
    variables: { login: user },
  } });
  const nodes = response?.data?.user?.pinnedItems?.nodes;
  if (!Array.isArray(nodes) || response.errors?.length) return { state: 'unknown', reason: 'Pinned items were not returned completely.' };
  return { state: 'observed', observedAt: new Date().toISOString(), items: nodes.filter(x => x && x.isPrivate !== true && x.isPublic !== false)
    .map(x => ({ type: x.__typename, name: x.nameWithOwner || x.name, url: x.url, description: x.description || null })) };
}
export async function scanPublicProjects(user, { goal = '', cursor = 1, pages = 5, limit = 6, inspect = 0, ...options } = {}) {
  validateLogin(user);
  if (typeof goal !== 'string' || goal.length > 160 || !Number.isInteger(cursor) || cursor < 1 || cursor > 100 ||
      !Number.isInteger(pages) || pages < 1 || pages > 20 || !Number.isInteger(limit) || limit < 1 || limit > 6 ||
      !Number.isInteger(inspect) || inspect < 0 || inspect > 6) throw Error('Invalid bounded project scan.');
  const session = new ReadSession({ maxRequests: options.maxRequests ?? 60, fetch: options.fetch || globalThis.fetch });
  const api = { ...options, fetch: session.fetch, cache: undefined, publicRead: true };
  const repos = [], seen = new Set(); let page = cursor, complete = false;
  for (let i = 0; i < pages && page <= 100; i++, page++) {
    const batch = await getJSON('/users/' + encodeURIComponent(user) + '/repos?' + new URLSearchParams({ type: 'owner', sort: 'full_name', per_page: '100', page: String(page) }), api);
    if (!Array.isArray(batch)) throw Error('Project page was not returned.');
    for (const repo of batch) if (repo?.private === false && typeof repo.full_name === 'string' && !seen.has(repo.full_name.toLowerCase())) { repos.push(repo); seen.add(repo.full_name.toLowerCase()); }
    if (batch.length < 100) { complete = true; break; }
  }
  const config = structuredClone(DEFAULT_CONFIG); config.showcase.goal = goal;
  const snapshot = { username: user, observedAt: new Date().toISOString(), repos };
  const ranked = rankRepositories(snapshot, config, { goal, limit });
  for (const entry of ranked.slice(0, inspect)) entry.inspectedEvidence = await inspectPublicProject(entry.repo.full_name, api);
  return { format: 'gh-aura-project-candidates-v1', user, goal, coverage: { startPage: cursor, scanned: repos.length,
    complete, nextCursor: complete || page > 100 ? null : page, capped: !complete && page > 100 },
    candidates: ranked.map(x => ({ repository: x.repo.full_name, description: x.repo.description || null,
      url: 'https://github.com/' + x.repo.full_name, fork: x.repo.fork === true, score: x.score, reasons: x.reasons,
      limitations: x.limitations, evidence: x.inspectedEvidence || { state: 'not-inspected' } })),
    usage: session.summary(),
    continuation: 'For subsequent pages, compare candidates using the same goal; explicitly selected projects can be inspected directly.' };
}

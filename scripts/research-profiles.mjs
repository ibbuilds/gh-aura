// Explicit, bounded public-profile study. Never run on ordinary CLI commands.
// Persist structural observations, not biographies, README text, emails or images.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const projects = ['python/cpython', 'rust-lang/rust', 'golang/go', 'kubernetes/kubernetes', 'nodejs/node', 'microsoft/vscode', 'vuejs/core', 'sveltejs/svelte', 'pallets/flask', 'scikit-learn/scikit-learn', 'pytorch/pytorch', 'rails/rails'];
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('An authenticated read token is required for this optional research command.');
let requests = 0;
async function api(path, body) {
  if (++requests > 40) throw new Error('Study request budget exhausted.');
  const response = await fetch('https://api.github.com' + path, {
    method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'gh-aura-profile-study', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error('Study stopped on HTTP ' + response.status + '; no automatic retry or quota bypass.');
  const reader = response.body.getReader(); let bytes = 0; const chunks = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 4 * 1024 * 1024) { await reader.cancel(); throw new Error('Study response exceeds 4 MiB.'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const lists = [];
for (const project of projects) {
  const contributors = await api('/repos/' + project + '/contributors?per_page=20&anon=false');
  if (!Array.isArray(contributors)) throw new Error('Invalid contributor response.');
  lists.push(contributors.filter((x) => x.type === 'User' && !['bors','homu','highfive','rust-timer','rust-lang-ci','pytorchbot','pytorchmergebot','web-flow','mergify','codecov'].includes(x.login.toLowerCase()) && /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(x.login) && !/bot$/i.test(x.login)).map((x) => ({ login: x.login, project, contributions: x.contributions })));
}
const candidates = [], seen = new Set();
for (let rank = 0; rank < 20 && candidates.length < 100; rank++) for (const list of lists) {
  const item = list[rank]; if (!item || seen.has(item.login.toLowerCase()) || candidates.length >= 100) continue;
  seen.add(item.login.toLowerCase()); candidates.push({ ...item, selectedRank: rank + 1 });
}
const records = [], errors = [];
for (let offset = 0; offset < candidates.length; offset += 5) {
  const batch = candidates.slice(offset, offset + 5);
  const definitions = batch.map((_, i) => '$u' + i + ':String!').join(',');
  const fields = batch.map((_, i) => `p${i}:user(login:$u${i}){login bio websiteUrl pinnedItems(first:6,types:[REPOSITORY]){nodes{...on Repository{nameWithOwner description url isPrivate}}} repository(name:$u${i}){isPrivate object(expression:"HEAD:README.md"){...on Blob{text oid byteSize}}}}`).join('\n');
  const result = await api('/graphql', { query: 'query(' + definitions + '){' + fields + '}', variables: Object.fromEntries(batch.map((x, i) => ['u' + i, x.login])) });
  for (let i = 0; i < batch.length; i++) {
    const selected = batch[i]; const profile = result.data?.['p' + i];
    // A missing optional USER/USER repository must not exclude an otherwise valid profile.
    const localErrors = (result.errors || []).filter((error) => !error.path || error.path[0] === 'p' + i);
    const affected = localErrors.some((error) => error.path?.[1] !== 'repository' || error.type !== 'NOT_FOUND');
    if (!profile || affected) { errors.push({ login: selected.login, reason: 'Profile unavailable or partial GraphQL response', types: localErrors.map((x) => x.type || 'unknown') }); continue; }
    const blob = profile.repository?.isPrivate === false ? profile.repository.object : null;
    const raw = typeof blob?.text === 'string' && blob.byteSize <= 128 * 1024 ? blob.text : null;
    const body = raw?.replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ') || '';
    const pins = (profile.pinnedItems?.nodes || []).filter((x) => x && x.isPrivate === false);
    records.push({ login: profile.login, source: 'https://github.com/' + profile.login,
      selection: { project: selected.project, contributorRank: selected.selectedRank, contributions: selected.contributions, source: 'https://api.github.com/repos/' + selected.project + '/contributors?per_page=20&anon=false' },
      hasBio: Boolean(profile.bio?.trim()), hasWebsite: Boolean(profile.websiteUrl), pinnedCount: pins.length,
      pinsWithDescription: pins.filter((x) => x.description?.trim()).length,
      pinnedRepositories: pins.map((x) => x.nameWithOwner),
      readme: raw === null ? { status: blob ? 'unavailable-or-oversized' : 'not-observed-at-root-README.md' } : {
        status: 'observed', blobSha: blob.oid, sha256: createHash('sha256').update(raw).digest('hex'), bytes: blob.byteSize,
        approximateWords: body.split(/\s+/u).filter(Boolean).length,
        headings: (raw.match(/^#{1,6}\s+.+/gm) || []).length,
        images: (raw.match(/!\[[^\]]*\]\([^)]*\)|<img\b/gi) || []).length,
        links: (raw.match(/(?<!!)\[[^\]]+\]\([^)]*\)|<a\b/gi) || []).length,
        externalStatCards: /github-readme-stats|github-readme-streak-stats|github-profile-trophy|streak-stats\.demolab/i.test(raw),
      } });
  }
}
const observed = records.filter((x) => x.readme.status === 'observed');
const quantile = (xs, q) => { const sorted = xs.toSorted((a, b) => a - b); return sorted.length ? sorted[Math.floor((sorted.length - 1) * q)] : null; };
const study = {
  schema: 'gh-aura-profile-study-v1', observedAt: new Date().toISOString(),
  method: 'Round-robin selection from top 20 public contributors of 12 explicitly listed mature projects; exclude bots, deduplicate, cap at 100. Five profiles per read-only GraphQL query. Root HEAD:README.md only. Structural heuristics, not individual quality ratings.',
  limitations: ['Purposive open-source sample; not representative of all software engineers or hiring success.', 'Contributor counts do not establish employment, seniority or individual engineering quality.', 'Missing root README is not an absent profile or evidence of low quality.', 'No copied biographies or README text. No causal claims about which presentation obtains employment.', 'Current API observations can change. Private data is discarded.'],
  projects, requests, selected: candidates.length, observed: records.length, errors,
  summary: { withBio: records.filter((x) => x.hasBio).length, withWebsite: records.filter((x) => x.hasWebsite).length,
    withPins: records.filter((x) => x.pinnedCount > 0).length, pinMedian: quantile(records.map((x) => x.pinnedCount), 0.5),
    readmesObserved: observed.length, readmeWords: { p25: quantile(observed.map((x) => x.readme.approximateWords), .25), median: quantile(observed.map((x) => x.readme.approximateWords), .5), p75: quantile(observed.map((x) => x.readme.approximateWords), .75) },
    readmesWithoutImages: observed.filter((x) => x.readme.images === 0).length,
    readmesWithStatCards: observed.filter((x) => x.readme.externalStatCards).length,
    readmesWithLinks: observed.filter((x) => x.readme.links > 0).length }, records,
};
console.log(JSON.stringify({ observedAt: study.observedAt, selected: study.selected, observed: study.observed, requests, summary: study.summary, errors }, null, 2));
if (records.length !== 100) throw new Error('Expected 100 complete public observations; got ' + records.length + '.');
mkdirSync('research', { recursive: true });
writeFileSync('research/profiles.json', JSON.stringify(study, null, 2) + '\n');

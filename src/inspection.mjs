import { getJSON, decodeReadme } from './github.mjs';
import { rankRepositories, selectFeatured } from './engine.mjs';

const API = '/repos/';

function features(readme) {
  const text = readme.slice(0, 120_000);
  return {
    installation: /(^|\n)#{1,5}\s*(install(?:ation)?|setup|getting started|quick ?start)\b/im.test(text),
    usage: /(^|\n)#{1,5}\s*(usage|example(?:s)?|how to use|demo)\b/im.test(text),
    documentation: /(^|\n)#{1,5}\s*(docs|documentation|api|reference)\b/im.test(text),
    testing: /(^|\n)#{1,5}\s*(test(?:s|ing)?|quality assurance)\b/im.test(text),
  };
}

export function describeReadme(response, repo) {
  if (!response) return {
    state: 'missing',
    url: 'https://github.com/' + repo.full_name,
    features: {},
  };
  if (response.encoding !== 'base64' || typeof response.content !== 'string') return {
    state: 'unknown',
    url: response.html_url || 'https://github.com/' + repo.full_name,
    features: {},
    reason: 'GitHub did not provide decodable README content.',
  };
  let content;
  try { content = decodeReadme(response); }
  catch { return { state: 'unknown', url: response.html_url || 'https://github.com/' + repo.full_name,
    features: {}, reason: 'README is oversized or not valid UTF-8/base64.' }; }
  return {
    state: 'available',
    url: response.html_url || 'https://github.com/' + repo.full_name,
    bytes: Buffer.byteLength(content),
    features: features(content),
  };
}

/**
 * Optional GitHub README inspection. User-selected projects are inspected first,
 * then remaining requests go to recommended public projects.
 * Uninspected projects are unknown, never assumed to lack a README.
 */
export function pickRepositories(snapshot, config, count) {
  if (!Number.isInteger(count) || count < 0 || count > 20) throw new Error('Repository inspection count must be between 0 and 20.');
  const chosen = config.profile.featured.length
    ? selectFeatured(snapshot, config).map((repo) => ({ repo })) : [];
  const ranked = rankRepositories(snapshot, config, { limit: count });
  const seen = new Set();
  return [...chosen, ...ranked].filter(({ repo }) => {
    if (seen.has(repo.full_name)) return false;
    seen.add(repo.full_name); return true;
  }).slice(0, count);
}

export async function inspectRepositories(snapshot, config, count, options = {}) {
  if (!Number.isInteger(count) || count < 0 || count > 20) {
    throw new Error('--inspect must be between 0 and 20.');
  }
  if (count === 0) return snapshot;
  const picks = pickRepositories(snapshot, config, count);
  const byName = new Map(snapshot.repos.map((repo) => [repo.full_name, repo]));
  for (const { repo } of picks) {
    const [owner, name] = repo.full_name.split('/');
    const path = API + encodeURIComponent(owner) + '/' + encodeURIComponent(name) + '/readme';
    try {
      const response = await getJSON(path, { ...options, publicRead: true });
      byName.get(repo.full_name).inspection = describeReadme(response, repo);
    } catch (error) {
      if ([401, 403, 429].includes(error.status)) throw error;
      byName.get(repo.full_name).inspection = { state: 'unknown', features: {},
        url: 'https://github.com/' + repo.full_name, reason: 'README request failed; no missing file was inferred.' };
    }
  }
  return { ...snapshot, inspectionCount: picks.length };
}

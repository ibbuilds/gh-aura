import { getJSON } from './github.mjs';
import { rankRepositories } from './engine.mjs';

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
  const content = Buffer.from(response.content.replace(/\s/g, ''), 'base64').toString('utf8');
  return {
    state: 'available',
    url: response.html_url || 'https://github.com/' + repo.full_name,
    bytes: Buffer.byteLength(content),
    features: features(content),
  };
}

/**
 * Optional GitHub README inspection. Only top-ranked public repositories are inspected.
 * Uninspected projects are unknown, never assumed to lack a README.
 */
export async function inspectRepositories(snapshot, config, count, options = {}) {
  if (!Number.isInteger(count) || count < 0 || count > 20) {
    throw new Error('--inspect must be between 0 and 20.');
  }
  if (count === 0) return snapshot;
  const picks = rankRepositories(snapshot, config, { limit: count });
  const byName = new Map(snapshot.repos.map((repo) => [repo.full_name, repo]));
  for (const { repo } of picks) {
    const [owner, name] = repo.full_name.split('/');
    const path = API + encodeURIComponent(owner) + '/' + encodeURIComponent(name) + '/readme';
    const response = await getJSON(path, options);
    byName.get(repo.full_name).inspection = describeReadme(response, repo);
  }
  return { ...snapshot, inspectionCount: picks.length };
}

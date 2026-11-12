import { getJSON } from './github.mjs';
import { pickRepositories } from './inspection.mjs';

const CATEGORIES = {
  tests: /(?:^|\/)(?:__tests__|tests?|specs?)(?:\/|$)|(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/i,
  ci: /^\.github\/workflows\/[^/]+\.ya?ml$/i,
  manifest: /(?:^|\/)(?:package\.json|pnpm-lock\.yaml|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle(?:\.kts)?|composer\.json|Makefile|CMakeLists\.txt)$/i,
  architecture: /(?:^|\/)(?:ARCHITECTURE|DESIGN|ADR|CONTRIBUTING)\.md$|(?:^|\/)docs\/(?:architecture|design|adr)(?:\/|$)/i,
  examples: /(?:^|\/)(?:examples?|demos?|samples?)(?:\/|$)/i,
  license: /^(?:LICENSE|LICENCE)(?:\..+)?$/i,
};

/** No source code or README prose is downloaded: filenames only from a public Git tree. */
export function classifyRepositoryTree(repo, tree, observedAt = new Date().toISOString()) {
  const root = 'https://github.com/' + repo.full_name;
  const branch = String(repo.default_branch || 'HEAD');
  const link = (path) => root + '/blob/' + branch.split('/').map(encodeURIComponent).join('/') +
    '/' + path.split('/').map(encodeURIComponent).join('/');
  const complete = tree?.truncated === false;
  if (!tree || !Array.isArray(tree.tree)) {
    return { state: 'unknown', observedAt, filesScanned: 0, truncated: null,
      categories: {}, note: 'Git tree unavailable; no missing files inferred.' };
  }
  const files = tree.tree.filter((f) => f?.type === 'blob' && typeof f.path === 'string' && f.path.length < 300);
  const categories = {};
  for (const [id, pattern] of Object.entries(CATEGORIES)) {
    const matched = files.filter((f) => pattern.test(f.path));
    categories[id] = {
      status: matched.length ? 'observed' : complete ? 'not-observed' : 'unknown',
      paths: matched.slice(0, 3).map((f) => f.path),
      sources: matched.slice(0, 3).map((f) => link(f.path)),
    };
  }
  return {
    state: complete ? 'available' : 'partial',
    observedAt, filesScanned: files.length, truncated: tree.truncated !== false,
    source: root + '/tree/' + branch.split('/').map(encodeURIComponent).join('/'),
    categories,
    note: 'Presence of files is not proof of passing tests, working CI, security or individual authorship. Truncated trees make missing results unknown.',
  };
}

/**
 * Bounded to 0–5 explicitly chosen or otherwise recommended public projects.
 * One Git tree request per repo, excluding an authenticated metadata visibility
 * verification that may be required to prevent private-data leakage.
 */
export async function inspectProjectEvidence(snapshot, config, count, options = {}) {
  if (!Number.isInteger(count) || count < 0 || count > 5) {
    throw new Error('--deep must be between 0 and 5.');
  }
  if (!count) return snapshot;
  const picks = pickRepositories(snapshot, config, count);
  for (const { repo } of picks) {
    if (repo.private !== false || !repo.default_branch || repo.archived) {
      repo.evidence = { state: 'unknown', note: 'Public default branch is unavailable or repo archived.', categories: {} };
      continue;
    }
    const [owner, name] = repo.full_name.split('/');
    const branch = encodeURIComponent(repo.default_branch);
    const path = '/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(name) +
      '/git/trees/' + branch + '?recursive=1';
    try {
      const tree = await getJSON(path, { ...options, publicRead: true });
      repo.evidence = classifyRepositoryTree(repo, tree);
    } catch (error) {
      if ([401, 403, 429].includes(error.status) || /budget|exceeds|GitHub request/i.test(error.message)) throw error;
      repo.evidence = { state: 'unknown', categories: {}, note: 'Git tree could not be inspected; no missing code quality signals inferred.' };
    }
  }
  return snapshot;
}

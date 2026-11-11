const ROOT = 'https://api.github.com';
export const API_VERSION = '2026-03-10';

export function validateLogin(login) {
  if (typeof login !== 'string' || login.length > 39 || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(login) || login.includes('--')) {
    throw new Error('Provide a valid GitHub username (for example, octocat).');
  }
  return login;
}

export function tokenFor(options = {}) { return options.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? ''; }

export function headersFor(options = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'gh-aura-cli', 'X-GitHub-Api-Version': API_VERSION };
  const token = tokenFor(options);
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}

export class GitHubError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'GitHubError'; this.status = status; }
}

/** Fixed origin, no credential-bearing redirects, no automatic retries of writes. */
export async function requestJSON(path, options = {}) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\s\\]/.test(path)) throw new Error('Expected a relative GitHub API path.');
  const method = options.method || 'GET';
  const attempts = method === 'GET' ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response;
    try {
      response = await (options.fetch ?? globalThis.fetch)(ROOT + path, {
        ...(method === 'GET' ? {} : { method }), headers: { ...headersFor(options), ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        redirect: 'error', signal: AbortSignal.timeout(options.timeout ?? 15000),
      });
    } catch {
      throw new GitHubError(method === 'PUT' ? 'Network error during publish; the result is unknown. Run preview again before retrying.'
        : 'GitHub could not be reached. Check your connection and retry.');
    }
    if (response.status === 404 && method === 'GET' && options.allowMissing !== false) return null;
    if ([502, 503, 504].includes(response.status) && attempt + 1 < attempts) {
      await (options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(250); continue;
    }
    if (!response.ok) {
      const header = (key) => response.headers?.get?.(key);
      const limited = response.status === 429 || (response.status === 403 && (header('x-ratelimit-remaining') === '0' || header('retry-after')));
      if (limited) {
        const seconds = Number(header('retry-after'));
        throw new GitHubError('GitHub API rate limit reached. ' + (seconds > 0 ? 'Retry after at least ' + seconds + ' seconds.' : 'Wait before retrying; use GH_TOKEN for public API requests.'), response.status);
      }
      const message = response.status === 401 ? 'GitHub rejected the token. Check GH_TOKEN/GITHUB_TOKEN.'
        : response.status === 403 ? 'GitHub denied access. Check token permissions, repository rules and rate limits.'
        : [409, 422].includes(response.status) ? 'GitHub rejected the update (conflict or validation). Run preview again.'
        : 'GitHub request failed (HTTP ' + response.status + ').';
      throw new GitHubError(message, response.status);
    }
    try { return await response.json(); }
    catch { throw new GitHubError(method === 'PUT' ? 'Publish returned an unreadable response; the result is unknown. Run preview again.' : 'GitHub returned an invalid JSON response.', response.status); }
  }
}

export const getJSON = (path, options = {}) => requestJSON(path, { ...options, method: 'GET' });

export async function graphql(query, variables, options = {}) {
  if (!tokenFor(options)) throw new Error('Contribution history requires GH_TOKEN or GITHUB_TOKEN (read access).');
  const result = await requestJSON('/graphql', { ...options, method: 'POST', body: { query, variables } });
  if (!result || result.errors?.length || !result.data) throw new GitHubError('GitHub could not return complete GraphQL data. Check token access and retry later.');
  return result.data;
}

export function decodeReadme(data, maxBytes = 1024 * 1024) {
  if (!data || data.encoding !== 'base64' || typeof data.content !== 'string' || data.size > maxBytes) throw new Error('README content is unavailable or too large to inspect.');
  const encoded = data.content.replace(/\s/g, '');
  if (encoded.length > Math.ceil(maxBytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid or oversized README encoding.');
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length > maxBytes || buffer.toString('base64') !== encoded) throw new Error('Invalid or oversized README encoding.');
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

export async function getSnapshot(username, options = {}) {
  const login = validateLogin(username);
  const path = encodeURIComponent(login);
  const maxRepos = options.maxRepos ?? 200;
  if (!Number.isInteger(maxRepos) || maxRepos < 1 || maxRepos > 500) throw new Error('Repository limit must be between 1 and 500.');
  const user = await getJSON('/users/' + path, options);
  if (!user) throw new Error('GitHub user not found: ' + login);
  if (user.type && user.type !== 'User') throw new Error('GH Aura supports personal GitHub accounts, not organizations.');
  validateLogin(user.login);
  const repos = [], seen = new Set();
  let exhausted = false;
  // Stable page size prevents duplicate offsets when the configured cap is not a multiple of 100.
  for (let page = 1; repos.length < maxRepos && page <= 6; page++) {
    const batch = await getJSON('/users/' + path + '/repos?type=owner&sort=full_name&per_page=100&page=' + page, options);
    if (!Array.isArray(batch)) throw new GitHubError('GitHub returned an invalid repository list.');
    for (const repo of batch) {
      if (repo.private !== false || seen.has(repo.full_name)) continue;
      seen.add(repo.full_name); repos.push(repo);
    }
    if (batch.length < 100) { exhausted = true; break; }
  }
  const publicRepos = repos.slice(0, maxRepos);
  const warnings = [];
  let profileReadme = null, readme;
  try {
    // A token may see private data. Confirm visibility before reading profile contents.
    const profileRepo = await getJSON('/repos/' + path + '/' + path, options);
    if (profileRepo && profileRepo.private === false) {
      readme = await getJSON('/repos/' + path + '/' + path + '/contents/README.md', options);
      if (readme) profileReadme = { exists: true, content: decodeReadme(readme), url: readme.html_url || 'https://github.com/' + user.login + '/' + user.login };
    }
  } catch (error) {
    if ([401, 403, 429].includes(error.status)) throw error;
    profileReadme = { exists: Boolean(readme), content: '', unknown: true, url: 'https://github.com/' + user.login };
    warnings.push('Profile README could not be inspected: ' + error.message);
  }
  return { username: user.login, observedAt: new Date().toISOString(), user, repos: publicRepos, profileReadme, warnings,
    truncated: repos.length > maxRepos || (!exhausted && user.public_repos > publicRepos.length) };
}

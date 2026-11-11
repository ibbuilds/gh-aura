const ROOT = 'https://api.github.com';

export function validateLogin(login) {
  if (typeof login !== 'string' || login.length > 39 || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(login) || login.includes('--')) {
    throw new Error('Provide a valid GitHub username (for example, octocat).');
  }
  return login;
}

export async function getJSON(path, options = {}) {
  const token = options.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gh-aura-cli',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(ROOT + path, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const rateLimited = response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0';
    throw new Error(rateLimited
      ? 'GitHub API rate limit reached. Retry later or supply GH_TOKEN with read access.'
      : 'GitHub API request failed (HTTP ' + response.status + ').');
  }
  return response.json();
}

export async function getSnapshot(username, options = {}) {
  const login = validateLogin(username);
  const path = encodeURIComponent(login);
  const maxRepos = options.maxRepos ?? 200;
  const user = await getJSON('/users/' + path, options);
  if (!user) throw new Error('GitHub user not found: ' + login);

  const repoPages = [];
  for (let page = 1; repoPages.length < maxRepos; page++) {
    const pageSize = Math.min(100, maxRepos - repoPages.length);
    const url = '/users/' + path + '/repos?type=owner&sort=pushed&per_page=' + pageSize + '&page=' + page;
    const batch = await getJSON(url, options);
    if (!batch || !Array.isArray(batch)) break;
    repoPages.push(...batch);
    if (batch.length < pageSize) break;
  }

  const readme = await getJSON('/repos/' + path + '/' + path + '/readme', options);
  let profileReadme = null;
  if (readme && readme.content && readme.encoding === 'base64') {
    const content = Buffer.from(readme.content.replace(/\s/g, ''), 'base64').toString('utf8');
    profileReadme = {
      exists: true,
      content,
      url: 'https://github.com/' + login + '/' + login + '/blob/HEAD/' + (readme.path || 'README.md'),
    };
  } else if (readme) {
    profileReadme = { exists: true, content: '', url: readme.html_url || null };
  }
  return {
    username: user.login,
    observedAt: new Date().toISOString(),
    user,
    repos: repoPages.filter((repo) => repo.private === false),
    profileReadme,
    truncated: typeof user.public_repos === 'number' && repoPages.length < user.public_repos && repoPages.length >= maxRepos,
  };
}

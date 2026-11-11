const clamp = (value) => Math.max(0, Math.min(1, value));
const lower = (value) => String(value || '').toLowerCase();
const matches = (set, repo) => set.has(lower(repo.full_name)) || set.has(lower(repo.name));

export function rankRepositories(snapshot, config, options = {}) {
  const terms = [...new Set(((options.goal ?? config.showcase.goal) + ' ' + config.showcase.topics.join(' '))
    .toLowerCase().split(/[^a-z0-9+#.]+/).filter((term) => term.length > 1))];
  const excluded = new Set([...config.showcase.excluded, ...config.profile.excluded].map(lower));
  const preferred = new Set(config.showcase.preferred.map(lower));
  const now = options.now ?? (Date.parse(snapshot.observedAt) || Date.now());
  const weights = config.showcase.weights;
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const candidates = snapshot.repos.filter((repo) => !matches(excluded, repo) &&
    lower(repo.full_name) !== lower(snapshot.username + '/' + snapshot.username)).map((repo) => {
    const searchable = lower([repo.name, repo.description, repo.language, ...(repo.topics || [])].join(' '));
    const relevant = terms.filter((term) => searchable.includes(term));
    const inspected = repo.inspection;
    const metadata = (repo.description ? 0.25 : 0) + (repo.topics?.length ? 0.15 : 0) + (repo.homepage ? 0.15 : 0);
    const known = ['available', 'missing'].includes(inspected?.state);
    const docs = (inspected?.state === 'available' ? 0.25 : 0) +
      (inspected?.features?.installation ? 0.1 : 0) + (inspected?.features?.usage ? 0.1 : 0);
    const date = Date.parse(repo.pushed_at || repo.updated_at || '');
    const age = Number.isFinite(date) ? Math.max(0, (now - date) / 86400000) : null;
    const stars = Math.max(0, Number(repo.stargazers_count) || 0);
    const factors = {
      relevance: terms.length ? clamp(relevant.length / Math.min(terms.length, 3)) : 0.5,
      substance: clamp((repo.fork ? 0.05 : 0.4) + (repo.language ? 0.3 : 0) + (repo.size > 0 ? 0.3 : 0)),
      presentation: clamp((metadata + docs) / (known ? 1 : 0.55)),
      maintenance: age === null ? 0.5 : age <= 90 ? 1 : age <= 365 ? 0.8 : age <= 730 ? 0.5 : 0.15,
      popularity: clamp(Math.log1p(stars) / Math.log1p(100)),
    };
    let score = Object.entries(weights).reduce((sum, [key, weight]) => sum + factors[key] * weight, 0) / total;
    if (repo.archived) score *= 0.35;
    if (repo.fork) score *= 0.5;
    if (repo.size === 0) score *= 0.1;
    if (matches(preferred, repo)) score += 0.1;
    const reasons = [];
    if (relevant.length) reasons.push('Matches focus: ' + relevant.join(', '));
    if (repo.description) reasons.push('Public project description');
    if (inspected?.state === 'available') reasons.push('README verified through GitHub API');
    if (inspected?.features?.installation) reasons.push('README includes setup instructions');
    if (inspected?.features?.usage) reasons.push('README includes usage/examples');
    if (inspected?.state === 'missing') reasons.push('Improve: add a README');
    if (repo.homepage) reasons.push('Project/demo link provided (not availability-tested)');
    if (age !== null && age <= 365) reasons.push('Updated within the past year');
    if (!repo.description) reasons.push('Improve: add a one-line description');
    if (repo.archived) reasons.push('Archived project');
    if (repo.fork) reasons.push('Fork: review your own contribution before showcasing');
    if (repo.size === 0) reasons.push('Empty repository');
    return { repo, score: Math.round(clamp(score) * 1000) / 10, factors, reasons,
      limitations: known ? ['Documentation checks do not prove code quality.'] : ['README not inspected; documentation quality is unknown.'] };
  });
  candidates.sort((a, b) => b.score - a.score || a.repo.full_name.localeCompare(b.repo.full_name));
  return candidates.slice(0, options.limit ?? config.showcase.limit);
}

export function selectFeatured(snapshot, config) {
  const excluded = new Set([...config.profile.excluded, ...config.showcase.excluded].map(lower));
  if (!config.profile.featured.length) return rankRepositories(snapshot, config, { limit: config.profile.maxProjects }).map((entry) => entry.repo);
  const selected = [];
  for (const name of config.profile.featured) {
    const repo = snapshot.repos.find((item) => [lower(item.name), lower(item.full_name)].includes(lower(name)));
    if (!repo) throw new Error('Featured repository not found in the scanned public repositories: ' + name + '. Check scan.maxRepos or the repository name.');
    if (!matches(excluded, repo) && !selected.some((item) => item.full_name === repo.full_name)) selected.push(repo);
  }
  return selected.slice(0, config.profile.maxProjects);
}

export function auditProfile(snapshot, config) {
  const findings = [];
  const root = 'https://github.com/' + snapshot.username;
  const add = (severity, title, observed, action, source = root) => findings.push({ severity, title, observed, action, source, confidence: 'observed', requiresUserAction: true });
  if (!snapshot.user.bio) add('high', 'Missing profile bio', 'The public bio is empty.', 'Add one clear sentence describing what you build.');
  if (!snapshot.profileReadme) add('high', 'No profile README', 'No root README.md was found in the profile repository.',
    'Create a public ' + snapshot.username + '/' + snapshot.username + ' repository with a root README.md.');
  else if (snapshot.profileReadme.unknown) add('info', 'Profile README could not be inspected', 'Content is unavailable, not necessarily absent.', 'Review the file manually before generating a replacement.');
  else if (snapshot.profileReadme.content.trim().split(/\s+/).length < 40) add('info', 'Concise profile README',
    'The README contains fewer than 40 words. This can be intentional.', 'Keep it concise; ensure your focus and strongest work are easy to find.');
  const owned = snapshot.repos.filter((repo) => !repo.fork && !repo.archived);
  const missing = owned.filter((repo) => !repo.description);
  if (missing.length) add('medium', 'Repositories without descriptions', missing.length + ' projects lack a one-line description.',
    'Describe the purpose of your strongest projects.', root + '?tab=repositories');
  const noTopics = owned.filter((repo) => !repo.topics?.length);
  if (noTopics.length) add('low', 'Repositories without topics', noTopics.length + ' projects have no topics.', 'Add precise topics to selected projects.', root + '?tab=repositories');
  const inspected = snapshot.repos.filter((repo) => repo.inspection);
  for (const repo of inspected.filter((item) => !item.fork && !item.archived)) {
    if (repo.inspection.state === 'missing') add('medium', 'Showcase candidate lacks a README: ' + repo.name,
      'GitHub returned no README.', 'Document purpose, installation and a working example.', repo.inspection.url);
    else if (repo.inspection.state === 'available' && !repo.inspection.features.installation && !repo.inspection.features.usage) {
      add('low', 'Review project onboarding: ' + repo.name, 'No conventional setup/usage headings were recognized.',
        'Check that someone can try the project. Custom headings may be valid.', repo.inspection.url);
    }
  }
  if (snapshot.truncated) add('info', 'Repository sample capped', 'Not all public repositories were analyzed.', 'Increase scan.maxRepos or choose featured projects explicitly.');
  if (!snapshot.repos.length) add('high', 'No public repositories analyzed', 'No public projects were returned.', 'Publish a project you can explain, or review repository visibility.');
  for (const warning of snapshot.warnings || []) add('info', 'Incomplete data', warning, 'Inspect the affected resource manually.');
  const priority = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort((a, b) => priority[a.severity] - priority[b.severity]);
  return { user: snapshot.username, observedAt: snapshot.observedAt, dataAccess: snapshot.dataAccess || null,
    publicRepositoriesScanned: snapshot.repos.length, repositoryReadmesInspected: inspected.length,
    findings, showcase: rankRepositories(snapshot, config),
    caveat: 'Metadata and optional README checks. Does not inspect repository source code or establish engineering proficiency.' };
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function daysSince(date, now) {
  const parsed = Date.parse(date || '');
  return Number.isFinite(parsed) ? Math.max(0, (now - parsed) / 86400000) : null;
}

function nameOf(repo) {
  return String(repo.full_name || repo.name || '');
}

function comparable(value) {
  return String(value || '').toLowerCase();
}

export function rankRepositories(snapshot, config, options = {}) {
  const goal = options.goal ?? config.showcase.goal;
  const terms = (goal + ' ' + config.showcase.topics.join(' '))
    .toLowerCase().split(/[^a-z0-9+#.]+/).filter((x) => x.length > 2);
  const weights = config.showcase.weights;
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const excluded = new Set([...config.showcase.excluded, ...config.profile.excluded].map(comparable));
  const preferred = new Set(config.showcase.preferred.map(comparable));
  const now = options.now ?? Date.now();
  const repos = snapshot.repos.filter((repo) =>
    !excluded.has(comparable(repo.name)) && !excluded.has(comparable(nameOf(repo))));
  const ranked = repos.map((repo) => {
    const text = comparable([repo.name, repo.description, repo.language, ...(repo.topics || [])].join(' '));
    const matches = [...new Set(terms)].filter((term) => text.includes(term));
    const relevance = terms.length ? clamp(matches.length / Math.max(1, Math.min(terms.length, 3))) : 0.65;
    const substance = clamp((repo.fork ? 0.05 : 0.4) + (repo.language ? 0.3 : 0) + (repo.size > 0 ? 0.3 : 0));
    const inspected = repo.inspection;
    // Readme structure is evidence of presentation, not proof of engineering quality.
    const presentation = clamp((repo.description ? 0.25 : 0) + ((repo.topics || []).length ? 0.15 : 0) +
      (repo.homepage ? 0.15 : 0) + (inspected?.state === 'available' ? 0.25 : 0) +
      (inspected?.features?.installation ? 0.10 : 0) + (inspected?.features?.usage ? 0.10 : 0));
    const age = daysSince(repo.pushed_at || repo.updated_at, now);
    const maintenance = age === null ? 0.25 : age <= 90 ? 1 : age <= 365 ? 0.8 : age <= 730 ? 0.5 : 0.15;
    const stars = Math.max(0, Number(repo.stargazers_count) || 0);
    const popularity = clamp(Math.log1p(stars) / Math.log1p(100));
    const factors = { relevance, substance, presentation, maintenance, popularity };
    let score = Object.entries(weights).reduce((sum, [key, weight]) => sum + factors[key] * weight, 0) / weightTotal;
    if (preferred.has(comparable(nameOf(repo))) || preferred.has(comparable(repo.name))) score += 0.15;
    if (repo.archived) score *= 0.35;
    if (repo.fork) score *= 0.5;
    const reasons = [];
    if (matches.length) reasons.push('Matches declared focus: ' + matches.join(', '));
    if (repo.description) reasons.push('Has a public project description');
    if (inspected?.state === 'available') reasons.push('README verified through GitHub API');
    if (inspected?.features?.installation) reasons.push('README includes a setup section');
    if (inspected?.features?.usage) reasons.push('README includes a usage/examples section');
    if (inspected?.state === 'missing') reasons.push('Improve: add a project README');
    if (repo.homepage) reasons.push('Provides a project/demo link');
    if (age !== null && age <= 365) reasons.push('Updated in the past year');
    if (stars > 0) reasons.push(stars + ' public stars');
    if (!repo.description) reasons.push('Improve: add a concise description');
    if (repo.archived) reasons.push('Caution: archived repository');
    if (repo.fork) reasons.push('Caution: forked project');
    return { repo, score: Math.round(score * 1000) / 10, factors, reasons };
  });
  ranked.sort((a, b) => b.score - a.score || nameOf(a.repo).localeCompare(nameOf(b.repo)));
  const limit = options.limit ?? config.showcase.limit;
  const selected = [];
  const languageCount = new Map();
  while (selected.length < limit && ranked.length) {
    const candidates = ranked.map((item) => {
      const lang = comparable(item.repo.language) || 'unknown';
      const count = languageCount.get(lang) || 0;
      return { item, effective: item.score - Math.max(0, count - 1) * 4 };
    });
    candidates.sort((a, b) => b.effective - a.effective || nameOf(a.item.repo).localeCompare(nameOf(b.item.repo)));
    const chosen = candidates[0].item;
    selected.push(chosen);
    const lang = comparable(chosen.repo.language) || 'unknown';
    languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
    ranked.splice(ranked.indexOf(chosen), 1);
  }
  return selected;
}

export function selectFeatured(snapshot, config) {
  const excluded = new Set(config.profile.excluded.map(comparable));
  const explicitlyChosen = config.profile.featured.map((name) =>
    snapshot.repos.find((repo) => comparable(repo.name) === comparable(name) ||
      comparable(repo.full_name) === comparable(name)));
  const chosen = explicitlyChosen.filter((repo) => repo && !excluded.has(comparable(repo.name)));
  const remainder = rankRepositories(snapshot, config, { limit: 6 }).map((entry) => entry.repo)
    .filter((repo) => !chosen.some((picked) => nameOf(picked) === nameOf(repo)));
  return [...chosen, ...remainder].slice(0, config.profile.maxProjects);
}

export function auditProfile(snapshot, config) {
  const findings = [];
  const root = 'https://github.com/' + snapshot.username;
  const add = (severity, title, observed, action, source) =>
    findings.push({ severity, title, observed, action, source });
  if (!snapshot.user.bio) {
    add('high', 'Missing profile bio', 'GitHub bio field is empty.',
      'Write one clear sentence about what you build.', root);
  }
  if (!snapshot.profileReadme) {
    add('high', 'No profile README', 'The public profile README was not found.',
      'Create a public ' + snapshot.username + '/' + snapshot.username + ' README.md with a short, evidence-based introduction.', root);
  } else if (snapshot.profileReadme.content.trim().split(/\s+/).filter(Boolean).length < 40) {
    add('medium', 'Profile README has little context',
      'The README has fewer than 40 whitespace-delimited words.',
      'Describe your focus and link to two or three relevant projects.', snapshot.profileReadme.url || root);
  }
  if (!snapshot.user.blog && config.profile.links.length === 0) {
    add('low', 'No external link detected', 'No website or external link is available in the public profile field.',
      'Add a contact or portfolio link if relevant; otherwise omit it deliberately.', root);
  }
  const incomplete = snapshot.repos.filter((repo) => !repo.fork && !repo.archived && !repo.description);
  if (incomplete.length) {
    add('medium', 'Repositories without descriptions',
      incomplete.length + ' public owned repositories have no description: ' +
      incomplete.slice(0, 5).map((repo) => repo.name).join(', '),
      'Start with showcase candidates; write a one-line purpose for each.', root + '?tab=repositories');
  }
  const untitled = snapshot.repos.filter((repo) => !repo.fork && !repo.archived && !(repo.topics || []).length);
  if (untitled.length) {
    add('low', 'Repositories without topics',
      untitled.length + ' public owned repositories have no topics.',
      'Add precise topics to the most relevant projects for discoverability.', root + '?tab=repositories');
  }
  const inspectedRepos = snapshot.repos.filter((repo) => repo.inspection);
  const missingReadmes = inspectedRepos.filter((repo) => repo.inspection.state === 'missing' && !repo.archived && !repo.fork);
  for (const repo of missingReadmes.slice(0, 4)) {
    add('medium', 'Showcase candidate lacks a README: ' + repo.name,
      'GitHub reports no README for this inspected repository.',
      'Add purpose, setup, usage and a minimal working example.', 'https://github.com/' + repo.full_name);
  }
  const unhelpful = inspectedRepos.filter((repo) => repo.inspection.state === 'available' &&
    !repo.inspection.features.installation && !repo.inspection.features.usage && !repo.archived && !repo.fork);
  for (const repo of unhelpful.slice(0, 4)) {
    add('low', 'README has no recognized setup/usage headings: ' + repo.name,
      'The inspected README lacks conventional installation or usage headings.',
      'Review whether the README clearly explains how to try the project; custom headings may be perfectly valid.',
      repo.inspection.url);
  }
  if (snapshot.truncated) {
    add('info', 'Repository sample capped', 'More repositories exist than were scanned.',
      'Increase scan.maxRepos if you need complete public coverage.', root + '?tab=repositories');
  }
  if (!snapshot.repos.length) {
    add('high', 'No public repositories analyzed', 'No public owned repositories appeared in the API results.',
      'Publish an authentic, useful project or review visibility settings.', root);
  }
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return {
    user: snapshot.username,
    observedAt: snapshot.observedAt,
    publicRepositoriesScanned: snapshot.repos.length,
    repositoryReadmesInspected: inspectedRepos.length,
    findings,
    showcase: rankRepositories(snapshot, config),
    caveat: 'Metadata-based audit with optional README-heading checks. Does not inspect repository source code, confirm achievements, or reconstruct the contribution graph.',
  };
}

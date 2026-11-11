import { rankRepositories, selectFeatured } from './engine.mjs';

function text(value) {
  return String(value || '').replace(/[\r\n|]+/g, ' ').replace(/([\\*_{}\[\]<>])/g, '\\$1').trim();
}

function html(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function repoUrl(repo) {
  const full = repo.full_name || '';
  return 'https://github.com/' + full.split('/').map(encodeURIComponent).join('/');
}

function website(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.includes('://') ? value : 'https://' + value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function sectionsFor(style, overrides) {
  const preset = style === 'minimal'
    ? { about: true, projects: true, technologies: false, links: true, stats: false, extras: true }
    : style === 'regular'
      ? { about: true, projects: true, technologies: true, links: true, stats: false, extras: true }
      : { about: true, projects: true, technologies: true, links: true, stats: true, extras: true };
  return { ...preset, ...overrides };
}

function profileInfo(snapshot, config, style) {
  const p = config.profile;
  const projects = selectFeatured(snapshot, config);
  const user = snapshot.user;
  const rawTech = p.technologies.length
    ? p.technologies
    : snapshot.repos.map((repo) => repo.language).filter(Boolean);
  const technologies = [...new Set(rawTech)].slice(0, 9);
  const links = [...p.links];
  const publicSite = website(user.blog);
  if (publicSite && !links.some((link) => link.url === publicSite)) {
    links.unshift({ label: 'Website', url: publicSite });
  }
  const count = snapshot.repos.length;
  const stars = snapshot.repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  return {
    name: p.name || user.name || snapshot.username,
    headline: p.headline,
    about: p.about || user.bio || '',
    technologies,
    techInferred: p.technologies.length === 0,
    links,
    projects,
    stats: snapshot.truncated ? null : { count, stars },
    sections: sectionsFor(style, p.sections),
    extras: p.extras,
    username: snapshot.username,
    accent: p.accent,
  };
}

function projectLine(repo) {
  return '- **[' + text(repo.name) + '](' + repoUrl(repo) + ')**' +
    (repo.description ? ' — ' + text(repo.description) : '') + '\n';
}

function linksLine(links) {
  return links.map((link) => '- [' + text(link.label) + '](' + link.url + ')').join('\n');
}

function simpleProjects(projects) {
  return projects.map(projectLine).join('');
}

function techLabel(info) {
  return info.techInferred ? 'Languages found in public repositories' : 'Technologies';
}

function extraSections(info) {
  if (!info.sections.extras) return '';
  return info.extras.map((section) => '\n## ' + text(section.title) + '\n\n' + section.body.trim() + '\n').join('');
}

export function renderProfile(snapshot, config, chosenStyle) {
  const style = chosenStyle || config.profile.style;
  if (!['minimal', 'regular', 'flashy'].includes(style)) {
    throw new Error('Invalid style. Choose minimal, regular, or flashy.');
  }
  const info = profileInfo(snapshot, config, style);
  const s = info.sections;
  if (style === 'minimal') {
    const lines = ['# ' + text(info.name), ''];
    if (info.headline) lines.push(text(info.headline), '');
    if (s.about && info.about) lines.push(text(info.about), '');
    if (s.projects && info.projects.length) lines.push('## Selected work', '', simpleProjects(info.projects).trimEnd(), '');
    if (s.technologies && info.technologies.length) lines.push('## ' + techLabel(info), '',
      info.technologies.map(text).join(' · '), '');
    if (s.links && info.links.length) lines.push('## Links', '', linksLine(info.links), '');
    if (s.stats && info.stats) lines.push('## Public GitHub snapshot', '',
      info.stats.count + ' public repositories · ' + info.stats.stars + ' stars at generation time', '');
    lines.push(extraSections(info));
    return lines.join('\n').trim() + '\n';
  }

  if (style === 'regular') {
    const lines = ['# ' + text(info.name), ''];
    if (info.headline) lines.push('> ' + text(info.headline), '');
    if (s.about && info.about) lines.push('## About', '', text(info.about), '');
    if (s.projects && info.projects.length) {
      lines.push('## Featured work', '', '| Project | Description |', '| --- | --- |');
      for (const repo of info.projects) {
        lines.push('| [' + text(repo.name) + '](' + repoUrl(repo) + ') | ' +
          (repo.description ? text(repo.description) : 'Source repository') + ' |');
      }
      lines.push('');
    }
    if (s.technologies && info.technologies.length) lines.push('## ' + techLabel(info), '',
      info.technologies.map(text).join(' · '), '');
    if (s.stats && info.stats) lines.push('## Public repository snapshot', '',
      info.stats.count + ' repositories · ' + info.stats.stars + ' stars at generation time', '');
    if (s.links && info.links.length) lines.push('## Connect', '', linksLine(info.links), '');
    lines.push(extraSections(info));
    return lines.join('\n').trim() + '\n';
  }

  const lines = [
    '<div align="center">',
    '',
    '<h1>' + html(info.name) + '</h1>',
  ];
  if (info.headline) lines.push('<p><strong>' + html(info.headline) + '</strong></p>');
  if (s.about && info.about) lines.push('<p>' + html(info.about) + '</p>');
  if (s.technologies && info.technologies.length) {
    lines.push('<p>');
    for (const tech of info.technologies) {
      const badgeUrl = 'https://img.shields.io/badge/' + encodeURIComponent(tech) +
        '-' + encodeURIComponent(info.accent) + '?style=for-the-badge';
      lines.push('<img alt="' + html(tech) + '" src="' + html(badgeUrl) + '" />');
    }
    lines.push('</p>');
  }
  lines.push('', '</div>', '');
  if (s.projects && info.projects.length) {
    lines.push('## Featured projects', '');
    for (const repo of info.projects) {
      lines.push('### [' + text(repo.name) + '](' + repoUrl(repo) + ')', '');
      if (repo.description) lines.push(text(repo.description), '');
      lines.push('**Language:** ' + text(repo.language || 'Not specified') +
        ' · **Stars:** ' + (repo.stargazers_count || 0) + ' (at generation time)', '');
    }
  }
  if (s.stats && info.stats) lines.push('## By the numbers', '',
    '- **' + info.stats.count + '** public repositories scanned',
    '- **' + info.stats.stars + '** public stars observed at generation time', '');
  if (s.links && info.links.length) lines.push('## Find me online', '', linksLine(info.links), '');
  lines.push(extraSections(info));
  return lines.join('\n').trim() + '\n';
}

export function renderAuditMarkdown(report) {
  const lines = ['# GH Aura audit: @' + report.user, '',
    'Observed: ' + report.observedAt, '',
    'Public repositories scanned: ' + report.publicRepositoriesScanned, '',
    '## Findings', ''];
  if (!report.findings.length) lines.push('No findings from the currently implemented audit checks.', '');
  for (const finding of report.findings) {
    lines.push('### ' + finding.severity.toUpperCase() + ': ' + finding.title, '',
      '- Observation: ' + finding.observed,
      '- Recommended action: ' + finding.action,
      '- Source: ' + finding.source, '');
  }
  lines.push('## Suggested showcase', '',
    renderShowcaseMarkdown(report.user, report.showcase), '',
    'Note: ' + report.caveat, '');
  return lines.join('\n').trim() + '\n';
}

export function renderShowcaseMarkdown(username, recommendations) {
  const lines = ['Recommended repositories for @' + username + ' (preliminary metadata ranking):', ''];
  if (!recommendations.length) return 'No eligible public repositories were found.\n';
  for (const [index, entry] of recommendations.entries()) {
    const repo = entry.repo;
    lines.push((index + 1) + '. [' + repo.full_name + '](' + repoUrl(repo) + ') — ' +
      entry.score.toFixed(1) + '/100 (relative score)');
    for (const reason of entry.reasons.slice(0, 4)) lines.push('   - ' + reason);
  }
  lines.push('', 'Review the choices manually in your GitHub profile: Customize your pins (up to six).',
    'This is not a source-code quality or hiring score.');
  return lines.join('\n') + '\n';
}

export function renderPlanMarkdown(report) {
  const lines = ['# GH Aura action plan for @' + report.user, '',
    '## Immediate improvements', ''];
  if (report.findings.length) {
    for (const finding of report.findings) lines.push('- **' + finding.severity + '**: ' +
      finding.action + ' (' + finding.title + ')');
  } else lines.push('- Review your profile wording for clarity and relevance.');
  lines.push('', '## Showcase candidates', '', renderShowcaseMarkdown(report.user, report.showcase),
    '', '## What GH Aura does not do', '',
    '- No fabricated achievements or old contributions.',
    '- No automated self-stars, synthetic PRs, or filler commits.',
    '- No unsanctioned changes to your profile or pinned repositories.', '');
  return lines.join('\n').trim() + '\n';
}

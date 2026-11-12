import { presentationPlan } from './editorial.mjs';
import { selectFeatured } from './engine.mjs';
import { renderHiringReview } from './readiness.mjs';
import { md, html, httpsUrl, repoUrl } from './text.mjs';

export function renderProfile(snapshot, config, chosenStyle) {
  const plan = presentationPlan({ ...config.profile, ...(chosenStyle ? { style: chosenStyle, visual: -1 } : {}) });
  const style = plan.style;
  if (!['minimal', 'regular', 'flashy'].includes(style)) throw new Error('Choose minimal, regular, or flashy.');
  const p = config.profile;
  const sections = plan.sections;
  const projects = sections.projects ? selectFeatured(snapshot, config) : [];
  const storyFor = (repo) => p.projectStories.find((entry) =>
    [repo.full_name.toLowerCase(), repo.name.toLowerCase()].includes(entry.repo.toLowerCase()));

  const technologies = [...new Set(p.technologies.length ? p.technologies : snapshot.repos.map((repo) => repo.language).filter(Boolean))].slice(0, p.technologies.length ? 12 : plan.maxTechnologyLabels);
  const techLabel = p.technologies.length ? 'Technologies' : 'Languages in public repositories';
  const name = p.name || snapshot.user.name || snapshot.username;
  const about = p.about || snapshot.user.bio || '';
  const links = p.links.map((link) => ({ label: link.label, url: httpsUrl(link.url) })).filter((link) => link.url);
  const blog = String(snapshot.user.blog || '');
  const website = httpsUrl(blog.includes(':') ? blog : 'https://' + blog);
  if (blog && website && !links.some((link) => link.url === website)) links.push({ label: 'Website', url: website });
  const lines = [];
  if (style === 'flashy') {
    lines.push('<div align="center">', '', '<h1>' + html(name) + '</h1>');
    if (p.headline) lines.push('<p><strong>' + html(p.headline) + '</strong></p>');
    if (sections.about && about && about.trim().toLowerCase() !== p.headline.trim().toLowerCase()) lines.push('<p>' + html(about) + '</p>');
    if (p.location) lines.push('<p>' + html(p.location) + '</p>');
    lines.push('', '</div>', '');
  } else {
    lines.push('# ' + md(name), '');
    if (p.headline) lines.push((style === 'regular' ? '> ' : '') + md(p.headline), '');
    if (sections.about && about && about.trim().toLowerCase() !== p.headline.trim().toLowerCase()) lines.push(md(about), '');
    if (p.location) lines.push(md(p.location), '');
  }
  if (sections.projects && projects.length) {
    lines.push('## ' + (style === 'minimal' ? 'Selected work' : 'Featured work'), '');
    if (style === 'regular') {
      const hasStories = projects.some((repo) => Boolean(storyFor(repo)));
      lines.push(hasStories ? '| Project | Description | My contribution |' : '| Project | Description |',
        hasStories ? '| --- | --- | --- |' : '| --- | --- |');
      for (const repo of projects) {
        const story = storyFor(repo);
        const contribution = story?.contribution ? md(story.contribution) : '—';
        lines.push('| [' + md(repo.name) + '](' + repoUrl(repo) + ') | ' +
          md(story?.problem || repo.description || 'Source repository') +
          (hasStories ? ' | ' + contribution : '') + ' |');
      }
      if (hasStories) for (const repo of projects) {
        const story = storyFor(repo);
        if (!story) continue;
        const extras = [
          story.tradeoffs ? 'Trade-offs: ' + md(story.tradeoffs) : null,
          story.outcome ? 'Outcome (user-provided): ' + md(story.outcome) : null,
          story.proof ? '[Evidence](' + httpsUrl(story.proof) + ')' : null,
        ].filter(Boolean);
        if (extras.length) lines.push('', '**' + md(repo.name) + '** — ' + extras.join(' · '));
      }
    } else {
      for (const repo of projects) {
        const story = storyFor(repo);
        lines.push((style === 'flashy' ? '### ' : '- **') + '[' + md(repo.name) + '](' + repoUrl(repo) + ')' + (style === 'minimal' ? '**' : '') +
          (repo.description ? (style === 'flashy' ? '\n\n' : ' — ') + md(repo.description) : ''));
        if (story) {
          if (style === 'minimal') {
            if (story.contribution) lines[lines.length - 1] += ' · My work: ' + md(story.contribution);
            if (story.proof) lines[lines.length - 1] += ' · [Evidence](' + httpsUrl(story.proof) + ')';
          } else {
            if (story.problem) lines.push('', '**Problem:** ' + md(story.problem));
            if (story.contribution) lines.push('', '**My contribution:** ' + md(story.contribution));
            if (story.tradeoffs) lines.push('', '**Engineering trade-offs:** ' + md(story.tradeoffs));
            if (story.outcome) lines.push('', '**Outcome (user-provided):** ' + md(story.outcome));
            if (story.proof) lines.push('', '[Inspect evidence](' + httpsUrl(story.proof) + ')');
          }
        }
        if (style === 'flashy') lines.push('');
      }
    }
    lines.push('');
  }
  if (sections.technologies && technologies.length) {
    lines.push('## ' + techLabel, '');
    if (style === 'flashy') {
      // Technology labels, not earned GitHub achievements. This opt-in style uses Shields.io.
      for (const tech of technologies) {
        const query = new URLSearchParams({ label: tech, message: '', color: p.accent.replace(/^#/, ''), style: 'for-the-badge' });
        lines.push('<img alt="' + html(tech) + '" src="https://img.shields.io/static/v1?' + html(query.toString()) + '" />');
      }
    } else lines.push(technologies.map(md).join(' · '));
    lines.push('');
  }
  if (sections.stats && !snapshot.truncated) {
    const stars = snapshot.repos.reduce((sum, repo) => sum + (Number(repo.stargazers_count) || 0), 0);
    lines.push('## Public repository snapshot', '', snapshot.repos.length + ' repositories · ' + stars + ' stars',
      '', 'Observed ' + md(snapshot.observedAt.slice(0, 10)) + '.', '');
  }
  if (sections.links && links.length) lines.push('## Links', '', ...links.map((link) => '- [' + md(link.label) + '](' + link.url + ')'), '');
  if (sections.extras) for (const section of p.extras) lines.push('## ' + md(section.title), '', section.body.trim(), '');
  return lines.join('\n').trim() + '\n';
}

export function renderShowcaseMarkdown(username, recommendations) {
  const lines = ['# Showcase: @' + md(username), ''];
  if (!recommendations.length) return lines.join('\n') + 'No eligible public repositories found.\n';
  for (const [index, entry] of recommendations.entries()) {
    lines.push((index + 1) + '. **[' + md(entry.repo.full_name) + '](' + repoUrl(entry.repo) + ')** — ' + entry.score.toFixed(1) + '/100');
    for (const reason of entry.reasons) lines.push('   - ' + md(reason));
    for (const limitation of entry.limitations || []) lines.push('   - ' + md(limitation));
  }
  lines.push('', 'A configurable presentation ranking, not a code-quality or hiring score.',
    'Review your choices in GitHub → Customize your pins. Nothing has been pinned automatically.');
  return lines.join('\n') + '\n';
}

export function renderAuditMarkdown(report) {
  const lines = ['# GH Aura audit: @' + md(report.user), '', 'Observed: ' + md(report.observedAt),
    'Public repositories scanned: ' + report.publicRepositoriesScanned,
    'Repository READMEs inspected: ' + (report.repositoryReadmesInspected || 0), '',
    ...(report.hiringReview ? [renderHiringReview(report.hiringReview), ''] : []),
    '## Findings', ''];
  if (!report.findings.length) lines.push('No findings from the implemented checks.', '');
  for (const finding of report.findings) lines.push('### ' + finding.severity.toUpperCase() + ': ' + md(finding.title), '',
    md(finding.observed), '', '**Next:** ' + md(finding.action), '', 'Source: ' + (httpsUrl(finding.source) || 'unavailable'), '');
  lines.push(renderShowcaseMarkdown(report.user, report.showcase), md(report.caveat));
  return lines.join('\n') + '\n';
}

export const renderPlanMarkdown = renderAuditMarkdown;

/** Preserve user-owned text. Only one explicitly marked region may be replaced. */
export function preserveProfile(existing, generated) {
  const start = '<!-- gh-aura:start -->';
  const end = '<!-- gh-aura:end -->';
  const starts = existing.split(start).length - 1;
  const ends = existing.split(end).length - 1;
  const block = start + '\n\n' + generated.trimEnd() + '\n\n' + end;
  if (!starts && !ends) return existing + (existing.endsWith('\n') ? '\n' : '\n\n') + block + '\n';
  if (starts !== 1 || ends !== 1 || existing.indexOf(start) >= existing.indexOf(end)) {
    throw new Error('Expected one ordered gh-aura:start/end pair. No custom text was replaced.');
  }
  return existing.slice(0, existing.indexOf(start)) + block + existing.slice(existing.indexOf(end) + end.length);
}

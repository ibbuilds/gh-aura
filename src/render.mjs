import { presentationPlan } from './editorial.mjs';
import { selectFeatured } from './engine.mjs';
import { renderHiringReview } from './readiness.mjs';
import { renderJobMatch } from './job-match.mjs';
import { md, html, httpsUrl, repoUrl } from './text.mjs';

const PROFILE_COPY = Object.freeze({
  en: Object.freeze({
    selected: 'Selected work', featured: 'Featured work', project: 'Project',
    description: 'Description', contribution: 'My contribution',
    sourceRepository: 'Source repository', tradeoffs: 'Trade-offs',
    outcome: 'Outcome (user-provided)', evidence: 'Evidence',
    problem: 'Problem', engineeringTradeoffs: 'Engineering trade-offs',
    inspectEvidence: 'Inspect evidence', technologies: 'Technologies',
    inferredLanguages: 'Languages in public repositories',
    stats: 'Public repository snapshot', repositories: 'repositories',
    stars: 'stars', observed: 'Observed', links: 'Links', website: 'Website',
    myWork: 'My work',
  }),
  es: Object.freeze({
    selected: 'Trabajo seleccionado', featured: 'Proyectos destacados', project: 'Proyecto',
    description: 'Descripción', contribution: 'Mi contribución',
    sourceRepository: 'Repositorio de código', tradeoffs: 'Decisiones técnicas',
    outcome: 'Resultado (declarado por el usuario)', evidence: 'Evidencia',
    problem: 'Problema', engineeringTradeoffs: 'Decisiones y compromisos técnicos',
    inspectEvidence: 'Ver evidencia', technologies: 'Tecnologías',
    inferredLanguages: 'Lenguajes detectados en repositorios públicos',
    stats: 'Resumen de repositorios públicos', repositories: 'repositorios',
    stars: 'estrellas', observed: 'Consultado el', links: 'Enlaces', website: 'Sitio web',
    myWork: 'Mi trabajo',
  }),
});

export function renderProfile(snapshot, config, chosenStyle) {
  const plan = presentationPlan({ ...config.profile, ...(chosenStyle ? { style: chosenStyle, visual: -1 } : {}) });
  const style = plan.style;
  if (!['minimal', 'regular', 'flashy'].includes(style)) throw new Error('Choose minimal, regular, or flashy.');
  const p = config.profile;
  const copy = PROFILE_COPY[config.editorial?.language || 'en'];
  if (!copy) throw new Error('Unsupported profile language. Choose en or es.');
  const sections = plan.sections;
  const projects = sections.projects ? selectFeatured(snapshot, config) : [];
  const storyFor = (repo) => p.projectStories.find((entry) =>
    [repo.full_name.toLowerCase(), repo.name.toLowerCase()].includes(entry.repo.toLowerCase()));

  const technologies = [...new Set(p.technologies.length ? p.technologies : snapshot.repos.map((repo) => repo.language).filter(Boolean))].slice(0, p.technologies.length ? 12 : plan.maxTechnologyLabels);
  const techLabel = p.technologies.length ? copy.technologies : copy.inferredLanguages;
  const name = p.name || snapshot.user.name || snapshot.username;
  const about = p.about || snapshot.user.bio || '';
  const links = p.links.map((link) => ({ label: link.label, url: httpsUrl(link.url) })).filter((link) => link.url);
  const blog = String(snapshot.user.blog || '');
  const website = httpsUrl(blog.includes(':') ? blog : 'https://' + blog);
  if (blog && website && !links.some((link) => link.url === website)) links.push({ label: copy.website, url: website });
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
    lines.push('## ' + (style === 'minimal' ? copy.selected : copy.featured), '');
    if (style === 'regular') {
      const hasStories = projects.some((repo) => Boolean(storyFor(repo)));
      lines.push(hasStories ? '| ' + copy.project + ' | ' + copy.description + ' | ' + copy.contribution + ' |' : '| ' + copy.project + ' | ' + copy.description + ' |',
        hasStories ? '| --- | --- | --- |' : '| --- | --- |');
      for (const repo of projects) {
        const story = storyFor(repo);
        const contribution = story?.contribution ? md(story.contribution) : '—';
        lines.push('| [' + md(repo.name) + '](' + repoUrl(repo) + ') | ' +
          md(story?.problem || repo.description || copy.sourceRepository) +
          (hasStories ? ' | ' + contribution : '') + ' |');
      }
      if (hasStories) for (const repo of projects) {
        const story = storyFor(repo);
        if (!story) continue;
        const extras = [
          story.tradeoffs ? copy.tradeoffs + ': ' + md(story.tradeoffs) : null,
          story.outcome ? copy.outcome + ': ' + md(story.outcome) : null,
          story.proof ? '[' + copy.evidence + '](' + httpsUrl(story.proof) + ')' : null,
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
            if (story.contribution) lines[lines.length - 1] += ' · ' + copy.myWork + ': ' + md(story.contribution);
            if (story.proof) lines[lines.length - 1] += ' · [' + copy.evidence + '](' + httpsUrl(story.proof) + ')';
          } else {
            if (story.problem) lines.push('', '**' + copy.problem + ':** ' + md(story.problem));
            if (story.contribution) lines.push('', '**' + copy.contribution + ':** ' + md(story.contribution));
            if (story.tradeoffs) lines.push('', '**' + copy.engineeringTradeoffs + ':** ' + md(story.tradeoffs));
            if (story.outcome) lines.push('', '**' + copy.outcome + ':** ' + md(story.outcome));
            if (story.proof) lines.push('', '[' + copy.inspectEvidence + '](' + httpsUrl(story.proof) + ')');
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
    lines.push('## ' + copy.stats, '', snapshot.repos.length + ' ' + copy.repositories + ' · ' + stars + ' ' + copy.stars,
      '', copy.observed + ' ' + md(snapshot.observedAt.slice(0, 10)) + '.', '');
  }
  if (sections.links && links.length) lines.push('## ' + copy.links, '', ...links.map((link) => '- [' + md(link.label) + '](' + link.url + ')'), '');
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
    ...(report.jobMatch ? [renderJobMatch(report.jobMatch), ''] : []),
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

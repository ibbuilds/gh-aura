import { loadConfig, validateConfig } from '../config.mjs';
import { getSnapshot } from '../github.mjs';
import { ReadCache } from '../cache.mjs';
import { ReadSession } from '../session.mjs';
import { emit, loginFor } from '../output.mjs';

/** One lifecycle for public reads. Publishing deliberately never uses this session/cache. */
export async function run(command, options) {
  const config = loadConfig(options.config);
  if (options.style) { config.profile.style = options.style; config.profile.visual = -1; }
  if (options.visual !== undefined) config.profile.visual = Number(options.visual);
  if (options.language) config.editorial.language = options.language;
  if (options.direction) config.editorial.direction = options.direction;
  if (options.goal !== undefined) {
    config.showcase.goal = options.goal;
    if (command === 'audit') config.editorial.targetRole = options.goal;
  }
  if (options.limit !== undefined) config.showcase.limit = Number(options.limit);
  if (options.inspect !== undefined) config.scan.inspectRepos = Number(options.inspect);
  if (options.deep !== undefined) config.scan.deepRepos = Number(options.deep);
  validateConfig(config);
  if (options.checks && !config.scan.deepRepos) {
    throw new Error('--checks needs --deep 1..5 (or scan.deepRepos configured).');
  }
  // Parse the local job posting BEFORE any GitHub request. Never send its text to GitHub.
  const jobPosting = options.job ? (await import('../job-match.mjs')).readJobPosting(options.job) : null;
  const session = new ReadSession({ maxRequests: options.budget === undefined ? config.scan.maxRequests : Number(options.budget) });
  const cache = options.fresh || process.env.GH_AURA_NO_CACHE === '1' ? null : new ReadCache();
  const api = { fetch: session.fetch, ...(cache ? { cache } : {}) };
  try {
    if (command === 'achievements' && options.prepare) {
      const { prepareAchievementTask, renderAchievementTask } = await import('../achievement-actions.mjs');
      const plan = await prepareAchievementTask(options.prepare, options.repo,
        { ...api, private: options.private });
      emit(options.format === 'json' ? plan : renderAchievementTask(plan), options);
      return;
    }
    if (command === 'achievements' && !options.user && !options.positional[0] && !config.user) {
      const { achievementReport, renderAchievementsMarkdown } = await import('../achievements.mjs');
      const report = await achievementReport(null, config, { badge: options.badge, scope: options.scope, plan: options.plan, private: options.private });
      emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
    }
    if (command === 'contributions' && options.local) {
      const { inspectLocalGit, renderLocalAttribution } = await import('../local-attribution.mjs');
      const result = inspectLocalGit(options.local, { from: options.from, to: options.to, emailsFile: options['emails-file'] });
      emit(options.format === 'json' ? result : renderLocalAttribution(result), options);
      return;
    }
    const login = loginFor(options, config);
    const includeProfile = ['audit', 'brief', 'diff'].includes(command) || (command === 'profile' && Boolean(options.keep));
    const snapshot = await getSnapshot(login, { ...api, maxRepos: config.scan.maxRepos, includeProfile });
    if (!['contributions', 'achievements'].includes(command) && config.scan.inspectRepos) {
      const { inspectRepositories } = await import('../inspection.mjs');
      await inspectRepositories(snapshot, config, config.scan.inspectRepos, api);
    }
    if (['audit', 'showcase', 'brief'].includes(command) && config.scan.deepRepos) {
      const { inspectProjectEvidence } = await import('../project-evidence.mjs');
      await inspectProjectEvidence(snapshot, config, config.scan.deepRepos, { ...api, verifyChecks: options.checks });
    }
    if (cache?.hits) process.stderr.write('Using recent public data (up to 5 minutes old). Use --fresh to reload.\n');
    if (command === 'achievements') {
      const { achievementReport, renderAchievementsMarkdown } = await import('../achievements.mjs');
      const report = await achievementReport(snapshot, config, { ...api, badge: options.badge, scope: options.scope, plan: options.plan, private: options.private });
      emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
    }
    if (command === 'contributions') {
      const { contributionsReport, renderContributions } = await import('../contributions.mjs');
      const report = await contributionsReport(snapshot, { ...api, details: options.details,
        all: options.all, year: options.year === undefined ? undefined : Number(options.year),
        from: options.from, to: options.to, days: options.days, private: options.private, recover: options.recover, plan: options.plan });
      emit(options.format === 'json' ? report : renderContributions(report), options); return;
    }
    if (command === 'brief') {
      const { editorialBrief } = await import('../brief.mjs');
      const brief = editorialBrief(snapshot, config,{includeExternal:options.external===true});
      const value = options.prompt ? (await import('../editorial.mjs')).writingPrompt(brief) : brief;
      emit(value, options); return;
    }
    const { renderProfile, renderShowcaseMarkdown, renderAuditMarkdown, preserveProfile } = await import('../render.mjs');
    if (command === 'profile') {
      if (options.keep && snapshot.profileReadme?.unknown) throw new Error('Cannot preserve an unreadable existing README.');
      const generated = renderProfile(snapshot, config);
      emit(options.keep ? preserveProfile(snapshot.profileReadme?.content || '', generated) : generated, options); return;
    }
    if (command === 'diff') {
      const { diffText } = await import('../diff.mjs');
      emit(diffText(snapshot.profileReadme?.content || '', renderProfile(snapshot, config)), options); return;
    }
    const { rankRepositories, auditProfile } = await import('../engine.mjs');
    if (command === 'showcase') {
      const ranked = rankRepositories(snapshot, config);
      emit(options.format === 'json' ? ranked : renderShowcaseMarkdown(snapshot.username, ranked), options); return;
    }
    snapshot.dataAccess = { ...(cache?.summary() || {}), ...session.summary() };
    const report = auditProfile(snapshot, config);
    if (command === 'audit') {
      const { hiringReview } = await import('../readiness.mjs');
      report.hiringReview = hiringReview(snapshot, config);
      if (jobPosting) report.jobMatch = (await import('../job-match.mjs')).matchJobPosting(jobPosting, snapshot, config);
    }
    emit(options.format === 'json' ? report : renderAuditMarkdown(report), options);
  } catch (error) {
    // The existing HTTP adapter sanitizes transport errors; retain our own explicit budget diagnosis.
    throw session.failure || error;
  } finally {
    if (options.stats) process.stderr.write('GH Aura usage: ' + JSON.stringify({ ...(cache?.summary() || {}), ...session.summary() }) + '\n');
  }
}

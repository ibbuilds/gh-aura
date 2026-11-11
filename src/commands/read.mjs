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
  if (options.goal !== undefined) config.showcase.goal = options.goal;
  if (options.limit !== undefined) config.showcase.limit = Number(options.limit);
  if (options.inspect !== undefined) config.scan.inspectRepos = Number(options.inspect);
  validateConfig(config);
  const session = new ReadSession({ maxRequests: options.budget === undefined ? config.scan.maxRequests : Number(options.budget) });
  const cache = options.fresh || process.env.GH_AURA_NO_CACHE === '1' ? null : new ReadCache();
  const api = { fetch: session.fetch, ...(cache ? { cache } : {}) };
  try {
    if (command === 'achievements' && !options.user && !options.positional[0] && !config.user) {
      const { achievementReport, renderAchievementsMarkdown } = await import('../achievements.mjs');
      const report = await achievementReport(null, config);
      emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
    }
    const login = loginFor(options, config);
    const includeProfile = ['audit', 'brief', 'diff'].includes(command) || (command === 'profile' && Boolean(options.keep));
    const snapshot = await getSnapshot(login, { ...api, maxRepos: config.scan.maxRepos, includeProfile });
    if (!['contributions', 'achievements'].includes(command) && config.scan.inspectRepos) {
      const { inspectRepositories } = await import('../inspection.mjs');
      await inspectRepositories(snapshot, config, config.scan.inspectRepos, api);
    }
    if (cache?.hits) process.stderr.write('Using recent public data (up to 5 minutes old). Use --fresh to reload.\n');
    if (command === 'achievements') {
      const { achievementReport, renderAchievementsMarkdown } = await import('../achievements.mjs');
      const report = await achievementReport(snapshot, config, api);
      emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
    }
    if (command === 'contributions') {
      const { contributionsReport, renderContributions } = await import('../contributions.mjs');
      const report = await contributionsReport(snapshot, { ...api, details: options.details, all: options.all, year: options.year === undefined ? undefined : Number(options.year) });
      emit(options.format === 'json' ? report : renderContributions(report), options); return;
    }
    if (command === 'brief') {
      const { editorialBrief } = await import('../brief.mjs');
      const brief = editorialBrief(snapshot, config);
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
    emit(options.format === 'json' ? report : renderAuditMarkdown(report), options);
  } catch (error) {
    // The existing HTTP adapter sanitizes transport errors; retain our own explicit budget diagnosis.
    throw session.failure || error;
  } finally {
    if (options.stats) process.stderr.write('GH Aura usage: ' + JSON.stringify({ ...(cache?.summary() || {}), ...session.summary() }) + '\n');
  }
}

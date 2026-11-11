import { getJSON } from './github.mjs';
import { md } from './text.mjs';

const PROFILE = 'https://docs.github.com/en/account-and-profile/reference/profile-reference';
const INTRO = 'https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/';
const COMMUNITY = 'https://github.com/christianalberto/github-profile-achievements';
const entries = [
  ['pull-shark', 'Pull Shark', 'activity', 'Submit useful pull requests that maintainers choose to merge.', INTRO],
  ['pair-extraordinaire', 'Pair Extraordinaire', 'community-reported', 'Co-author real work and correctly credit actual collaborators.', COMMUNITY],
  ['galaxy-brain', 'Galaxy Brain', 'activity', 'Answer real questions in GitHub Discussions; acceptance is controlled by others.', INTRO],
  ['starstruck', 'Starstruck', 'community-reported', 'Publish useful work that other people independently choose to star.', COMMUNITY],
  ['quickdraw', 'Quickdraw', 'community-reported', 'Historically associated with resolving an issue or PR quickly. Do not create disposable tasks to trigger it.', COMMUNITY],
  ['yolo', 'YOLO', 'activity', 'Historically associated with an unreviewed merge. Keep normal review requirements; it is not a quality goal.', INTRO],
  ['public-sponsor', 'Public Sponsor', 'paid', 'Support a project through GitHub Sponsors only when you genuinely want to fund it.', COMMUNITY],
  ['arctic-code-vault', 'Arctic Code Vault Contributor', 'historical', 'A time-limited archive event; not newly earnable.', INTRO],
  ['mars-2020', 'Mars 2020 Helicopter Contributor', 'historical', 'A historical event; not newly earnable.', PROFILE],
  ['pro', 'GitHub Pro', 'paid', 'A paid plan badge, not an engineering credential.', PROFILE],
  ['developer-program', 'Developer Program Member', 'program', 'Participate in the applicable GitHub developer program; eligibility is external.', PROFILE],
  ['campus-expert', 'GitHub Campus Expert', 'program', 'Apply to the applicable student/community program; admission is external.', PROFILE],
  ['security-bounty', 'Security Bug Bounty Hunter', 'program', 'Report a valid security issue under the official program rules. Never test without authorization.', PROFILE],
  ['security-advisory', 'Security advisory credit', 'program', 'Receive credit for an accepted, substantive security advisory contribution.', PROFILE],
];

export const ACHIEVEMENTS = entries.map(([id, name, category, how, source]) => ({
  id, name, category, how, source,
  availability: category === 'historical' ? 'historical — unavailable to new participants' : 'eligibility must be checked with GitHub',
  ruleConfidence: category === 'community-reported' || source === COMMUNITY ? 'unverified-community-report' : 'official-description-not-award-guarantee',
  sourcesReviewedAt: source === COMMUNITY ? null : '2026-11-11',
  caveat: 'GitHub controls awards. This guide does not verify ownership, guarantee thresholds or grant achievements.',
}));
export const ACHIEVEMENT_SOURCES = [PROFILE, INTRO, COMMUNITY];

export async function achievementReport(snapshot, config, options = {}) {
  const settings = config.achievements;
  const ids = new Set(ACHIEVEMENTS.map((item) => item.id));
  for (const id of [...settings.earned, ...settings.excluded]) {
    if (!ids.has(id)) throw new Error('Unknown achievement id: ' + id + '. Run gh-aura achievements to list valid IDs.');
  }
  let merged = null;
  let searchComplete = false;
  if (snapshot) {
    const query = encodeURIComponent('is:pr is:merged is:public author:' + snapshot.username);
    const result = await getJSON('/search/issues?q=' + query + '&per_page=1', options);
    if (Number.isInteger(result?.total_count)) { merged = result.total_count; searchComplete = result.incomplete_results === false; }
  }
  const best = snapshot?.repos.filter((repo) => !repo.fork).reduce((current, repo) =>
    (repo.stargazers_count || 0) > (current?.stargazers_count || 0) ? repo : current, null);
  return {
    user: snapshot?.username || null,
    status: 'opportunities-only; awards unverified',
    catalog: ACHIEVEMENTS.filter((item) => !settings.excluded.includes(item.id)).map((item) => ({
      ...item,
      status: settings.earned.includes(item.id) ? 'self-reported-earned'
        : item.category === 'historical' ? 'unavailable'
        : item.category === 'paid' && !settings.allowPaid ? 'disabled-by-preference' : 'opportunity-unverified',
      evidence: item.id === 'pull-shark' && merged !== null
        ? { observedPublicMergedPRs: merged, searchComplete, note: 'Not an award-eligibility counter; GitHub applies its own rules.' }
        : item.id === 'starstruck' && best ? { repository: best.full_name, observedStars: best.stargazers_count, note: 'Public popularity only, not proof of a badge.' } : null,
    })),
    sources: ACHIEVEMENT_SOURCES,
  };
}

export function renderAchievementsMarkdown(report) {
  const catalog = report?.catalog || ACHIEVEMENTS;
  const lines = ['# GitHub achievement guide', '', 'Opportunities and program information, not automatic awards. No account badge is inferred.', ''];
  for (const item of catalog) lines.push('## ' + md(item.name) + ' (`' + item.id + '`)', '',
    '**Status:** ' + (item.status || item.availability), '', md(item.how), '',
    ...(item.evidence ? ['Evidence: ' + md(JSON.stringify(item.evidence)), ''] : []),
    'Source: ' + item.source, '', md(item.caveat), '');
  return lines.join('\n');
}

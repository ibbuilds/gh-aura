import { getJSON } from './github.mjs';
import { md } from './text.mjs';

const OFFICIAL = 'https://docs.github.com/en/account-and-profile/reference/profile-reference';
const INTRO = 'https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/';
const PRIVATE = 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements';
const COMMUNITY = 'https://github.com/christianalberto/github-profile-achievements';
const REVIEW_DATE = '2026-11-11';

/**
 * This is a read-only capability catalog, NOT an award engine. Award thresholds
 * are community-reported unless an official source explicitly confirms them.
 * No private-repo or third-party action is guaranteed to trigger an achievement.
 */
const collectible = [
  {
    id: 'pull-shark', name: 'Pull Shark', how: 'Have real pull requests merged by maintainers.',
    nextAction: 'Contribute a useful change with tests/docs to a repository you maintain or collaborate on. Open a reviewed pull request and merge only when the change is ready.',
    whoControlsResult: 'maintainers-and-github', privateEligibility: 'possible-unverified-per-award',
    tierThresholdsCommunityReported: [2,16,128,1024], source: INTRO,
    automation: 'private-sandbox-best-effort',
  },
  {
    id: 'pair-extraordinaire', name: 'Pair Extraordinaire',
    how: 'Be credited as an actual co-author of a merged change.',
    nextAction: 'Collaborate with a real person on a substantive change, record correct co-authorship with their permission, and have the reviewed change merged.',
    whoControlsResult: 'real-collaborators-maintainers-and-github', privateEligibility: 'possible-unverified-per-award',
    tierThresholdsCommunityReported: [1,10,24,48], source: COMMUNITY,
    automation: 'prepare-only',
  },
  {
    id: 'galaxy-brain', name: 'Galaxy Brain',
    how: 'Give helpful answers in GitHub Discussions that are accepted.',
    nextAction: 'Answer real questions you can resolve; maintainers/question authors choose which answers to accept.',
    whoControlsResult: 'discussion-maintainers-and-github', privateEligibility: 'requires-public-discussions-or-unknown',
    tierThresholdsCommunityReported: [2,8,16,32], source: INTRO,
    automation: 'external-party',
  },
  {
    id: 'starstruck', name: 'Starstruck',
    how: 'Publish projects other developers independently choose to star.',
    nextAction: 'Improve documentation, usability, releases and real project usefulness. Never generate stars from additional accounts.',
    whoControlsResult: 'independent-users-and-github', privateEligibility: 'requires-public-discovery',
    tierThresholdsCommunityReported: [16,128,512,4096], source: COMMUNITY,
    automation: 'external-party',
  },
  {
    id: 'quickdraw', name: 'Quickdraw',
    how: 'Reportedly related to closing an issue or pull request shortly after opening it.',
    nextAction: 'An opt-in private sandbox can open and close a clearly labeled QA issue; whether GitHub counts the event is unknown.',
    whoControlsResult: 'user-and-github', privateEligibility: 'unknown-per-award',
    source: COMMUNITY, automation: 'private-sandbox-best-effort',
  },
  {
    id: 'yolo', name: 'YOLO',
    how: 'Reportedly related to merging a pull request without code review.',
    nextAction: 'Opt-in private self-owned sandbox merges can be requested where branch protections permit; GitHub may not award YOLO for them.',
    whoControlsResult: 'repo-policy-and-github', privateEligibility: 'unknown-per-award',
    source: INTRO, automation: 'private-sandbox-best-effort',
  },
  {
    id: 'public-sponsor', name: 'Public Sponsor',
    how: 'Support eligible creators through a public GitHub Sponsors relationship.',
    nextAction: 'Consider genuine voluntary sponsorship directly in GitHub; GH Aura does not initiate a payment.',
    whoControlsResult: 'user-github-sponsors', privateEligibility: 'not-applicable',
    source: COMMUNITY, automation: 'external-party', requiresPayment: true,
  },
];

const other = [
  {
    id: 'arctic-code-vault', name: 'Arctic Code Vault Contributor', kind: 'historical',
    how: 'Historical 2020 archive event.', nextAction: 'This historical event cannot be newly joined.',
    source: INTRO, privateEligibility: 'not-applicable',
  },
  {
    id: 'mars-2020', name: 'Mars 2020 Helicopter Contributor', kind: 'historical',
    how: 'Historical NASA/GitHub contribution event.', nextAction: 'Not newly attainable.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'heart-on-your-sleeve', name: 'Heart On Your Sleeve', kind: 'experimental',
    how: 'Community reports an experimental reaction-based badge; public eligibility has not been established.',
    nextAction: 'Not actionable: do not spam reactions.', source: COMMUNITY, privateEligibility: 'unknown',
  },
  {
    id: 'open-sourcerer', name: 'Open Sourcerer', kind: 'experimental',
    how: 'Community reports a disabled/tested open-source badge.',
    nextAction: 'Not actionable through a documented public award path.', source: COMMUNITY, privateEligibility: 'unknown',
  },
  {
    id: 'pro', name: 'GitHub Pro', kind: 'paid', requiresPayment: true,
    how: 'Paid GitHub plan badge, not a GitHub Achievement or evidence of engineering ability.',
    nextAction: 'Only subscribe if you need the plan; never pay just to simulate engineering skill.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'developer-program', name: 'Developer Program Member', kind: 'program',
    how: 'Eligible GitHub developer program participation.',
    nextAction: 'Check current program eligibility directly with GitHub.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'campus-expert', name: 'GitHub Campus Expert', kind: 'program',
    how: 'Program membership for eligible student community leaders.',
    nextAction: 'Check current program requirements and apply through GitHub if eligible.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'security-bounty', name: 'Security Bug Bounty Hunter', kind: 'program',
    how: 'Recognition for valid authorized security reports.',
    nextAction: 'Follow a published vulnerability disclosure policy. Never probe targets without authorization.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'security-advisory', name: 'Security advisory credit', kind: 'program',
    how: 'Credit for an accepted substantive security advisory.',
    nextAction: 'Submit genuine eligible security research for review.',
    source: OFFICIAL, privateEligibility: 'not-applicable',
  },
  {
    id: 'proxima-staff', name: 'GitHub staff-only internal achievements', kind: 'internal',
    how: 'Community-reported internal GitHub staff initiatives; not ordinary user Achievements.',
    nextAction: 'Not publicly attainable; excluded from achievement goals.',
    source: COMMUNITY, privateEligibility: 'not-applicable',
  },
];

export const ACHIEVEMENTS = Object.freeze([...collectible.map((x) => ({
  ...x, kind: 'achievement',
})), ...other].map((x) => Object.freeze({
  ...x, category: x.kind === 'achievement' ? x.requiresPayment ? 'paid' : 'activity' : x.kind,
  sourceReviewedAt: REVIEW_DATE, sourcesReviewedAt: REVIEW_DATE,
  ruleConfidence: x.source === COMMUNITY ? 'community-reported-not-guaranteed'
    : 'official-program-description-award-not-guaranteed',
  eligibility: x.kind === 'historical' ? 'unavailable-historical'
    : x.kind === 'experimental' || x.kind === 'internal' ? 'unverified-or-restricted'
    : x.kind === 'program' ? 'program-dependent'
    : x.requiresPayment ? 'payment-required' : 'potentially-attainable',
  availability: x.kind === 'historical' ? 'historical — unavailable to new participants'
    : 'subject to current GitHub eligibility and award rules',
  automation: x.automation || 'not-supported',
  triggerConfidence: x.source === COMMUNITY ? 'community-reported' : 'partial-official-description',
  requiresPayment: Boolean(x.requiresPayment),
  verification: 'Open your GitHub profile and check whether GitHub displays the achievement. A configured earned ID is only self-reported.',
  caveat: 'GitHub controls awards, tiers and private-event eligibility. Nothing in this tool guarantees a badge.',
})));

export const ACHIEVEMENT_SOURCES = Object.freeze([OFFICIAL, INTRO, PRIVATE, COMMUNITY]);
const IDS = new Set(ACHIEVEMENTS.map((x) => x.id));

const statusFor = (item, settings) => settings.earned.includes(item.id) ? 'self-reported-earned'
  : item.kind === 'historical' ? 'unavailable'
  : item.kind === 'experimental' || item.kind === 'internal' ? 'not-publicly-actionable'
  : item.requiresPayment && !settings.allowPaid ? 'disabled-by-preference'
  : item.kind === 'program' ? 'external-program'
  : 'opportunity-unverified';

function scopeEligible(item, scope, privateOnly, allowPaid) {
  if (scope === 'free' && (item.requiresPayment || item.kind === 'program')) return false;
  if (scope === 'attainable' && (item.kind !== 'achievement' || item.requiresPayment)) return false;
  if (scope === 'free' && item.kind !== 'achievement') return false;
  if (privateOnly && ['requires-public-discovery', 'requires-public-discussions-or-unknown', 'not-applicable'].includes(item.privateEligibility)) return false;
  if (item.requiresPayment && !allowPaid && scope !== 'all') return false;
  return true;
}

/** Read-only status/strategy, with public evidence only when the user provided a login. */
export async function achievementReport(snapshot, config, options = {}) {
  const settings = config.achievements;
  for (const id of [...settings.earned, ...settings.excluded]) {
    if (!IDS.has(id)) throw new Error('Unknown achievement id: ' + id + '. Run gh-aura achievements to list valid IDs.');
  }
  const scope = options.scope || 'all';
  if (!['all', 'free', 'attainable'].includes(scope)) throw new Error('--scope must be all, free, or attainable.');
  if (options.badge && !IDS.has(options.badge)) throw new Error('Unknown achievement id: ' + options.badge + '.');
  const catalog = ACHIEVEMENTS.filter((item) => !settings.excluded.includes(item.id) &&
    (!options.badge || item.id === options.badge) &&
    scopeEligible(item, scope, Boolean(options.private), settings.allowPaid));
  const includeMerged = Boolean(snapshot) && catalog.some((x) => x.id === 'pull-shark');
  let merged = null, searchComplete = false;
  if (includeMerged) {
    const query = encodeURIComponent('is:pr is:merged is:public author:' + snapshot.username);
    const result = await getJSON('/search/issues?q=' + query + '&per_page=10&sort=updated&order=desc', { ...options, publicRead: true });
    if (Number.isInteger(result?.total_count)) { merged = result.total_count; searchComplete = result.incomplete_results === false; }
  }
  const best = catalog.some((item) => item.id === 'starstruck')
    ? snapshot?.repos.filter((repo) => !repo.fork).reduce((current, repo) =>
      (repo.stargazers_count || 0) > (current?.stargazers_count || 0) ? repo : current, null) : null;

  const entries = catalog.map((item) => ({
    ...item,
    status: statusFor(item, settings),
    evidence: item.id === 'pull-shark' && merged !== null
      ? { observedPublicMergedPRs: merged, searchComplete, note: 'Not an award eligibility counter.' }
      : item.id === 'starstruck' && best
        ? { repository: best.full_name, observedStars: best.stargazers_count, note: 'Popularity, not a confirmed badge.' }
        : null,
  }));
  return {
    user: snapshot?.username || null,
    status: 'opportunities-only; awards unverified',
    scope, privateOnly: Boolean(options.private), readOnly: true,
    catalog: entries,
    plan: options.plan ? entries.map((x) => ({
      id: x.id, badge: x.name, kind: x.kind, currentStatus: x.status,
      eligibleForPlanning: x.kind === 'achievement' && x.automation !== 'not-supported' && !x.requiresPayment,
      action: x.nextAction, privateEligibility: x.privateEligibility,
      whoControlsResult: x.whoControlsResult || 'external-program-or-github',
      canGrantAutomatically: false, source: x.source,
    })) : undefined,
    guidance: options.private
      ? 'Private repository events may contribute after the user opts in, but per-achievement private eligibility is not guaranteed. This command neither changes visibility nor performs badge actions.'
      : 'Use --scope free --plan for potentially attainable no-cost achievements; GitHub controls awarding.',
    sources: ACHIEVEMENT_SOURCES,
  };
}

export function renderAchievementsMarkdown(report) {
  const lines = ['# GitHub achievements — @' + (report.user || 'offline guide'), '',
    'Read-only achievement opportunities, not automatic awards or guaranteed thresholds.', '',
    'Scope: ' + report.scope + (report.privateOnly ? ' · private-oriented (unverified per badge)' : ''), ''];
  for (const item of report.catalog) {
    lines.push('## ' + md(item.name) + ' (' + item.id + ')', '',
      '**Kind:** ' + item.kind + ' · **Status:** ' + item.status, '',
      '**Private events:** ' + item.privateEligibility + ' · **Automation:** ' + item.automation, '',
      md(item.how), '', '**Next:** ' + md(item.nextAction), '',
      'Source: ' + item.source + ' (reviewed ' + item.sourceReviewedAt + ')', '');
    if (item.evidence) lines.push('Observed evidence: ' + md(JSON.stringify(item.evidence)), '');
    if (report.plan) lines.push('Awarding: GitHub only; no guaranteed trigger.', '');
  }
  lines.push('## Important', '', report.guidance, '', 'Automated private sandbox events may not earn awards; do not create fake accounts, impersonate other developers or spam public projects.', '',
    'Official profile reference: ' + OFFICIAL, '');
  return lines.join('\n');
}

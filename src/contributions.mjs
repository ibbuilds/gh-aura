import { graphql, tokenFor } from './github.mjs';
import { md } from './text.mjs';

const SOURCE = 'https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference';
const QUERY = `query ProfileHistory($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions totalIssueContributions totalPullRequestContributions
      totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

export function historyYears(createdAt, options = {}) {
  const now = options.now ?? new Date();
  const joined = new Date(createdAt);
  if (!Number.isFinite(joined.getTime()) || joined > now) throw new Error('GitHub returned an invalid account creation date.');
  const first = joined.getUTCFullYear();
  const current = now.getUTCFullYear();
  if (options.all && options.year !== undefined) throw new Error('Choose --all or --year, not both.');
  const year = options.year ?? current;
  if (!Number.isInteger(year) || year < first || year > current) throw new Error('Year must be between ' + first + ' and ' + current + '.');
  return options.all ? Array.from({ length: current - first + 1 }, (_, index) => first + index) : [year];
}

export function summarizeYear(year, collection) {
  const calendar = collection?.contributionCalendar;
  if (!calendar || !Number.isInteger(calendar.totalContributions) || !Array.isArray(calendar.weeks)) {
    throw new Error('GitHub returned incomplete contribution history; no zero-filled result was inferred.');
  }
  const days = calendar.weeks.flatMap((week) => week.contributionDays || []).filter((day) => day.date?.startsWith(year + '-'));
  return {
    year, total: calendar.totalContributions,
    commits: collection.totalCommitContributions, issues: collection.totalIssueContributions,
    pullRequests: collection.totalPullRequestContributions, reviews: collection.totalPullRequestReviewContributions,
    repositories: collection.totalRepositoryContributions,
    restricted: collection.restrictedContributionsCount,
    activeDays: days.filter((day) => day.contributionCount > 0).length,
    firstVisibleDay: days.find((day) => day.contributionCount > 0)?.date || null,
    lastVisibleDay: days.findLast((day) => day.contributionCount > 0)?.date || null,
  };
}

export async function contributionsReport(snapshot, options = {}) {
  const now = options.now ?? new Date();
  const years = historyYears(snapshot.user.created_at, { ...options, now });
  const report = {
    user: snapshot.username, observedAt: now.toISOString(), accountCreatedAt: snapshot.user.created_at,
    status: tokenFor(options) ? 'observed' : 'authentication_required',
    years: [], milestones: [],
    coverage: 'Counts reflect what GitHub exposes to this token, not all work ever performed. Restricted counts have no repository details. A zero is not proof of inactivity.',
    diagnostics: [
      { check: 'Commit email attribution', status: 'manual', action: 'Confirm that emails used by your real commits are associated with your account. Do not publish your email inventory.' },
      { check: 'Eligible branches', status: 'manual', action: 'Inspect default/gh-pages branch eligibility; work on other branches may not count yet.' },
      { check: 'Forks', status: 'observed', value: snapshot.repos.filter((repo) => repo.fork).length, action: 'Fork commits have separate contribution eligibility. Review genuine upstream contributions.' },
      { check: 'Private contribution visibility', status: 'manual', action: 'Review contribution visibility in GitHub profile settings. GH Aura does not change this setting.' },
    ],
    sources: [SOURCE, 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions'],
  };
  if (tokenFor(options)) {
    for (const year of years) {
      // Each collection covers less than one calendar year, including leap years.
      const from = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Math.min(Date.UTC(year + 1, 0, 1) - 1000, now.getTime()));
      const data = await graphql(QUERY, { login: snapshot.username, from: from.toISOString(), to: end.toISOString() }, options);
      const collection = data.user?.contributionsCollection;
      if (!collection) throw new Error('Contribution data is unavailable for this user; no history was inferred.');
      report.years.push(summarizeYear(year, collection));
    }
  }
  report.milestones.push({ date: snapshot.user.created_at, event: 'GitHub account created', source: 'https://github.com/' + snapshot.username });
  for (const repo of snapshot.repos.filter((item) => !item.fork && item.created_at).sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 12)) {
    report.milestones.push({ date: repo.created_at, event: 'Public repository created: ' + repo.name, source: 'https://github.com/' + repo.full_name });
  }
  report.timelineNote = 'Repository creation dates from the scanned public inventory, not project start dates or evidence of seniority. At most 12 repository milestones are shown.';
  return report;
}

export function renderContributions(report) {
  const lines = ['# Contributions: @' + md(report.user), '', md(report.coverage), ''];
  if (report.status === 'authentication_required') lines.push('Provide GH_TOKEN/GITHUB_TOKEN to read annual contribution counts. No graph data was inferred.', '');
  if (report.years.length) {
    lines.push('| Year | Contributions | Commits | PRs | Reviews | Active days |', '| --- | ---: | ---: | ---: | ---: | ---: |');
    for (const year of report.years) lines.push('| ' + [year.year, year.total, year.commits, year.pullRequests, year.reviews, year.activeDays].join(' | ') + ' |');
    lines.push('');
  }
  lines.push('## Visibility checks', '');
  for (const item of report.diagnostics) lines.push('- **' + md(item.check) + '** (' + item.status + '): ' + md(item.action));
  lines.push('', '## Timeline', '', md(report.timelineNote), '');
  for (const milestone of report.milestones) lines.push('- ' + milestone.date.slice(0, 10) + ': [' + md(milestone.event) + '](' + milestone.source + ')');
  lines.push('', 'No commits, authors, timestamps or GitHub settings were changed.', '', 'Reference: ' + report.sources[0]);
  return lines.join('\n') + '\n';
}

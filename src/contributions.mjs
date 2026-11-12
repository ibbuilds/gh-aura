import { graphql, tokenFor, getJSON } from './github.mjs';
import { md } from './text.mjs';

const SOURCE = 'https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference';
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


const HIST_FIELDS = [
  'totalCommitContributions totalIssueContributions totalPullRequestContributions',
  'totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount',
  'contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }',
].join(' ');

function parseUTCDate(value, edge) {
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}-\d{2})?$/.test(value)) {
    throw new Error('--' + edge + ' must be a UTC date YYYY-MM-DD or a year YYYY.');
  }
  const text = /^\d{4}$/.test(value) ? value + (edge === 'from' ? '-01-01' : '-12-31') : value;
  const time = Date.parse(text + 'T00:00:00.000Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== text) {
    throw new Error('--' + edge + ' is not a valid calendar date.');
  }
  return time;
}

/** Bound each query window to one UTC calendar year, with optional user date range. */
export function historyWindows(createdAt, options = {}) {
  const now = options.now ?? new Date();
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime()) || created > now) {
    throw new Error('GitHub returned an invalid account creation date.');
  }
  const dates = options.from !== undefined || options.to !== undefined;
  if (dates && (options.all || options.year !== undefined)) {
    throw new Error('Use --from/--to or --year/--all, not both.');
  }
  if (options.to !== undefined) {
    const requestedEnd = parseUTCDate(options.to, 'to');
    if (requestedEnd > now.getTime() && String(options.to) !== String(now.getUTCFullYear())) {
      throw new Error('Requested interval is empty or outside the account lifetime (future --to).');
    }
  }
  const yearList = dates
    ? null : historyYears(createdAt, options);
  const start = dates ? Math.max(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate()),
    options.from === undefined ? 0 : parseUTCDate(options.from, 'from'))
    : null;
  const end = dates ? Math.min(now.getTime(), options.to === undefined ? now.getTime()
    : parseUTCDate(options.to, 'to') + 86399999)
    : null;
  if (dates && (start > end || end < created.getTime())) {
    throw new Error('Requested date interval is empty or outside the account lifetime.');
  }
  const years = yearList || Array.from(
    { length: new Date(end).getUTCFullYear() - new Date(start).getUTCFullYear() + 1 },
    (_, index) => new Date(start).getUTCFullYear() + index);
  return years.map((year) => {
    const from = new Date(dates ? Math.max(Date.UTC(year, 0, 1), start) : Date.UTC(year, 0, 1));
    const to = new Date(Math.min(Date.UTC(year + 1, 0, 1) - 1000, now.getTime(),
      dates ? end : Infinity));
    if (to < from) throw new Error('Requested date interval is empty.');
    return { year, from: from.toISOString(), to: to.toISOString() };
  });
}

/**
 * Each alias is a separate <=1-year ContributionsCollection, with a read-only
 * GraphQL request batching at most 4 years. A single-year call keeps the
 * original query shape for backwards-compatible mocks/usage.
 */
export async function readContributionWindows(login, windows, options) {
  const collected = [];
  for (let offset = 0; offset < windows.length; offset += 4) {
    const batch = windows.slice(offset, offset + 4);
    if (batch.length === 1) {
      const w = batch[0];
      const query = 'query ProfileHistory($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){' + HIST_FIELDS + '}}}';
      const data = await graphql(query, { login, from: w.from, to: w.to }, options);
      if (!data.user?.contributionsCollection) throw new Error('Contribution data is unavailable; no history was inferred.');
      collected.push({ window: w, collection: data.user.contributionsCollection });
      continue;
    }
    const declarations = batch.map((_, i) => '$from' + i + ':DateTime!,$to' + i + ':DateTime!').join(',');
    const fields = batch.map((_, i) => 'y' + i + ':contributionsCollection(from:$from' + i + ',to:$to' + i + '){' + HIST_FIELDS + '}').join(' ');
    const variables = { login };
    for (const [i, w] of batch.entries()) { variables['from' + i] = w.from; variables['to' + i] = w.to; }
    const query = 'query ProfileHistoryBatch($login:String!,' + declarations + '){user(login:$login){' + fields + '}}';
    const data = await graphql(query, variables, options);
    for (const [i, w] of batch.entries()) {
      const collection = data.user?.['y' + i];
      if (!collection) throw new Error('GitHub returned incomplete contribution collections; no partial graph was used.');
      collected.push({ window: w, collection });
    }
  }
  return collected;
}

export async function contributionsReport(snapshot, options = {}) {
  const now = options.now ?? new Date();
  const windows = historyWindows(snapshot.user.created_at, { ...options, now });
  const report = {
    user: snapshot.username, observedAt: now.toISOString(), accountCreatedAt: snapshot.user.created_at,
    status: tokenFor(options) ? 'observed' : 'authentication_required',
    years: [], milestones: [], interval: {
      from: windows[0]?.from || null, to: windows.at(-1)?.to || null,
      timezone: 'UTC', requestedFrom: options.from ?? null, requestedTo: options.to ?? null,
    }, privateVisibility: options.private ? {
      requested: true, enabledByCLI: false, status: 'manual-account-setting',
      description: 'GitHub may show anonymized eligible private activity if the account opts in. This command does not enable the setting or expose private repository names.',
      instructions: 'On your GitHub profile: Contribution settings → Private contributions.',
      source: 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements',
    } : null,
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
    const observed = await readContributionWindows(snapshot.username, windows, options);
    for (const { window, collection } of observed) {
      const row = summarizeYear(window.year, collection);
      row.from = window.from;
      row.to = window.to;
      if (options.days) {
        const first = window.from.slice(0, 10), last = window.to.slice(0, 10);
        row.days = collection.contributionCalendar.weeks
          .flatMap((week) => week.contributionDays || [])
          .filter((day) => day.date >= first && day.date <= last)
          .map((day) => ({ date: day.date, count: day.contributionCount }));
      }
      report.years.push(row);
    }
  }
  report.milestones.push({ date: snapshot.user.created_at, event: 'GitHub account created', source: 'https://github.com/' + snapshot.username });
  for (const repo of snapshot.repos.filter((item) => !item.fork && item.created_at).sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 12)) {
    report.milestones.push({ date: repo.created_at, event: 'Public repository created: ' + repo.name, source: 'https://github.com/' + repo.full_name });
  }
  if (options.details) await detailMilestones(report, snapshot, options);
  if (options.recover) report.recoveryPlan = [
    { task: 'Inspect real commit authorship locally', status: 'manual',
      command: 'git log --all --format="%h %ad %ae" --date=short',
      reason: 'Compare actual commit email/date on your own clones. Keep private emails private.' },
    { task: 'Confirm historical email addresses on GitHub', status: 'manual',
      url: 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions',
      reason: 'Adding a historical author email to the same account may restore credit for existing qualifying commits without rewriting them.' },
    { task: 'Check branch, fork and repository eligibility', status: 'manual',
      url: 'https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference',
      reason: 'Not every legitimate commit appears on the contribution graph.' },
    { task: 'Opt into anonymized private counts only if desired', status: 'manual',
      url: 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements',
      reason: 'This changes profile visibility in GitHub settings; GH Aura never exposes private repo contents.' },
  ];
  report.timelineNote = 'Repository creation dates are not project start dates or evidence of seniority. Up to 12 creation milestones are shown; --details adds bounded release, authored-commit and merged-PR evidence, not a complete career history.';
  return report;
}

export function renderContributions(report) {
  const lines = ['# Contributions: @' + md(report.user), '', md(report.coverage), ''];
  if (report.status === 'authentication_required') lines.push('Provide GH_TOKEN/GITHUB_TOKEN to read annual contribution counts. No graph data was inferred.', '');
  if (report.years.length) {
    lines.push('| Year | UTC interval | Contributions | Commits | PRs | Reviews | Active days |', '| --- | --- | ---: | ---: | ---: | ---: | ---: |');
    for (const year of report.years) {
      lines.push('| ' + [year.year, year.from?.slice(0, 10) + ' to ' + year.to?.slice(0, 10), year.total,
        year.commits, year.pullRequests, year.reviews, year.activeDays].join(' | ') + ' |');
      if (year.days) lines.push('', 'Daily contributions (' + year.year + ', UTC):',
        ...year.days.map((day) => '- ' + day.date + ': ' + day.count), '');
    }
    lines.push('');
  }
  if (report.privateVisibility) lines.push('## Private contribution visibility', '',
    md(report.privateVisibility.description), '',
    md(report.privateVisibility.instructions), '',
    'Source: ' + report.privateVisibility.source, '');
  if (report.recoveryPlan) {
    lines.push('## Authentic attribution recovery (manual)', '',
      'Review and restore credit for existing work. No history is rewritten.', '');
    for (const item of report.recoveryPlan) lines.push('- **' + md(item.task) + '**: ' + md(item.reason),
      ...(item.command ? ['  Local command: `' + item.command + '`'] : []),
      ...(item.url ? ['  Source: ' + item.url] : []));
    lines.push('');
  }
  lines.push('## Visibility checks', '');
  for (const item of report.diagnostics) lines.push('- **' + md(item.check) + '** (' + item.status + '): ' + md(item.action));
  lines.push('', '## Timeline', '', md(report.timelineNote), '');
  if (report.detailCoverage?.warnings.length) lines.push('Some optional timeline evidence was unavailable; see JSON coverage warnings.', '');
  for (const milestone of report.milestones) lines.push('- ' + milestone.date.slice(0, 10) + ': [' + md(milestone.event) + '](' + milestone.source + ')');
  lines.push('', 'No commits, authors, timestamps or GitHub settings were changed.', '', 'Reference: ' + report.sources[0]);
  return lines.join('\n') + '\n';
}

/** Extra evidence is opt-in: at most seven REST calls, serial and cacheable. */
async function detailMilestones(report, snapshot, options) {
  const read = { ...options, publicRead: true };
  report.detailCoverage = { repositories: [], mergedPRSearchComplete: false, warnings: [] };
  const add = (date, event, source) => {
    if (!date || !Number.isFinite(Date.parse(date)) || Date.parse(date) > Date.parse(report.observedAt) ||
        typeof source !== 'string' || !source.startsWith('https://github.com/')) return;
    report.milestones.push({ date, event, source });
  };
  const optional = async (path) => {
    try { return await getJSON(path, read); }
    catch (error) {
      if ([401, 403, 429].includes(error.status)) throw error;
      report.detailCoverage.warnings.push('An optional evidence request was unavailable.');
      return null;
    }
  };
  const repos = snapshot.repos.filter((repo) => !repo.fork && !repo.archived && repo.private === false)
    .sort((a, b) => String(b.pushed_at || '').localeCompare(String(a.pushed_at || ''))).slice(0, 3);
  for (const repo of repos) {
    const base = '/repos/' + repo.full_name.split('/').map(encodeURIComponent).join('/');
    report.detailCoverage.repositories.push(repo.full_name);
    const releases = await optional(base + '/releases?per_page=3');
    if (Array.isArray(releases)) for (const release of releases) {
      if (!release.draft && release.published_at) add(release.published_at, 'Repository release: ' + repo.full_name + ' ' + release.tag_name, release.html_url);
    }
    const commits = await optional(base + '/commits?author=' + encodeURIComponent(snapshot.username) + '&per_page=1');
    if (Array.isArray(commits)) for (const commit of commits) {
      if (commit.author?.login?.toLowerCase() === snapshot.username.toLowerCase()) {
        add(commit.commit?.author?.date, 'Authored public commit: ' + repo.full_name + ' ' + commit.sha.slice(0, 7), commit.html_url);
      }
    }
  }
  const query = encodeURIComponent('is:pr is:merged is:public author:' + snapshot.username);
  const result = await optional('/search/issues?q=' + query + '&per_page=10&sort=updated&order=desc');
  report.detailCoverage.mergedPRSearchComplete = result?.incomplete_results === false;
  for (const item of result?.items || []) {
    // This date describes opening the PR, not its later merge date.
    if (item.pull_request) add(item.created_at, 'Opened PR (now merged): ' + item.title, item.html_url);
  }
  report.milestones.sort((a, b) => a.date.localeCompare(b.date));
}

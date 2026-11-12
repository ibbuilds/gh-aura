import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { TextDecoder } from 'node:util';

const MAX_COMMITS = 5000;
const GIT_TIMEOUT_MS = 10000;

function git(directory, args, allowFailure = false) {
  try {
    return execFileSync('git', ['-C', directory, ...args], {
      encoding: 'utf8', timeout: GIT_TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
    }).trimEnd();
  } catch {
    if (allowFailure) return null;
    throw new Error('Could not inspect this local Git repository. Confirm that git is installed, the path is a repository, and history is readable.');
  }
}

function parseDate(value, label) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}-\d{2})?$/.test(value)) {
    throw new Error('--' + label + ' must be YYYY or YYYY-MM-DD.');
  }
  const date = value.length === 4 ? value + (label === 'from' ? '-01-01' : '-12-31') : value;
  const time = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) {
    throw new Error('--' + label + ' must be a real calendar date.');
  }
  return label === 'to' ? time + 86399999 : time;
}

function identities(file, directory) {
  const source = file ? 'user-provided-local-file' : 'repository-git-config';
  if (!file) {
    const address = git(directory, ['config', '--get', 'user.email'], true);
    return { source, list: address?.trim() ? [address.trim().toLowerCase()] : [] };
  }
  const stat = statSync(file);
  if (!stat.isFile() || stat.size > 16 * 1024) {
    throw new Error('The email identity file must be a regular UTF-8 file at most 16 KiB.');
  }
  let content;
  try { content = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file)); }
  catch { throw new Error('The email identity file must be UTF-8.'); }
  const lines = content.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  if (lines.length > 100 || !lines.every((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) {
    throw new Error('The identity file must have up to 100 newline-separated email addresses.');
  }
  return { source, list: [...new Set(lines.map((s) => s.toLowerCase()))] };
}

/**
 * Works entirely offline. No emails, Git remote URLs or commit messages leave
 * the process. Matches are candidates, NOT GitHub verified-email attribution.
 */
export function inspectLocalGit(path, options = {}) {
  if (typeof path !== 'string' || !path.trim()) {
    throw new Error('Supply --local PATH to a Git working tree.');
  }
  const directory = resolve(path);
  const from = parseDate(options.from, 'from');
  const to = parseDate(options.to, 'to');
  if (from !== null && to !== null && from > to) throw new Error('The local date range is empty.');
  if (git(directory, ['rev-parse', '--is-inside-work-tree']) !== 'true') {
    throw new Error('The path must point inside a local Git working tree.');
  }
  const identity = identities(options.emailsFile, directory);
  const allowed = new Set(identity.list);
  const shallow = git(directory, ['rev-parse', '--is-shallow-repository'], true) === 'true';
  const countText = git(directory, ['rev-list', '--count', '--all']);
  const historyCount = Number(countText);
  if (!Number.isSafeInteger(historyCount) || historyCount < 0) {
    throw new Error('Git returned an invalid local history count.');
  }
  const output = historyCount ? git(directory, ['log', '--all', '--max-count=' + (MAX_COMMITS + 1),
    '--format=%H%x09%aI%x09%aE']) : '';
  // New and empty repositories have no commits; do not report this as a failure.
  const lines = output ? output.split('\n').filter(Boolean) : [];
  const truncated = historyCount > MAX_COMMITS;
  const counts = { matchingConfiguredIdentity: 0, otherAuthoredCommits: 0,
    unclassifiedCommits: 0, invalidAuthorMetadata: 0, outsideRequestedPeriod: 0 };
  let scanned = 0, oldest = null, newest = null;
  for (const line of lines.slice(0, MAX_COMMITS)) {
    const parts = line.split('\t');
    if (parts.length !== 3 || !/^[a-f0-9]{40,64}$/.test(parts[0]) || !Number.isFinite(Date.parse(parts[1]))) {
      counts.invalidAuthorMetadata++; continue;
    }
    const timestamp = Date.parse(parts[1]);
    if ((from !== null && timestamp < from) || (to !== null && timestamp > to)) {
      counts.outsideRequestedPeriod++; continue;
    }
    scanned++;
    const iso = new Date(timestamp).toISOString();
    oldest = oldest === null || iso < oldest ? iso : oldest;
    newest = newest === null || iso > newest ? iso : newest;
    if (!allowed.size) counts.unclassifiedCommits++;
    else if (allowed.has(parts[2].trim().toLowerCase())) counts.matchingConfiguredIdentity++;
    else counts.otherAuthoredCommits++;
  }
  return {
    mode: 'local-git-attribution-read-only',
    repository: 'local user-selected Git working tree',
    dateRange: { from: options.from ?? null, to: options.to ?? null, basis: 'Git author timestamp (not proof of when work occurred)' },
    scanned, maxCommits: MAX_COMMITS, truncated, shallow,
    identitySource: identity.source, identityCount: allowed.size,
    ...counts, oldestAuthorDate: oldest, newestAuthorDate: newest,
    claims: 'These are local Git metadata, not GitHub-verified authorship or contribution graph eligibility.',
    recommendations: [
      'Compare these local author identities against the email addresses you personally verified in GitHub settings. Never upload an email list to GH Aura.',
      'If actual historical emails are missing from your GitHub account, use supported GitHub account settings to restore eligible attribution.',
      'Review original default/gh-pages branch status and fork/PR eligibility. Local log history alone cannot predict GitHub contribution totals.',
      ...(shallow ? ['Repository is shallow; clone/fetch real history intentionally before drawing conclusions.'] : []),
      ...(truncated ? ['Local inspection capped at 5000 commits; the summary is incomplete.'] : []),
    ],
    privacy: 'No author emails, identities, remote URLs, commit messages or source code are included in this report; no network requests or Git writes occur.',
  };
}

export function renderLocalAttribution(report) {
  return [
    '# Local Git authorship audit', '',
    'This is local Git metadata, NOT confirmed GitHub contribution attribution.', '',
    'Commits checked (within range): ' + report.scanned,
    'Matching provided/configured author emails: ' + report.matchingConfiguredIdentity,
    'Other author identities: ' + report.otherAuthoredCommits,
    'Unclassified (no identity configured): ' + report.unclassifiedCommits,
    'Identity source: ' + report.identitySource + ' (addresses not printed)',
    'Shallow history: ' + (report.shallow ? 'yes' : 'no'),
    'Capped inspection: ' + (report.truncated ? 'yes' : 'no'), '',
    '## Next checks', '',
    ...report.recommendations.map((item) => '- ' + item), '',
    report.privacy, '',
  ].join('\n');
}

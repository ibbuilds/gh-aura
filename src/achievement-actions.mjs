import { getJSON } from './github.mjs';
import { ACHIEVEMENTS } from './achievements.mjs';
import { md } from './text.mjs';

const SAFE = {
  'pull-shark': [
    'Review a real unresolved issue or missing documentation/test in the repository. Confirm that it needs work before editing.',
    'Create a focused branch and implement an actual fix, test, or documentation improvement.',
    'Run relevant tests and open a pull request describing the change; respect repository review rules.',
    'Have the change reviewed and merged because it is useful. Check GitHub for an achievement afterward; award is not guaranteed.',
  ],
  'pair-extraordinaire': [
    'Choose actual work requiring collaboration with a real second engineer who consents to co-authorship.',
    'Implement and review the work together. Credit only people who genuinely authored the change.',
    'Open a substantive PR with correct co-authorship and normal review. GitHub decides if the event qualifies.',
  ],
  'galaxy-brain': [
    'Open the project’s actual Discussions and locate a technical question you can answer correctly.',
    'Respond with an explanation, an example, and sources. Do not post automated filler answers.',
    'The question author or maintainer must accept the answer; GH Aura cannot do this or promise the badge.',
  ],
  'starstruck': [
    'Identify how a real user can install, test and understand the project.',
    'Improve genuine code, documentation, examples or releases when a specific deficiency exists.',
    'Let other developers independently decide whether to star the public project. GH Aura never creates stars.',
  ],
};

export function validateRepositoryName(value) {
  if (typeof value !== 'string' || value.length > 180 ||
    !/^[a-z\d](?:[a-z\d-]*[a-z\d])?\/[a-z\d._-]+$/i.test(value) ||
    value.includes('..') || value.endsWith('.git')) {
    throw new Error('--repo must be an owner/repository name.');
  }
  return value;
}

/**
 * Prepare an evidence-linked task checklist. No writes, no source-code edits,
 * no GitHub achievements, and NO automatic PR creation are performed.
 */
export async function prepareAchievementTask(id, repoName, options = {}) {
  const achievement = ACHIEVEMENTS.find((entry) => entry.id === id);
  if (!achievement) throw new Error('Unknown achievement ID: ' + id);
  if (!SAFE[id]) {
    throw new Error('No safe preparation workflow for ' + achievement.name +
      '. It may be paid, historical, external, or inappropriate to automate.');
  }
  const fullName = validateRepositoryName(repoName);
  const root = 'https://github.com/' + fullName;
  const restricted = options.private === true;
  let repo = null;
  let issues = [];
  if (!restricted) {
    const path = '/repos/' + fullName.split('/').map(encodeURIComponent).join('/');
    repo = await getJSON(path, { ...options, publicRead: true });
    if (!repo) throw new Error('Repository not found. For a private repository, supply --private and review locally.');
    if (repo.private !== false) throw new Error('Repository is private. Use --private to create a local-only checklist without reading private content.');
    if (repo.archived) throw new Error('Archived repositories are not suitable for new achievement work. Choose active work.');
    if (['pull-shark', 'pair-extraordinaire'].includes(id) && repo.has_issues !== false) {
      const items = await getJSON(path + '/issues?state=open&per_page=30', { ...options, publicRead: true });
      if (Array.isArray(items)) {
        issues = items.filter((issue) => !issue.pull_request &&
          issue.html_url?.startsWith(root + '/issues/') &&
          typeof issue.title === 'string').slice(0, 5).map((issue) => ({
          number: issue.number, title: issue.title.slice(0, 180),
          url: issue.html_url, labels: (issue.labels || []).map((label) => label.name).filter(Boolean).slice(0, 4),
          source: 'public-github-issue',
        }));
      }
    }
  }
  return {
    badge: achievement.name, id: achievement.id, repository: fullName,
    repositoryUrl: root,
    reviewMode: restricted ? 'private-local-no-repository-requests' : 'public-read-only',
    verifiedPublicRepository: restricted ? null : true,
    issues,
    tasks: SAFE[id],
    uncertainty: 'These are candidate work steps, not completed contributions. Any GitHub achievement is not guaranteed.',
    whoControlsResult: achievement.whoControlsResult || 'github-and-others',
    userReviewRequired: true,
    writesPerformed: 0, awardsGranted: 0,
    suggestedNextStep: issues.length
      ? 'Read the linked issues and choose a genuinely useful one. Do not open a PR before doing the work.'
      : 'Confirm a real task or open technical question before doing any work.',
    source: achievement.source,
  };
}

export function renderAchievementTask(plan) {
  const lines = ['# Achievement work plan: ' + md(plan.badge), '',
    'Repository: [' + md(plan.repository) + '](' + plan.repositoryUrl + ')',
    'Access: ' + plan.reviewMode, '',
    plan.uncertainty, '', '## Suggested steps', ''];
  plan.tasks.forEach((step, index) => lines.push((index + 1) + '. ' + md(step)));
  if (plan.issues.length) {
    lines.push('', '## Existing public issues to inspect (not automatically chosen)', '');
    for (const issue of plan.issues) {
      lines.push('- [#' + issue.number + ': ' + md(issue.title) + '](' + issue.url + ')');
    }
  }
  lines.push('', '## Consent boundary', '', 'This command makes no GitHub changes, creates no synthetic activity and cannot grant a badge.',
    'The user must review, implement and submit any actual work through the repository’s normal process.',
    '', 'Source: ' + plan.source, '');
  return lines.join('\n');
}

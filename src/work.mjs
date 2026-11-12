import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJSON, requestJSON, decodeReadme, tokenFor } from './github.mjs';
import { diffText } from './diff.mjs';
import { readDraft } from './workflow.mjs';
import { validateRepositoryName } from './achievement-actions.mjs';
import { plain } from './text.mjs';

const MAX_LINES = 600;

export function validateWorkPath(path) {
  if (typeof path !== 'string' || path.length > 180 ||
      !(path === 'README.md' || /^docs\/.+\.md$/i.test(path))) {
    throw new Error('Work PRs support only README.md or Markdown documents under docs/.');
  }
  const parts = path.split('/');
  if (!parts.every((part) => /^[a-z0-9][a-z0-9._-]*$/i.test(part)) ||
      parts.some((part) => part.includes('..') || part.startsWith('.'))) {
    throw new Error('Refusing an unsafe Markdown document path.');
  }
  return path;
}

/** Always fresh. An explicit --private is required to read a private repo. */
export async function workTarget(repoName, path, options = {}) {
  const fullName = validateRepositoryName(repoName);
  const file = validateWorkPath(path);
  const [owner, name] = fullName.split('/');
  const base = '/repos/' + [owner, name].map(encodeURIComponent).join('/');
  const read = { ...options, publicRead: false, cache: undefined };
  const repo = await getJSON(base, read);
  if (!repo || repo.full_name?.toLowerCase() !== fullName.toLowerCase() ||
      typeof repo.default_branch !== 'string' || !repo.default_branch) {
    throw new Error('Could not verify the requested repository and default branch.');
  }
  if (repo.archived) throw new Error('Archived repositories cannot receive new work PRs.');
  if (repo.private && options.private !== true) {
    throw new Error('Private repository: explicitly pass --private after reviewing its visibility.');
  }
  const url = base + '/contents/' + file.split('/').map(encodeURIComponent).join('/') +
    '?ref=' + encodeURIComponent(repo.default_branch);
  const remote = await getJSON(url, read);
  if (!remote) return { repo: repo.full_name, path: file, branch: repo.default_branch,
    sha: null, exists: false, content: '', private: repo.private === true };
  if (remote.path !== file || remote.type !== 'file' || !/^[a-f0-9]{40}$/i.test(remote.sha || '')) {
    throw new Error('The remote document is not a regular Markdown file with a valid revision.');
  }
  return { repo: repo.full_name, path: file, branch: repo.default_branch,
    sha: remote.sha, exists: true, content: decodeReadme(remote, 256 * 1024),
    private: repo.private === true };
}

function ensureReviewable(target, draft) {
  if ([target.content, draft].some((s) => s.split('\n').length > MAX_LINES)) {
    throw new Error('Document exceeds the 600-line review limit; no approval was generated.');
  }
  if ([target.content, draft].some((s) => plain(s) !== s)) {
    throw new Error('Document contains terminal control characters; no approval was generated.');
  }
}

export function workApproval(target, draft) {
  return createHash('sha256').update(JSON.stringify({
    purpose: 'explicit-unmerged-docs-pr-v1',
    repo: target.repo.toLowerCase(), branch: target.branch, path: target.path,
    sha: target.sha, before: target.content, after: draft,
    private: target.private,
  })).digest('hex');
}

export function previewWork(target, draft) {
  ensureReviewable(target, draft);
  return [
    'GH Aura — documentation PR review',
    'Target: ' + target.repo + '/' + target.path + ' on ' + target.branch,
    'Visibility: ' + (target.private ? 'PRIVATE (explicitly requested)' : 'public'),
    '',
    diffText(target.content, draft),
    'Review fingerprint: ' + workApproval(target, draft),
    '',
    'Review the entire diff and ensure this is real, useful work.',
    'Next: gh-aura work apply --review REVIEW.json',
    'No document, issue, PR, commit, achievement, or contribution has been created.',
    '',
  ].join('\n');
}

export function saveWorkReview(path, target, draftPath, draft, force = false) {
  ensureReviewable(target, draft);
  if (resolve(path) === resolve(draftPath)) {
    throw new Error('Review JSON cannot replace the Markdown draft.');
  }
  const review = {
    format: 'gh-aura-doc-pr-review-v1',
    repository: target.repo, path: target.path, branch: target.branch,
    private: target.private, file: resolve(draftPath),
    baseRevision: target.sha, approval: workApproval(target, draft),
  };
  writeFileSync(path, JSON.stringify(review, null, 2) + '\n', {
    flag: force ? 'w' : 'wx', mode: 0o600,
  });
  return review;
}

export function readWorkReview(file) {
  if (typeof file !== 'string' || !file.trim()) throw new Error('Supply --review FILE.');
  const stat = statSync(file);
  if (!stat.isFile() || stat.size > 16 * 1024) throw new Error('Review must be a small regular JSON file.');
  let value;
  try { value = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error('Review must contain valid JSON.'); }
  if (!value || value.format !== 'gh-aura-doc-pr-review-v1' ||
      typeof value.file !== 'string' || !value.file ||
      typeof value.branch !== 'string' || !value.branch ||
      typeof value.private !== 'boolean' ||
      !/^[a-f0-9]{64}$/i.test(value.approval || '')) {
    throw new Error('Invalid work review. Generate a new preview.');
  }
  validateRepositoryName(value.repository);
  validateWorkPath(value.path);
  return value;
}

/**
 * Opens a PR in a repo where the user has permission to push a review branch.
 * Only one reviewed Markdown document can change; no forced writes or merges.
 */
export async function applyWork(target, draft, approval, options = {}) {
  ensureReviewable(target, draft);
  if (!/^[a-f0-9]{64}$/i.test(approval || '') ||
      workApproval(target, draft) !== approval.toLowerCase()) {
    throw new Error('Approval mismatch: draft, visibility or remote revision changed. Preview again.');
  }
  if (target.content === draft) return { changed: false, message: 'Target document already matches the approved draft.' };
  if (!tokenFor(options)) throw new Error('Opening a work PR needs a scoped GitHub token with Contents and Pull requests write permissions.');
  const base = '/repos/' + target.repo.split('/').map(encodeURIComponent).join('/');
  const read = { ...options, publicRead: false, cache: undefined };
  const branch = 'gh-aura/docs-' + approval.toLowerCase().slice(0, 20);
  const ref = base + '/git/ref/heads/' + branch;
  const write = async (path, method, body) => {
    try { return await requestJSON(path, { ...read, method, body }); }
    catch (error) {
      throw new Error(error.message + ' Check review branch ' + branch + ' before retrying; writes are never retried automatically.');
    }
  };
  const pause = () => (options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(1000);
  const existingBranch = await getJSON(ref, read);
  if (!existingBranch) {
    const baseRef = await getJSON(base + '/git/ref/heads/' +
      target.branch.split('/').map(encodeURIComponent).join('/'), read);
    if (!/^[a-f0-9]{40}$/i.test(baseRef?.object?.sha || '')) {
      throw new Error('Could not verify the current default branch revision. No write occurred.');
    }
    await write(base + '/git/refs', 'POST', {
      ref: 'refs/heads/' + branch, sha: baseRef.object.sha,
    });
    await pause();
    await write(base + '/contents/' + target.path.split('/').map(encodeURIComponent).join('/'),
      'PUT', {
        message: 'docs: propose reviewed documentation improvement', branch,
        content: Buffer.from(draft, 'utf8').toString('base64'),
        ...(target.sha ? { sha: target.sha } : {}),
      });
    await pause();
  }

  const current = await getJSON(base + '/contents/' +
    target.path.split('/').map(encodeURIComponent).join('/') + '?ref=' +
    encodeURIComponent(branch), read);
  if (!current || current.type !== 'file' || decodeReadme(current, 256 * 1024) !== draft) {
    throw new Error('The review branch is different from the approved draft. It was not overwritten.');
  }
  const comparison = await getJSON(base + '/compare/' + encodeURIComponent(target.branch) +
    '...' + encodeURIComponent(branch), read);
  if (!Array.isArray(comparison?.files) || comparison.files.length !== 1 ||
      comparison.files[0].filename !== target.path ||
      !['added', 'modified'].includes(comparison.files[0].status)) {
    throw new Error('The review branch contains unexpected changes. Nothing was merged or opened.');
  }
  const [owner] = target.repo.split('/');
  const q = new URLSearchParams({ state: 'open', head: owner + ':' + branch,
    base: target.branch, per_page: '10' });
  const pulls = await getJSON(base + '/pulls?' + q, read);
  if (!Array.isArray(pulls)) throw new Error('Unable to verify open PRs; inspect the review branch before retrying.');
  if (pulls.length) return {
    changed: false, message: 'The approved work PR is already open.',
    pullRequest: pulls[0].html_url, branch,
  };
  const result = await write(base + '/pulls', 'POST', {
    title: 'docs: review a focused documentation improvement',
    head: branch, base: target.branch,
    body: 'User-authored GH Aura change, explicitly reviewed before opening. Only one Markdown file is changed. Maintainers must review its usefulness before merging. A GitHub achievement is not guaranteed.',
  });
  if (!result?.html_url || !Number.isInteger(result.number)) {
    throw new Error('GitHub did not confirm the PR. Inspect open PRs before retrying.');
  }
  return { changed: true, message: 'Reviewed documentation PR opened (not merged).',
    pullRequest: result.html_url, branch };
}

/** The only CLI entrypoint that may perform the approved remote work write. */
export async function runWork(command, options) {
  if (command === 'preview') {
    const draft = readDraft(options.file);
    const target = await workTarget(options.repo, options.path, { private: options.private });
    const preview = previewWork(target, draft);
    process.stdout.write(preview);
    if (options.save) {
      saveWorkReview(options.save, target, options.file, draft, options.force);
      process.stderr.write('Saved reviewed operation to ' + resolve(options.save) + '\n');
    }
    return;
  }
  const review = readWorkReview(options.review);
  const draft = readDraft(review.file);
  const target = await workTarget(review.repository, review.path, { private: review.private });
  const result = await applyWork(target, draft, review.approval);
  process.stdout.write((options.format === 'json'
    ? JSON.stringify(result, null, 2)
    : result.message + (result.pullRequest ? '\n' + result.pullRequest : '')) + '\n');
}

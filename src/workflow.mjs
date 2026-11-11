import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJSON, requestJSON, decodeReadme, tokenFor, validateLogin } from './github.mjs';
import { diffText } from './diff.mjs';
import { plain } from './text.mjs';

export function readDraft(filename) {
  if (!filename) throw new Error('Specify a Markdown draft with --file <path>.');
  const stat = statSync(filename);
  if (!stat.isFile() || stat.size > 256 * 1024) throw new Error('Draft must be a regular UTF-8 file, at most 256 KiB.');
  const content = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(filename));
  if (!content.trim()) throw new Error('Draft is empty.');
  if (plain(content) !== content) throw new Error('Draft contains terminal control characters. Remove them before review.');
  return content;
}

export async function profileTarget(username, options = {}) {
  options = { ...options, cache: undefined, publicRead: false }; // Publication must never use cached state.
  const login = validateLogin(username);
  const part = encodeURIComponent(login);
  const base = '/repos/' + part + '/' + part;
  const repo = await getJSON(base, options);
  if (!repo) throw new Error('Create the public ' + login + '/' + login + ' profile repository before preview/apply.');
  if (repo.private) throw new Error('A profile README repository must be public.');
  if (repo.full_name?.toLowerCase() !== (login + '/' + login).toLowerCase() || !repo.default_branch) {
    throw new Error('GitHub returned an unexpected profile repository or branch.');
  }
  const branch = repo.default_branch;
  const path = 'README.md';
  const remote = await getJSON(base + '/contents/' + path + '?ref=' + encodeURIComponent(branch), options);
  const target = { login, repo: repo.full_name, branch, path, sha: null, content: '', exists: false };
  if (!remote) return target;
  if (remote.path !== path || remote.type !== 'file' || !/^[a-f\d]{40}$/i.test(remote.sha || '')) {
    throw new Error('GitHub did not return a regular root README.md with a valid revision.');
  }
  return { ...target, exists: true, sha: remote.sha, content: decodeReadme(remote, 256 * 1024) };
}

export function approvalCode(target, proposed) {
  return createHash('sha256').update(JSON.stringify({
    login: target.login.toLowerCase(), repo: target.repo?.toLowerCase(), branch: target.branch,
    path: target.path, sha: target.sha, before: target.content, after: proposed,
  })).digest('hex');
}

function reviewable(target, proposed) {
  if ([target.content, proposed].some((text) => text.split('\n').length > 600)) {
    throw new Error('README exceeds the 600-line review limit. No approval was generated; review/edit it manually.');
  }
  if ([target.content, proposed].some((text) => plain(text) !== text)) {
    throw new Error('README contains terminal control characters. No approval was generated.');
  }
}

export function previewProfile(target, proposed) {
  reviewable(target, proposed);
  return ['GH Aura — profile review', 'Target: ' + target.repo + '/' + target.path + ' on ' + target.branch, '',
    diffText(target.content, proposed), 'Approval code:', approvalCode(target, proposed), '',
    'Publish only after reviewing the draft:',
    '  gh-aura apply ' + target.login + ' --file <draft.md> --approve ' + approvalCode(target, proposed),
    '', 'Nothing has been published.'].join('\n') + '\n';
}

export function saveReview(filename, target, draftPath, proposed, force = false) {
  reviewable(target, proposed);
  if (resolve(filename) === resolve(draftPath)) throw new Error('Review file cannot overwrite the draft.');
  const review = { format: 'gh-aura-review-v1', user: target.login, file: resolve(draftPath),
    target: { repository: target.repo, branch: target.branch, path: target.path, sha: target.sha },
    approval: approvalCode(target, proposed) };
  writeFileSync(filename, JSON.stringify(review, null, 2) + '\n', { flag: force ? 'w' : 'wx', mode: 0o600 });
  return review;
}

export function readReview(filename) {
  if (!filename || statSync(filename).size > 16384) throw new Error('Invalid review file.');
  let value;
  try { value = JSON.parse(readFileSync(filename, 'utf8')); } catch { throw new Error('Review file must contain valid JSON.'); }
  if (!value || value.format !== 'gh-aura-review-v1' || typeof value.file !== 'string' || !/^[a-f\d]{64}$/.test(value.approval || '')) {
    throw new Error('Unsupported review file. Run preview --save again.');
  }
  validateLogin(value.user);
  return value;
}

export async function applyProfile(target, proposed, approvedCode, options = {}) {
  reviewable(target, proposed);
  if (!/^[a-f\d]{64}$/i.test(approvedCode || '') || approvalCode(target, proposed) !== approvedCode.toLowerCase()) {
    throw new Error('Approval code mismatch. Run preview again; the draft, branch or remote README changed.');
  }
  if (target.content === proposed) return { changed: false, message: 'Remote README already matches the reviewed draft.' };
  if (!tokenFor(options)) throw new Error('Publishing requires GH_TOKEN or GITHUB_TOKEN with contents:write to the profile repository.');
  if (target.path !== 'README.md' || !target.branch) throw new Error('Refusing an unsupported publish target.');
  const part = encodeURIComponent(validateLogin(target.login));
  const body = { message: 'docs(profile): update reviewed README with GH Aura', branch: target.branch,
    content: Buffer.from(proposed, 'utf8').toString('base64'), ...(target.sha ? { sha: target.sha } : {}) };
  const result = await requestJSON('/repos/' + part + '/' + part + '/contents/README.md', { ...options, method: 'PUT', body });
  if (!result?.commit?.sha) throw new Error('GitHub did not confirm a commit revision. Run preview before retrying; do not assume the update failed.');
  return { changed: true, message: 'Reviewed profile README committed.', commit: result.commit.html_url || null,
    sha: result.commit.sha, target: target.repo + '/README.md' };
}

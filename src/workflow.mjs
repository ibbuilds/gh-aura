import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { getJSON, validateLogin } from './github.mjs';
import { diffText } from './diff.mjs';

const MAX_DRAFT_BYTES = 256 * 1024;

export function readDraft(filename) {
  if (!filename) throw new Error('Specify an existing Markdown draft with --file <path>.');
  if (statSync(filename).size > MAX_DRAFT_BYTES) {
    throw new Error('Draft exceeds 256 KiB. Reduce it before previewing.');
  }
  const content = readFileSync(filename, 'utf8');
  if (!content.trim()) throw new Error('Draft is empty.');
  if (Buffer.byteLength(content, 'utf8') > MAX_DRAFT_BYTES) {
    throw new Error('Draft exceeds 256 KiB. Reduce it before previewing.');
  }
  if (content.includes('\0')) throw new Error('Draft contains invalid NUL characters.');
  return content;
}

function contentFromGitHub(data) {
  if (!data || data.encoding !== 'base64' || typeof data.content !== 'string') {
    throw new Error('GitHub did not return decodable README content; no changes can be approved.');
  }
  return Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

export async function profileTarget(username, options = {}) {
  const login = validateLogin(username);
  const encoded = encodeURIComponent(login);
  const base = '/repos/' + encoded + '/' + encoded;
  const repo = await getJSON(base, options);
  if (!repo) {
    throw new Error('Profile repository ' + login + '/' + login +
      ' does not exist or is not accessible. Create it on GitHub first.');
  }
  if (repo.private) {
    throw new Error('A profile README repository must be public to appear on the GitHub profile.');
  }
  const remote = await getJSON(base + '/readme', options);
  if (!remote) return {
    login, path: 'README.md', sha: null, content: '', exists: false, repo: login + '/' + login,
  };
  const path = remote.path || 'README.md';
  if (!/^[^/\\]+\.(?:md|markdown)$/i.test(path)) {
    throw new Error('Existing README uses an unsupported path. Edit the profile repo manually.');
  }
  if (!/^[a-f0-9]{40}$/i.test(remote.sha || '')) {
    throw new Error('GitHub did not return the expected README SHA.');
  }
  return {
    login, path, sha: remote.sha, content: contentFromGitHub(remote),
    exists: true, repo: login + '/' + login,
  };
}

export function approvalCode(target, proposed) {
  return createHash('sha256').update(JSON.stringify({
    login: target.login.toLowerCase(),
    path: target.path,
    sha: target.sha,
    before: target.content,
    after: proposed,
  })).digest('hex');
}

export function previewProfile(target, proposed) {
  const code = approvalCode(target, proposed);
  return [
    'GH Aura — profile change review',
    'Target: ' + target.repo + '/' + target.path,
    'Current state: ' + (target.exists ? 'existing README' : 'README will be created'),
    '',
    diffText(target.content, proposed),
    'Approval code (SHA-256; bound to current README and exact draft):',
    code,
    '',
    'To publish this *exact* reviewed change:',
    '  gh-aura apply ' + target.login + ' --file <draft.md> --approve ' + code,
    '',
    'Do not publish if the content differs from what you reviewed.',
  ].join('\n') + '\n';
}

export async function applyProfile(target, proposed, approvedCode, options = {}) {
  if (!/^[a-f0-9]{64}$/i.test(approvedCode || '') ||
      approvalCode(target, proposed) !== approvedCode.toLowerCase()) {
    throw new Error('Approval code mismatch. Run preview again to review the current diff.');
  }
  if (target.content === proposed) return {
    changed: false, message: 'Remote README already matches the approved draft.',
  };
  const token = options.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Publishing requires GH_TOKEN or GITHUB_TOKEN with contents:write to the profile repository.');
  }
  const encoded = encodeURIComponent(target.login);
  const url = 'https://api.github.com/repos/' + encoded + '/' + encoded +
    '/contents/' + encodeURIComponent(target.path);
  const body = {
    message: 'docs(profile): update reviewed README with GH Aura',
    content: Buffer.from(proposed, 'utf8').toString('base64'),
  };
  if (target.sha) body.sha = target.sha;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'gh-aura-cli',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const message = response.status === 409 || response.status === 422
      ? 'GitHub rejected this update (conflict or validation). Re-run preview before trying again.'
      : 'GitHub refused the approved update (HTTP ' + response.status + '). Check token and repository permissions.';
    throw new Error(message);
  }
  const result = await response.json();
  return {
    changed: true,
    message: 'Approved profile README committed.',
    commit: result.commit?.html_url || null,
    target: target.repo + '/' + target.path,
  };
}

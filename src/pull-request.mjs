import { getJSON, requestJSON, decodeReadme, tokenFor } from './github.mjs';
import { approvalCode, previewProfile } from './workflow.mjs';

/** Publish only the reviewed README on a separate branch. Never merge or force-push. */
export async function proposeProfile(target, proposed, approval, options = {}) {
  previewProfile(target, proposed); // Apply the same full-review and control-character limits.
  if (approvalCode(target, proposed) !== approval) throw new Error('Approval code mismatch. Run preview again.');
  if (target.content === proposed) return { changed: false, message: 'Remote README already matches the reviewed draft.' };
  if (!tokenFor(options)) throw new Error('Opening a PR requires a token with Contents and Pull requests write access to the profile repository.');
  if (target.path !== 'README.md' || target.repo.toLowerCase() !== (target.login + '/' + target.login).toLowerCase()) throw new Error('Unsupported profile target.');
  const base = '/repos/' + target.repo.split('/').map(encodeURIComponent).join('/');
  const branch = 'gh-aura/profile-' + approval.slice(0, 20);
  const read = { ...options, cache: undefined, publicRead: false };
  const refPath = base + '/git/ref/heads/' + branch;
  const existing = await getJSON(refPath, read);
  const pause = () => (options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(1000);
  const put = (path, body) => requestJSON(path, { ...read, method: 'POST', body });
  if (!existing) {
    const source = await getJSON(base + '/git/ref/heads/' + target.branch.split('/').map(encodeURIComponent).join('/'), read);
    if (!/^[a-f\d]{40}$/i.test(source?.object?.sha || '')) throw new Error('Could not verify the base branch revision. Nothing was published.');
    await put(base + '/git/refs', { ref: 'refs/heads/' + branch, sha: source.object.sha });
    await pause();
    await requestJSON(base + '/contents/README.md', { ...read, method: 'PUT', body: {
      message: 'docs(profile): propose reviewed README', branch,
      content: Buffer.from(proposed, 'utf8').toString('base64'), ...(target.sha ? { sha: target.sha } : {}),
    } });
    await pause();
  }
  // This also detects a previously interrupted publication or a modified review branch.
  const current = await getJSON(base + '/contents/README.md?ref=' + encodeURIComponent(branch), read);
  if (!current || current.type !== 'file' || decodeReadme(current) !== proposed) {
    throw new Error('The review branch does not match the draft. Inspect ' + branch + ' manually; it was not overwritten.');
  }
  const query = new URLSearchParams({ state: 'open', head: target.login + ':' + branch, base: target.branch, per_page: '10' });
  const pulls = await getJSON(base + '/pulls?' + query, read);
  if (!Array.isArray(pulls)) throw new Error('Could not inspect open PRs. Check the review branch before retrying.');
  if (pulls.length) return { changed: false, message: 'The reviewed PR is already open.', pullRequest: pulls[0].html_url, branch };
  const result = await put(base + '/pulls', { title: 'docs(profile): update reviewed README', head: branch, base: target.branch,
    body: 'User-requested GH Aura profile update. Review the README diff before merging. No other profile settings or history are modified.' });
  if (!result?.html_url || !Number.isInteger(result.number)) throw new Error('GitHub did not confirm the PR. Inspect open PRs before retrying.');
  return { changed: true, message: 'Reviewed profile PR opened; nothing was merged.', pullRequest: result.html_url, branch };
}

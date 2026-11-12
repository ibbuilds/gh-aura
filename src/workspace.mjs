import { loadConfig } from './config.mjs';

// One marked repository may host both activity practice and private badge exercises.
// Legacy badge-only markers remain readable, but never adopt unmarked repositories.
export const WORKSPACE_MARKER = 'GH-AURA-PRIVATE-WORKSPACE-V1';
export const LEGACY_BADGE_MARKER = 'GH-AURA-PRIVATE-BADGE-SANDBOX-V1';

export const WORKSPACE_README = '# GH Aura private workspace\n\n' +
  WORKSPACE_MARKER + '\n' + LEGACY_BADGE_MARKER + '\n\n' +
  'This user-owned private repository contains clearly labeled synthetic practice and ' +
  'GitHub workflow exercises. It is not verified historical professional work.\n' +
  'GitHub alone decides contribution and achievement eligibility.\n';

export function managedWorkspaceReadme(text) {
  return typeof text === 'string' &&
    (text.includes(WORKSPACE_MARKER) || text.includes(LEGACY_BADGE_MARKER));
}

export function workspaceRepo(explicit) {
  if(explicit !== undefined && explicit !== null && explicit !== '') return validWorkspaceRepo(explicit);
  const config = loadConfig();
  const repo = config.workspace.repo || (config.user ? config.user + '/gh-aura-workspace' : '');
  if(!repo) throw Error('Set a private workspace with gh-aura init USER, config set workspace.repo OWNER/REPO, or --repo OWNER/REPO.');
  return validWorkspaceRepo(repo);
}

export function validWorkspaceRepo(value) {
  if(typeof value!=='string' ||
    !/^[a-z\d](?:[a-z\d-]*[a-z\d])?\/[a-z\d][\w.-]{0,79}$/i.test(value) ||
    value.includes('..') || value.endsWith('.git')) {
    throw Error('Private workspace must be OWNER/REPO.');
  }
  return value;
}

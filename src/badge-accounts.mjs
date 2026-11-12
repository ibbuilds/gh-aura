import { getJSON, decodeReadme, tokenFor, validateLogin } from './github.mjs';
import { workspaceRepo, managedWorkspaceReadme } from './workspace.mjs';

/**
 * Verify that two independently authenticated accounts can READ the same
 * owned, marked private workspace. Never stores, forwards or prints tokens.
 * No badge actions or collaborator invitation is performed here.
 */
export async function inspectBadgeAccounts(opts={}) {
  const primaryToken=tokenFor(opts);
  const secondaryToken=opts.collaboratorToken??process.env.GH_AURA_COLLAB_TOKEN??'';
  if(!primaryToken||!secondaryToken)
    throw Error('Set GH_TOKEN/GITHUB_TOKEN and GH_AURA_COLLAB_TOKEN in the local environment.');
  if(primaryToken===secondaryToken)
    throw Error('Primary and collaborator credentials must be different.');
  const repo=workspaceRepo(opts.repo);
  const [ownerName,repoName]=repo.split('/');
  const base='/repos/'+encodeURIComponent(ownerName)+'/'+encodeURIComponent(repoName);
  const auth=(token)=>({...opts,token,publicRead:false,cache:undefined});
  const [primaryUser,secondaryUser]=await Promise.all([
    getJSON('/user',auth(primaryToken)),
    getJSON('/user',auth(secondaryToken)),
  ]);
  const owner=validateLogin(primaryUser?.login);
  const collaborator=validateLogin(secondaryUser?.login);
  if(owner.toLowerCase()!==ownerName.toLowerCase())
    throw Error('Primary account must own the selected private GH Aura workspace.');
  if(owner.toLowerCase()===collaborator.toLowerCase())
    throw Error('Both credentials authenticate as the same account. Use two distinct authorized accounts.');
  const [primaryRepo,secondaryRepo]=await Promise.all([
    getJSON(base,auth(primaryToken)),
    getJSON(base,auth(secondaryToken)),
  ]);
  const valid=(candidate)=>candidate?.private===true&&candidate?.fork!==true&&
    candidate?.archived!==true&&candidate?.full_name?.toLowerCase()===repo.toLowerCase()&&
    typeof candidate.default_branch==='string'&&candidate.default_branch.length>0;
  if(!valid(primaryRepo))
    throw Error('Primary workspace is missing, non-private, forked, archived or unrelated.');
  if(!valid(secondaryRepo)||secondaryRepo.default_branch!==primaryRepo.default_branch)
    throw Error('Collaborator cannot read the same private workspace. Grant only necessary repository access.');
  const readmePath=base+'/contents/README.md?ref='+encodeURIComponent(primaryRepo.default_branch);
  const [primaryReadme,secondaryReadme]=await Promise.all([
    getJSON(readmePath,auth(primaryToken)),getJSON(readmePath,auth(secondaryToken))
  ]);
  if(!managedWorkspaceReadme(decodeReadme(primaryReadme))||
     !managedWorkspaceReadme(decodeReadme(secondaryReadme)))
    throw Error('Both accounts must read the marked GH Aura README in the same private workspace.');
  return {
    status:'two-distinct-accounts-read-verified-awards-unverified',
    repository:'https://github.com/'+repo,
    private:true,
    primary:{login:owner,role:'workspace-owner',readAccess:true},
    collaborator:{login:collaborator,role:'authorized-private-reader',readAccess:true},
    writesPerformed:0,
    scope:'read-only credential and shared workspace preflight',
    note:'This does not verify write permissions, genuine coauthorship, accepted Discussion answers or award eligibility.',
  };
}

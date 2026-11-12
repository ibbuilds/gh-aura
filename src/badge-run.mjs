import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { requestJSON, getJSON, decodeReadme, tokenFor, validateLogin } from './github.mjs';
import { workspaceRepo, managedWorkspaceReadme, WORKSPACE_README } from './workspace.mjs';
import { ACHIEVEMENT_MATRIX, PRIVATE_AUTOMATABLE, PULL_SHARK_TIERS,
  MATRIX_VERSION, achievementMatrixSummary } from './achievement-matrix.mjs';

const MARKER='GH-AURA-PRIVATE-BADGE-SANDBOX-V1';
const MAX_PULLS=16;
const MAX_EXERCISE_INDEX=1024;
const PLAN_FORMAT='gh-aura-private-badges-v2';
const LEGACY_PLAN_FORMAT='gh-aura-private-badges-v1';
const maxFile=65536;
const DOCS=[
  ['Testing contracts','Define expected inputs, edge cases, error outcomes and validation checks. A runnable test is stronger evidence than a title or badge.'],
  ['API reliability','Document retryable versus non-retryable failures, idempotent operations, timeouts and observable diagnostics.'],
  ['Secure defaults','Document least privilege, input validation, secret isolation and safe failure behavior.'],
  ['Performance review','Separate request count, response size, caching, algorithmic complexity and reproducible benchmarks.'],
  ['Release checklist','Describe pre-release validation, rollback steps, versioning and independent verification of produced artifacts.'],
  ['Contributor experience','Document setup steps, tests, review boundaries, attribution and the expected behavior of pull requests.'],
  ['Architecture trade-offs','Contrast a simple implementation with a more complex alternative and define a reason to change.'],
  ['Observability','List meaningful events, error signals, privacy boundaries and what a maintainer should verify.']
];
function validRepo(value){
  if(typeof value!=='string'||!/^[a-z\d][a-z\d-]{0,38}\/[a-z\d][a-z\d._-]{0,79}$/i.test(value)||
      value.includes('..')||value.endsWith('.git'))throw Error('--repo must be OWNER/NEW_PRIVATE_REPO.');
  return value;
}
function int(value,label,min,max){
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)throw Error(label+' must be an integer '+min+'..'+max+'.');
  return n;
}
function planPayload(doc){
  const base={format:doc.format,repo:doc.repo,private:doc.private,
    pulls:doc.pulls,start:doc.start,quickdraw:doc.quickdraw,role:doc.role};
  if(doc.format===LEGACY_PLAN_FORMAT)return base;
  return {...base,tier:doc.tier??null,targetThreshold:doc.targetThreshold??null,
    catalogVersion:doc.catalogVersion,attempts:doc.attempts,excluded:doc.excluded};
}
export function badgeDigest(doc) {
  return createHash('sha256').update(JSON.stringify(planPayload(doc))).digest('hex');
}
/**
 * Only actions controlled by an account in a private repository are attempted.
 * GitHub award rules are unpublished/variable: this is not a grant promise.
 */
export function planBadgeRun(options={}) {
  const repo=validRepo(workspaceRepo(options.repo));
  const start=int(options.start??0,'--start',0,MAX_EXERCISE_INDEX);
  const tier=options.tier||null;
  if(tier && !Object.hasOwn(PULL_SHARK_TIERS,tier))
    throw Error('--tier must be base, bronze, silver or gold.');
  const targetThreshold=tier?PULL_SHARK_TIERS[tier]:null;
  if(tier && start>=targetThreshold)
    throw Error('--start has reached the selected tier threshold. Select a higher tier or a lower start.');
  const suggested=targetThreshold===null?2:Math.min(MAX_PULLS,targetThreshold-start);
  const pulls=int(options.pulls??suggested,'--pulls',0,MAX_PULLS);
  if(start+pulls>MAX_EXERCISE_INDEX || (tier && start+pulls>targetThreshold))
    throw Error('Planned PR exercise indices exceed the selected tier or 1024 limit.');
  const quickdraw=options.quickdraw!==false && !(tier && start>0);
  const role=String(options.role||'general engineering').trim();
  if(!role||role.length>100||/[\\x00-\\x1f]/.test(role))
    throw Error('--role must be 1-100 printable characters.');
  if(!pulls&&!quickdraw)
    throw Error('Select at least one GitHub event: --pulls > 0 and/or Quickdraw.');
  const available=new Map(PRIVATE_AUTOMATABLE.map(x=>[x.id,x]));
  const attempts=[
    ...(pulls?[{badge:'pull-shark',action:'Open and merge '+pulls+' labeled exercise PR(s)',event:'merged-own-pr'}]:[]),
    ...(pulls?[{badge:'yolo',action:'Merge an owned exercise PR without formal review where allowed',event:'unreviewed-merge'}]:[]),
    ...(quickdraw?[{badge:'quickdraw',action:'Open and promptly close a labeled private QA issue',event:'quick-issue-close'}]:[]),
  ].map(x=>({...x,name:available.get(x.badge).name,
    awardStatus:'planned-unverified',ruleConfidence:available.get(x.badge).criteriaConfidence,
    source:available.get(x.badge).sourceUrls[0]}));
  const excluded=ACHIEVEMENT_MATRIX.filter(x=>!x.automatable).map(x=>({
    badge:x.id,name:x.name,category:x.category,reason:x.reason,route:x.route,
  }));
  const doc={
    format:PLAN_FORMAT,catalogVersion:MATRIX_VERSION,repo,private:true,
    pulls,start,quickdraw,role,tier,targetThreshold,
    attempts,excluded,
    note:'Only PR/issue events are attempted in one marked private workspace. GitHub decides if an award/tier is granted. No third-party activity.',
    verification:'Check the authenticated account on GitHub manually; completed API operations are not earned badges.',
    estimatedRequestUpperBound:20+pulls*12,
    nextStart:start+pulls,
    remainingToTier:targetThreshold===null?null:targetThreshold-start-pulls,
  };
  doc.fingerprint=badgeDigest(doc);
  return doc;
}
export function loadBadgePlan(path) {
  if(typeof path!=='string'||!path.trim())throw Error('Supply --review FILE.');
  const stat=statSync(path);
  if(!stat.isFile()||stat.size>maxFile)
    throw Error('Badge review must be a regular JSON file under 64 KiB.');
  let p;
  try{p=JSON.parse(readFileSync(path,'utf8'));}
  catch{throw Error('Invalid badge plan JSON.');}
  if(![PLAN_FORMAT,LEGACY_PLAN_FORMAT].includes(p?.format)||p.private!==true||
    !/^[a-f0-9]{64}$/.test(p.fingerprint||'')||badgeDigest(p)!==p.fingerprint)
    throw Error('Badge plan fingerprint mismatch or unsupported format.');
  const canonical=planBadgeRun({...p,tier:p.format===LEGACY_PLAN_FORMAT?null:p.tier});
  if(p.format===LEGACY_PLAN_FORMAT){
    const previous={...canonical,format:LEGACY_PLAN_FORMAT};
    if(badgeDigest(previous)!==p.fingerprint)
      throw Error('Legacy plan does not match current validated action limits.');
    return {...previous,fingerprint:p.fingerprint};
  }
  if(badgeDigest(canonical)!==p.fingerprint)
    throw Error('Badge plan does not match current verified options or catalog. Re-plan before applying.');
  return canonical;
}
export function writeBadgePlan(options={}) {
  const doc=planBadgeRun(options);
  if(options.output)writeFileSync(options.output,JSON.stringify(doc,null,2)+'\n',
    {flag:options.force?'w':'wx',mode:0o600});
  else process.stdout.write(JSON.stringify(doc,null,2)+'\n');
  return doc;
}
function exerciseText(doc,index) {
  const [title,detail]=DOCS[(index-1)%DOCS.length];
  return '# '+title+'\n\n'+detail+'\n\n'+
    '## Review exercise\n\n'+
    '- Confirm the behavior or design requirement in a real project before implementing it.\n'+
    '- Document one reproducible test or a concrete example.\n'+
    '- Identify limitations and sources a reviewer should inspect.\n\n'+
    'Generated by GH Aura for a private automation sandbox ('+doc.role+
    '). This document is a synthetic exercise, not personally verified work.\n';
}
const sandboxReadme=WORKSPACE_README;
async function applyBadgeRun(doc,opts={}) {
  const token=tokenFor(opts);
  if(!token)throw Error('GH_TOKEN/GITHUB_TOKEN with repository creation and private Contents/Pull requests/Issues permissions is required.');
  if(doc.private!==true||![PLAN_FORMAT,LEGACY_PLAN_FORMAT].includes(doc.format)||
    badgeDigest(doc)!==doc.fingerprint)
    throw Error('Invalid or altered private sandbox plan.');
  if(typeof opts.confirm!=='string'||opts.confirm!==doc.fingerprint||
    !/^[a-f0-9]{64}$/.test(opts.confirm))throw Error('Badge plan confirmation mismatch. Review the plan before applying.');
  const maxCalls=20+doc.pulls*12;
  let requests=0;
  const call=async (path,method='GET',body=undefined)=>{
    if(++requests>maxCalls)throw Error('Badge automation API request budget reached; inspect the repository before retrying.');
    const shared={...opts,publicRead:false,cache:undefined};
    return method==='GET' ? getJSON(path,shared)
      : requestJSON(path,{...shared,method,body});
  };
  const who=await call('/user');
  const owner=validateLogin(who?.login);
  const [givenOwner,name]=doc.repo.split('/');
  if(givenOwner.toLowerCase()!==owner.toLowerCase())
    throw Error('Badge runner only operates on an owned private repository of the authenticated user.');
  const base='/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(name);
  const pause=opts.sleep||((ms)=>new Promise(resolve=>setTimeout(resolve,ms)));
  let repo=await call(base);
  let created=false;
  if(!repo){
    repo=await call('/user/repos','POST',{
      name,private:true,auto_init:true,has_issues:true,
      has_projects:false,has_wiki:false,allow_squash_merge:true,
      description:'Private GH Aura synthetic GitHub workflow exercises (not professional history)',
    });
    created=true;
    await pause(800);
  }
  if(repo?.private!==true||repo?.fork===true||repo?.archived===true||
      repo?.full_name?.toLowerCase()!==doc.repo.toLowerCase()||
      !repo?.default_branch)
    throw Error('Only an active owned, non-fork private repository is supported.');
  const branch=repo.default_branch;
  const readmePath=base+'/contents/README.md?ref='+encodeURIComponent(branch);
  const readme=await call(readmePath);
  if(!readme||readme.type!=='file')throw Error('A private README initialized with the repo is required.');
  if(created){
    if(!/^[a-f0-9]{40}$/i.test(readme.sha||''))throw Error('Unverified initial README revision.');
    await call(base+'/contents/README.md','PUT',{
      message:'docs: identify private GH Aura workflow sandbox',branch,
      content:Buffer.from(sandboxReadme,'utf8').toString('base64'),sha:readme.sha,
    });
    await pause(600);
  }else{
    if(!managedWorkspaceReadme(decodeReadme(readme)))
      throw Error('Existing repo is not a GH Aura-marked private workspace. It will not be changed.');
  }
  const results={repo:'https://github.com/'+doc.repo,
    private:true,status:'operations-completed-awards-unverified',
    workspaceReused:!created,
    requested:{pulls:doc.pulls,quickdraw:doc.quickdraw,start:doc.start},
    mergedPulls:[],skippedAlreadyMerged:[],quickdrawIssue:null,
    requests:0,
    note:'Operations were requested and executed. GitHub alone grants or refuses achievements; private eligibility is not guaranteed.'};
  const eventIndex=String(doc.start+1).padStart(4,'0');
  if(doc.quickdraw){
    const issueMarker='[GH-AURA-QA-'+eventIndex+']';
    // Avoid duplicating a closed "quickdraw" exercise on review replay.
    const oldIssues=await call(base+'/issues?state=all&per_page=100');
    const exists=Array.isArray(oldIssues)&&oldIssues.some(x=>
      x.title?.includes(issueMarker)&&!x.pull_request);
    if(!exists){
      const issue=await call(base+'/issues','POST',{
        title:issueMarker+' Validate private sandbox setup',
        body:'QA exercise: verify that this repo is private, owned by the requester, and contains the sandbox marker before closing. This is generated test activity, not a production defect.',
      });
      if(!Number.isInteger(issue?.number))throw Error('Issue creation result uncertain. Inspect the sandbox before retrying.');
      await call(base+'/issues/'+issue.number,'PATCH',{state:'closed',state_reason:'completed'});
      results.quickdrawIssue=issue.html_url||null;
    }
  }
  for(let i=0;i<doc.pulls;i++){
    const index=doc.start+i+1;
    const id=String(index).padStart(4,'0');
    const filepath='docs/gh-aura/exercise-'+id+'.md';
    const encoded=filepath.split('/').map(encodeURIComponent).join('/');
    // The default branch document is the idempotent proof of a completed merge.
    const committed=await call(base+'/contents/'+encoded+'?ref='+encodeURIComponent(branch));
    if(committed){results.skippedAlreadyMerged.push(index);continue;}
    const head='gh-aura/badge-'+id;
    const prior=await call(base+'/git/ref/heads/'+head);
    if(prior)throw Error('Review branch '+head+' already exists without a merged document. Inspect GitHub; no overwrite.');
    const baseRef=await call(base+'/git/ref/heads/'+branch.split('/').map(encodeURIComponent).join('/'));
    if(!/^[a-f0-9]{40}$/i.test(baseRef?.object?.sha||''))
      throw Error('Could not verify latest default branch revision.');
    await call(base+'/git/refs','POST',{ref:'refs/heads/'+head,sha:baseRef.object.sha});
    await pause(700);
    await call(base+'/contents/'+encoded,'PUT',{
      message:'docs(sandbox): add generated exercise '+id,
      branch:head,content:Buffer.from(exerciseText(doc,index)).toString('base64'),
    });
    await pause(700);
    const pr=await call(base+'/pulls','POST',{
      title:'docs(sandbox): generated engineering exercise '+id,
      head,base:branch,
      body:'User-requested private sandbox exercise generated by GH Aura. It is not evidence of independently authored professional work. GitHub achievement awards are not guaranteed.',
    });
    if(!Number.isInteger(pr?.number)||!pr?.html_url)
      throw Error('PR creation outcome unknown; inspect GitHub before retrying.');
    await pause(700);
    const merge=await call(base+'/pulls/'+pr.number+'/merge','PUT',{
      merge_method:'squash',
      commit_title:'docs(sandbox): complete generated exercise '+id,
    });
    if(merge?.merged!==true)throw Error('GitHub did not confirm the merge. Inspect PR '+pr.number+'.');
    results.mergedPulls.push({number:pr.number,url:pr.html_url});
    await pause(500);
  }
  results.requests=requests;
  results.verify='https://github.com/'+owner+'?tab=achievements';
  return results;
}
export async function runBadgeAutomation(command,opts={}) {
  if(command==='plan')return writeBadgePlan({...opts,quickdraw:!opts['no-quickdraw']});
  if(command!=='apply')throw Error('Use badge-run plan or badge-run apply.');
  const plan=loadBadgePlan(opts.review);
  const result=await applyBadgeRun(plan,{confirm:opts.confirm});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result;
}
export { applyBadgeRun };

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
    catalogVersion:doc.catalogVersion,attempts:doc.attempts,excluded:doc.excluded,
    note:doc.note,verification:doc.verification,
    estimatedRequestUpperBound:doc.estimatedRequestUpperBound,
    nextStart:doc.nextStart,remainingToTier:doc.remainingToTier};
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
  const start=int(options.start??0,'--start',0,MAX_EXERCISE_INDEX-1);
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
    // GitHub's issues endpoint also returns PRs; scan bounded pages until the
    // exact unique marker is seen or exhaustion is proven. Never assume a
    // single first page proves absence on a long-lived workspace.
    let exists=false,exhausted=false;
    for(let page=1;page<=12;page++){
      const suffix=page===1?'':'&page='+page;
      const listed=await call(base+'/issues?state=all&per_page=100'+suffix);
      if(!Array.isArray(listed))
        throw Error('Cannot verify existing QA issues. No new issue created.');
      if(listed.some(x=>x.title?.includes(issueMarker)&&!x.pull_request)){
        exists=true;break;
      }
      if(listed.length<100){exhausted=true;break;}
    }
    if(!exists&&!exhausted)
      throw Error('QA issue history exceeds the bounded scan. Inspect GitHub before retrying.');
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
/**
 * Read-only, bounded verification of operations in the same marked workspace.
 * PR/issue observations are never interpreted as a GitHub-awarded achievement.
 */
export async function inspectBadgeWorkspace(opts={}) {
  const repo=validRepo(workspaceRepo(opts.repo));
  const token=tokenFor(opts);
  if(!token)throw Error('A GH_TOKEN/GITHUB_TOKEN with read permission to the private workspace is required.');
  const auth={...opts,publicRead:false,cache:undefined};
  const who=await getJSON('/user',auth);
  const owner=validateLogin(who?.login);
  const [givenOwner,name]=repo.split('/');
  if(givenOwner.toLowerCase()!==owner.toLowerCase())
    throw Error('Read-only badge status supports only the authenticated user\'s owned workspace.');
  const base='/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(name);
  const repository=await getJSON(base,auth);
  if(repository?.private!==true||repository?.archived===true||repository?.fork===true||
    repository?.full_name?.toLowerCase()!==repo.toLowerCase()||
    typeof repository?.default_branch!=='string')
    throw Error('Workspace is missing, non-private, archived, forked or not owned.');
  const branch=repository.default_branch;
  const readme=await getJSON(base+'/contents/README.md?ref='+encodeURIComponent(branch),auth);
  if(!readme||!managedWorkspaceReadme(decodeReadme(readme)))
    throw Error('Workspace marker missing; no unrelated repository may be inspected.');
  let calls=3;
  const merged=[],issues=[];
  let pullsComplete=false,issuesComplete=false;
  for(let page=1;page<=12;page++){
    const batch=await getJSON(base+'/pulls?state=closed&per_page=100&page='+page,auth);
    calls++;
    if(!Array.isArray(batch))throw Error('Cannot verify private pull requests.');
    for(const pr of batch){
      if(pr.merged_at&&pr.user?.login?.toLowerCase()===owner.toLowerCase()&&
        /^gh-aura\/badge-\d{4}$/.test(pr.head?.ref||'')&&pr.base?.ref===branch){
        merged.push({number:pr.number,url:pr.html_url,mergedAt:pr.merged_at,
          index:Number(pr.head.ref.slice('gh-aura/badge-'.length))});
      }
    }
    if(batch.length<100){pullsComplete=true;break;}
  }
  for(let page=1;page<=12;page++){
    const batch=await getJSON(base+'/issues?state=all&per_page=100&page='+page,auth);
    calls++;
    if(!Array.isArray(batch))throw Error('Cannot verify private QA issues.');
    for(const issue of batch){
      if(!issue.pull_request&&issue.state==='closed'&&
        issue.user?.login?.toLowerCase()===owner.toLowerCase()&&
        /^\[GH-AURA-QA-\d{4}\]/.test(issue.title||'')){
        issues.push({number:issue.number,url:issue.html_url,
          createdAt:issue.created_at,closedAt:issue.closed_at});
      }
    }
    if(batch.length<100){issuesComplete=true;break;}
  }
  const thresholds=PULL_SHARK_TIERS;
  const observedTierCandidate=pullsComplete
    ?Object.entries(thresholds).filter(([,n])=>merged.length>=n).at(-1)?.[0]||null
    :null;
  return {
    repository:'https://github.com/'+repo,private:true,readOnly:true,
    defaultBranch:branch,
    status:'observed-workspace-events-awards-unverified',
    observed:{
      mergedOwnedExercisePullRequests:merged.length,
      closedOwnedExerciseIssues:issues.length,
      pullsComplete,issuesComplete,
      pullSharkLocalTierCandidate:observedTierCandidate,
      caveat:'Counts are only observed events in this private workspace, not total qualifying account events or awarded badges.',
    },
    events:{mergedPullRequests:merged,closedQAIssues:issues},
    requests:calls,
    verify:'https://github.com/'+owner+'?tab=achievements',
    note:'Check GitHub profile achievements manually after processing. No official award-grant API is used.',
  };
}

/**
 * Determine the next PR exercise index from *verified merged events* and the
 * repository's complete tree. This is a conservative workspace-local index,
 * NOT a count of achievements or an account-wide Pull Shark threshold.
 * Holes, unexplained generated files and partial observations fail closed.
 */
export function nextBadgePlanFromWorkspace(status,tree,options={}) {
  if(status?.status!=='observed-workspace-events-awards-unverified'||
     status?.observed?.pullsComplete!==true||
     status?.observed?.issuesComplete!==true)
    throw Error('Cannot plan next batch: workspace event history is incomplete.');
  if(tree?.truncated!==false||!Array.isArray(tree.tree))
    throw Error('Cannot plan next batch: workspace tree inspection is incomplete.');
  if(!options.tier||!Object.hasOwn(PULL_SHARK_TIERS,options.tier))
    throw Error('badges auto next requires --tier base, bronze, silver or gold.');
  const repo=validRepo(workspaceRepo(options.repo));
  if(status.repository!=='https://github.com/'+repo)
    throw Error('Workspace status and selected repository do not match.');
  const docs=new Set(tree.tree.map(x=>x?.path).filter(x=>typeof x==='string'));
  const merged=status.events?.mergedPullRequests;
  if(!Array.isArray(merged))
    throw Error('Cannot plan next batch without observed merged PR records.');
  const seen=new Set();
  const asPath=n=>'docs/gh-aura/exercise-'+String(n).padStart(4,'0')+'.md';
  for(const pr of merged) {
    const n=pr?.index;
    if(!Number.isInteger(n)||n<1||n>MAX_EXERCISE_INDEX||seen.has(n))
      throw Error('Invalid or duplicate GH Aura exercise PR index; inspect GitHub before proceeding.');
    if(!docs.has(asPath(n)))
      throw Error('Merged exercise PR lacks its default-branch document; inspect GitHub before proceeding.');
    seen.add(n);
  }
  for(const path of docs) {
    const match=/^docs\\/gh-aura\\/exercise-(\\d{4})\\.md$/.exec(path);
    if(match && !seen.has(Number(match[1])))
      throw Error('Unverified exercise file in workspace; inspect GitHub before proceeding.');
  }
  let start=0;
  while(seen.has(start+1))start++;
  if(seen.size!==start)
    throw Error('Gaps in merged PR sequence; resolve the partial history before planning another batch.');
  const target=PULL_SHARK_TIERS[options.tier];
  if(start>=target)
    return {status:'target-reached-in-workspace-events-award-unverified',
      repository:status.repository,tier:options.tier,observedMergedExercises:start,
      note:'The workspace reached this reported event threshold; GitHub alone determines earned achievements and tiers.',
      verify:status.verify};
  return planBadgeRun({
    repo,tier:options.tier,start,
    ...(options.pulls===undefined?{}:{pulls:options.pulls}),
    ...(options.role===undefined?{}:{role:options.role}),
    quickdraw:!options['no-quickdraw'],
  });
}

/** Read only: never creates repositories, issues, branches or PRs. */
export async function planNextBadgeRun(opts={}) {
  const repo=validRepo(workspaceRepo(opts.repo));
  const report=await inspectBadgeWorkspace({...opts,repo});
  const path='/repos/'+repo.split('/').map(encodeURIComponent).join('/')+
    '/git/trees/'+encodeURIComponent(report.defaultBranch)+'?recursive=1';
  const tree=await getJSON(path,{...opts,publicRead:false,cache:undefined,allowMissing:false});
  const doc=nextBadgePlanFromWorkspace(report,tree,{...opts,repo});
  if(doc.format===PLAN_FORMAT) {
    // Detect interrupted/in-progress exercise branches before writing a local plan.
    for(let n=doc.start+1;n<=doc.start+doc.pulls;n++) {
      const head='gh-aura/badge-'+String(n).padStart(4,'0');
      const branchRef=await getJSON('/repos/'+repo.split('/').map(encodeURIComponent).join('/')+
        '/git/ref/heads/'+head,{...opts,publicRead:false,cache:undefined});
      if(branchRef)
        throw Error('Review branch '+head+' exists without a confirmed merged exercise. Inspect GitHub before another plan.');
    }
    if(opts.output)writeFileSync(opts.output,JSON.stringify(doc,null,2)+'\\n',
      {flag:opts.force?'w':'wx',mode:0o600});
  }
  process.stdout.write(JSON.stringify(doc,null,2)+'\\n');
  return doc;
}

export async function runBadgeAutomation(command,opts={}) {
  if(command==='plan')return writeBadgePlan({...opts,quickdraw:!opts['no-quickdraw']});
  if(command==='status'){
    const observed=await inspectBadgeWorkspace(opts);
    process.stdout.write(JSON.stringify(observed,null,2)+'\n');
    return observed;
  }
  if(command==='next')return planNextBadgeRun(opts);
  if(command!=='apply')throw Error('Use badges auto plan, next, apply or status.');
  const plan=loadBadgePlan(opts.review);
  const result=await applyBadgeRun(plan,{confirm:opts.confirm});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result;
}
export { applyBadgeRun };

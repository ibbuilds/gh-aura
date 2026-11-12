import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planBadgeRun, badgeDigest, loadBadgePlan, applyBadgeRun,
  inspectBadgeWorkspace, planNextBadgeRun, nextBadgePlanFromWorkspace } from '../src/badge-run.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

const repo='example/aura-achievements';
const plan=(opts={})=>planBadgeRun({repo,quickdraw:true,role:'backend',...opts});
const response=(data,status=200)=>Response.json(data,{status});
function mockAPI(options={}) {
  const requests=[],privateRepo=options.privateRepo!==false;
  let created=false,prs=0,issue=0;
  const base='/repos/'+repo;
  const fetch=async (url,params={})=>{
    const path=url.replace('https://api.github.com','');
    const method=params.method||'GET';
    const body=params.body?JSON.parse(params.body):null;
    requests.push({path,method,body});
    if(path==='/user')return response({login:'example'});
    if(path===base && method==='GET') {
      if(!options.existing)return response({},404);
      return response({full_name:repo,private:privateRepo,default_branch:'main',
        archived:false,fork:false,has_issues:true});
    }
    if(path==='/user/repos' && method==='POST'){
      created=true;
      assert.equal(body.private,true);
      return response({full_name:repo,private:true,default_branch:'main',archived:false,fork:false},201);
    }
    if(path===base+'/contents/README.md?ref=main'){
      const text=options.existing ? options.existingMarker===false?'# Regular private repo':
        options.existingMarker==='shared'?'# Private GH Aura\nGH-AURA-PRIVATE-WORKSPACE-V1':
        '# Private GH Aura\nGH-AURA-PRIVATE-BADGE-SANDBOX-V1' : '# Initial project\n';
      return response({type:'file',path:'README.md',sha:'a'.repeat(40),
        encoding:'base64',size:Buffer.byteLength(text),content:Buffer.from(text).toString('base64')});
    }
    if(path===base+'/contents/README.md' && method==='PUT'){
      assert.equal(body.branch,'main');
      assert.equal(body.sha,'a'.repeat(40));
      assert.match(Buffer.from(body.content,'base64').toString('utf8'),/GH-AURA-PRIVATE-BADGE-SANDBOX-V1/);
      return response({commit:{sha:'b'.repeat(40)}});
    }
    if(options.issueOnSecondPage&&path===base+'/issues?state=all&per_page=100')
      return response(Array.from({length:100},(_,i)=>({number:i+1,
        title:'Other activity '+i,pull_request:{}})));
    if(options.issueOnSecondPage&&path===base+'/issues?state=all&per_page=100&page=2')
      return response([{title:'[GH-AURA-QA-0001] Validate private sandbox setup',
        state:'closed',number:1001}]);
    if(options.issueHistoryTooLarge&&path.startsWith(base+'/issues?state=all&per_page=100'))
      return response(Array.from({length:100},(_,i)=>({number:i+1,title:'Other activity '+i})));
    if(path===base+'/issues?state=all&per_page=100')return response(
      options.alreadyDone?[{title:'[GH-AURA-QA-0001] Validate private sandbox setup',
        state:'closed'}]:[]);
    if(options.statusMixed&&path===base+'/pulls/1'&&method==='GET')
      return response({number:1,merged_at:'2026-11-12T01:00:00Z',
        user:{login:'example'},merged_by:{login:options.otherMerger?'another':'example'},
        base:{ref:'main'}});
    if(path.startsWith(base+'/pulls/')&&path.endsWith('/reviews?per_page=100')&&method==='GET')
      return response(options.submittedReview||options.statusReviewed?[{state:'APPROVED'}]:[]);
    if(path===base+'/pulls?state=closed&per_page=100&page=1')return response(
      options.statusMixed?[
        {number:1,merged_at:'2026-11-12T01:00:00Z',html_url:'https://github.com/'+repo+'/pull/1',
         head:{ref:'gh-aura/badge-0001'},base:{ref:'main'},user:{login:'example'}},
        {number:2,merged_at:null,head:{ref:'gh-aura/badge-0002'},base:{ref:'main'},user:{login:'example'}},
        {number:3,merged_at:'2026-11-12T01:00:00Z',head:{ref:'other'},base:{ref:'main'},user:{login:'example'}}
      ]:[]);
    if(path===base+'/issues?state=all&per_page=100&page=1')return response(
      options.statusMixed?[{number:11,title:'[GH-AURA-QA-0001] Example',
        created_at:'2026-11-12T01:00:00Z',
        closed_at:options.slowQuickdraw?'2026-11-12T01:08:00Z':'2026-11-12T01:00:08Z',
        state:'closed',html_url:'https://github.com/'+repo+'/issues/11',
        user:{login:'example'}}]:[]);
    if(path===base+'/issues' && method==='POST'){
      issue++;return response({number:issue,created_at:'2026-11-12T01:00:00Z',
        html_url:'https://github.com/'+repo+'/issues/'+issue},201);
    }
    if(path===base+'/issues/'+issue && method==='PATCH'){
      assert.equal(body.state,'closed');return response({number:issue,state:'closed',
        closed_at:options.patchSlowClose?'2026-11-12T01:08:00Z':'2026-11-12T01:00:05Z'});
    }
    if(path.startsWith(base+'/contents/docs/gh-aura/exercise-')&&method==='GET') {
      return options.alreadyDone?response({sha:'c'.repeat(40),type:'file'}):response({},404);
    }
    if(path.startsWith(base+'/git/ref/heads/gh-aura/badge-')&&method==='GET'){
      if(options.pendingBranch&&path.endsWith('/'+options.pendingBranch))
        return response({object:{sha:'a'.repeat(40)}});
      return response({},404);
    }
    if(path===base+'/git/trees/main?recursive=1'&&method==='GET')
      return response(options.tree??{
        truncated:false,tree:[{path:'README.md'},{path:'docs/gh-aura/exercise-0001.md'}]
      });
    if(path===base+'/git/ref/heads/main'&&method==='GET')
      return response({object:{sha:'a'.repeat(40)}});
    if(path===base+'/git/refs'&&method==='POST'){
      assert.ok(body.ref.startsWith('refs/heads/gh-aura/badge-'));
      return response({ref:body.ref},201);
    }
    if(path.startsWith(base+'/contents/docs/gh-aura/exercise-')&&method==='PUT'){
      assert.equal(body.branch.startsWith('gh-aura/badge-'),true);
      assert.match(Buffer.from(body.content,'base64').toString(),/synthetic exercise/i);
      return response({commit:{sha:'b'.repeat(40)}});
    }
    if(path===base+'/pulls'&&method==='POST'){
      prs++;return response({number:prs,html_url:'https://github.com/'+repo+'/pull/'+prs,
        head:{sha:options.wrongHead?'e'.repeat(40):'b'.repeat(40)}},201);
    }
    if(path===base+'/pulls/'+prs+'/merge'&&method==='PUT'){
      assert.equal(body.merge_method,'squash');
      assert.equal(body.sha,'b'.repeat(40),'merge must bind exact generated PR head SHA');
      return response({merged:true,sha:'d'.repeat(40)});
    }
    throw Error('Unexpected GitHub API: '+method+' '+path);
  };
  return {fetch,requests,get created(){return created;}};
}
test('badge plan separates account-owned paths from external achievement requirements',()=>{
  const p=plan();
  assert.equal(p.private,true);
  assert.equal(p.pulls,2);
  assert.equal(p.quickdraw,true);
  assert.deepEqual(p.attempts.map(x=>x.badge),['pull-shark','yolo','quickdraw']);
  assert.ok(p.excluded.some(x=>x.badge==='galaxy-brain'));
  assert.ok(p.excluded.some(x=>x.badge==='pair-extraordinaire'));
  assert.equal(badgeDigest(p),p.fingerprint);
  assert.equal(plan({pulls:0,quickdraw:true}).attempts.length,1);
  assert.throws(()=>plan({pulls:0,quickdraw:false}),/at least one/);
  assert.throws(()=>plan({pulls:17}),/pulls/);
});
test('review fingerprint binds repo, task count, starting index and mode',()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-badges-plan-'));
  try{
    const file=join(folder,'review.json'),p=plan();
    writeFileSync(file,JSON.stringify(p,null,2));
    assert.equal(loadBadgePlan(file).fingerprint,p.fingerprint);
    p.pulls=16;
    writeFileSync(file,JSON.stringify(p,null,2));
    assert.throws(()=>loadBadgePlan(file),/fingerprint/);
  }finally{rmSync(folder,{recursive:true,force:true});}
});
test('private automation creates one sandbox repo, closes one issue and merges 2 PRs',async()=>{
  const api=mockAPI();
  const p=plan();
  let result;
  try { result=await applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}}); }
  catch(error) { throw Error(error.message+'; sequence='+api.requests.map(x=>x.method+' '+x.path).join(' | ')); }
  assert.equal(api.created,true);
  assert.equal(result.private,true);
  assert.equal(result.mergedPulls.length,2);
  assert.equal(result.skippedAlreadyMerged.length,0);
  assert.match(result.quickdrawIssue,/\/issues\/1$/);
  assert.equal(result.quickdrawTimingCandidate,true);
  assert.ok(result.yoloReviewFreeCandidate);
  assert.equal(result.contentWrites,2+2*4+2);
  assert.ok(result.pacing.minimumWriteGapMs>=1000);
  assert.ok(result.mergedPulls.every(pr=>pr.exactHeadVerified&&pr.reviewedSubmissions===0));
  assert.equal(result.pacing.minimumWriteGapMs,1000);
  assert.ok(result.pacing.locallyReservedHourlyWrites<=500);
  const baseReads=api.requests.filter(x=>x.path===('/repos/'+repo+'/git/ref/heads/main')&&x.method==='GET');
  assert.equal(baseReads.length,1,'second PR reuses the confirmed first merge SHA');
  const branchCreations=api.requests.filter(x=>x.path===('/repos/'+repo+'/git/refs')&&x.method==='POST');
  assert.equal(branchCreations.length,2);
  assert.equal(branchCreations[1].body.sha,'d'.repeat(40),'new branch starts from last confirmed squash merge');
  assert.match(result.note,/GitHub alone/);
  const writes=api.requests.filter(x=>x.method!=='GET');
  assert.equal(writes.filter(x=>x.path.endsWith('/pulls')&&x.method==='POST').length,2);
  assert.equal(writes.filter(x=>x.path.endsWith('/merge')).length,2);
  assert.equal(writes.filter(x=>x.path.endsWith('/issues')&&x.method==='POST').length,1);
  assert.ok(api.requests.every(x=>x.path.startsWith('/repos/'+repo)||x.path==='/user'||x.path==='/user/repos'));
  assert.ok(!JSON.stringify(result).includes('test-only'));
});
test('rerunning the same private sandbox plan is idempotent when tasks already merged',async()=>{
  const api=mockAPI({existing:true,alreadyDone:true});
  const p=plan();
  const result=await applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}});
  assert.deepEqual(result.skippedAlreadyMerged,[1,2]);
  assert.equal(result.mergedPulls.length,0);
  assert.equal(result.quickdrawIssue,null);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
});
test('public and unmarked existing repositories are rejected before any write',async()=>{
  const p=plan();
  for(const opts of [{existing:true,privateRepo:false},{existing:true,existingMarker:false}]) {
    const api=mockAPI(opts);
    await assert.rejects(applyBadgeRun(p,{confirm:p.fingerprint,token:'test-only',
      fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}}),/Only an active|not a GH Aura-marked/);
    assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  }
});
test('confirmation mismatch, owner mismatch and no token stop before any mutation',async()=>{
  const p=plan();
  let calls=0;
  await assert.rejects(applyBadgeRun(p,{confirm:'0'.repeat(64),token:'test-only',
    fetch:async()=>{calls++;throw Error('unexpected');}}),/confirmation mismatch/);
  assert.equal(calls,0);
  await assert.rejects(applyBadgeRun(p,{confirm:p.fingerprint,token:''}),/GH_TOKEN/);
  const another=plan({repo:'another/aura-achievements'});
  const api=mockAPI();
  await assert.rejects(applyBadgeRun(another,{confirm:another.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{}}),/owned private repository/);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
});
test('CLI plan/apply are separate with required explicit review',()=>{
  validateOptions('badge-run',parseArgs(['plan','--repo',repo,'--pulls','2','--output','p.json']));
  validateOptions('badge-run',parseArgs(['apply','--review','p.json','--confirm','f'.repeat(64)]));
  assert.throws(()=>validateOptions('badge-run',parseArgs(['apply','--review','p.json'])),/confirm/);
  assert.throws(()=>validateOptions('badge-run',parseArgs(['plan','--repo',repo,'--pulls','999'])),/pulls/);
  assert.throws(()=>validateOptions('badge-run',parseArgs(['apply','--review','p.json','--confirm','f'.repeat(64),'--repo',repo])),/confirm/);
});

test('badge runner reuses a private workspace created by activity without creating a new repository',async()=>{
  const api=mockAPI({existing:true,existingMarker:'shared'});
  const p=plan({pulls:1,quickdraw:false});
  const result=await applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}});
  assert.equal(api.created,false);
  assert.equal(result.workspaceReused,true);
  assert.equal(result.mergedPulls.length,1);
  assert.equal(api.requests.some(x=>x.path==='/user/repos'),false);
});

test('tier planning is bounded and does not imply a GitHub-awarded tier',()=>{
  const base=plan({tier:'base'});
  assert.equal(base.format,'gh-aura-private-badges-v2');
  assert.equal(base.pulls,2);
  assert.equal(base.targetThreshold,2);
  const bronze=plan({tier:'bronze'});
  assert.equal(bronze.pulls,16);
  assert.equal(bronze.nextStart,16);
  assert.equal(bronze.remainingToTier,0);
  const silver=plan({tier:'silver',start:16});
  assert.equal(silver.pulls,16);
  assert.equal(silver.quickdraw,false);
  assert.equal(silver.remainingToTier,96);
  assert.equal(silver.excluded.length,16);
  assert.deepEqual(silver.attempts.map(a=>a.badge),['pull-shark','yolo']);
  const gold=plan({tier:'gold',start:1008});
  assert.equal(gold.pulls,16);
  assert.equal(gold.remainingToTier,0);
  assert.throws(()=>plan({tier:'silver',start:128}),/tier threshold/);
  assert.throws(()=>plan({tier:'gold',start:1020,pulls:16}),/exceed/);
  assert.throws(()=>plan({tier:'unobtainium'}),/--tier/);
  assert.throws(()=>plan({start:1024,pulls:0,quickdraw:true}),/--start/);
});

test('v2 plan binds descriptions and excluded list, and safe legacy plans still load',()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-matrix-plan-'));
  try{
    const file=join(folder,'plan.json'),p=plan();
    writeFileSync(file,JSON.stringify(p));
    assert.equal(loadBadgePlan(file).format,'gh-aura-private-badges-v2');
    p.excluded[0].reason='tampered display';
    writeFileSync(file,JSON.stringify(p));
    assert.throws(()=>loadBadgePlan(file),/fingerprint/);
    const legacy={format:'gh-aura-private-badges-v1',repo,
      private:true,pulls:2,start:0,quickdraw:true,role:'backend'};
    legacy.fingerprint=badgeDigest(legacy);
    writeFileSync(file,JSON.stringify(legacy));
    const approved=loadBadgePlan(file);
    assert.equal(approved.format,'gh-aura-private-badges-v1');
    assert.deepEqual(approved.attempts.map(item=>item.badge),
      ['pull-shark','yolo','quickdraw']);
  }finally{rmSync(folder,{recursive:true,force:true});}
});

test('status reads only GH Aura-owned private workspace and distinguishes events from awards',async()=>{
  const api=mockAPI({existing:true,statusMixed:true,existingMarker:'shared'});
  const status=await inspectBadgeWorkspace({repo,token:'test-only',fetch:api.fetch,reserveWrite:()=>{}});
  assert.equal(status.private,true);
  assert.equal(status.readOnly,true);
  assert.equal(status.status,'observed-workspace-events-awards-unverified');
  assert.equal(status.observed.mergedOwnedExercisePullRequests,1);
  assert.equal(status.observed.closedOwnedExerciseIssues,1);
  assert.equal(status.observed.quickdrawTimingCandidates,1);
  assert.equal(status.observed.yoloSelfMergeNoReviewCandidate,1);
  assert.equal(status.observed.yoloInspectedMergedPRs,1);
  assert.equal(status.observed.yoloEvidenceComplete,true);
  assert.equal(status.events.yoloReviewEvidence[0].reviewCount,0);
  assert.equal(status.observed.pullSharkLocalTierCandidate,null);
  assert.ok(status.verify.includes('?tab=achievements'));
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  const bad=mockAPI({existing:true,existingMarker:false});
  await assert.rejects(inspectBadgeWorkspace({repo,token:'test-only',fetch:bad.fetch,reserveWrite:()=>{}}),
    /marker missing/);
  assert.equal(bad.requests.filter(x=>x.method!=='GET').length,0);
});

test('Quickdraw replay checks beyond first 100 issue/PR records before writing',async()=>{
  const api=mockAPI({existing:true,existingMarker:'shared',issueOnSecondPage:true});
  const p=plan({pulls:0,quickdraw:true});
  const result=await applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}});
  assert.equal(result.quickdrawIssue,null);
  assert.equal(result.mergedPulls.length,0);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  assert.ok(api.requests.some(x=>x.path.endsWith('per_page=100&page=2')));
});
test('Quickdraw refuses unknown full issue history rather than duplicating action',async()=>{
  const api=mockAPI({existing:true,existingMarker:'shared',issueHistoryTooLarge:true});
  const p=plan({pulls:0,quickdraw:true});
  await assert.rejects(applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}}),/history exceeds/);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  assert.ok(api.requests.some(x=>x.path.endsWith('per_page=100&page=12')));
});

test('next plans only uncompleted private-workspace tier exercises without a GitHub write',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-next-batch-'));
  try{
    const file=join(folder,'next.json');
    const api=mockAPI({existing:true,existingMarker:'shared',statusMixed:true});
    const planned=await planNextBadgeRun({repo,tier:'bronze',output:file,
      token:'test-only',fetch:api.fetch,reserveWrite:()=>{}});
    assert.equal(planned.format,'gh-aura-private-badges-v2');
    assert.equal(planned.tier,'bronze');
    assert.equal(planned.start,1);
    assert.equal(planned.pulls,15);
    assert.equal(planned.quickdraw,false);
    assert.equal(planned.nextStart,16);
    assert.equal(loadBadgePlan(file).fingerprint,planned.fingerprint);
    assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
    assert.ok(api.requests.every(x=>
      x.path==='/user'||x.path.startsWith('/repos/'+repo)));
    assert.equal(api.created,false);
  }finally{rmSync(folder,{recursive:true,force:true});}
});

test('next refuses interrupted exercise branches before writing an approval file',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-next-interrupted-'));
  try{
    const file=join(folder,'unwritten.json');
    const api=mockAPI({existing:true,existingMarker:'shared',statusMixed:true,
      pendingBranch:'gh-aura/badge-0002'});
    await assert.rejects(planNextBadgeRun({repo,tier:'bronze',output:file,
      token:'test-only',fetch:api.fetch,reserveWrite:()=>{}}),/Review branch/);
    assert.equal(existsSync(file),false);
    assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  }finally{rmSync(folder,{recursive:true,force:true});}
});

test('next fails closed for unmarked or public workspaces without creating a repo',async()=>{
  for(const options of [
    {existing:true,existingMarker:false},
    {existing:true,privateRepo:false},
  ]) {
    const api=mockAPI(options);
    await assert.rejects(planNextBadgeRun({repo,tier:'bronze',
      token:'test-only',fetch:api.fetch,reserveWrite:()=>{}}),/marker missing|non-private/);
    assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
    assert.equal(api.created,false);
  }
});

test('next refuses incomplete, conflicting and gapped workspace evidence',()=>{
  const result={
    status:'observed-workspace-events-awards-unverified',
    repository:'https://github.com/'+repo,
    verify:'https://github.com/example?tab=achievements',
    observed:{pullsComplete:true,issuesComplete:true},
    events:{mergedPullRequests:[{index:1}]},
  };
  const tree={truncated:false,tree:[
    {path:'README.md'}, {path:'docs/gh-aura/exercise-0001.md'},
  ]};
  const args={repo,tier:'bronze'};
  assert.equal(nextBadgePlanFromWorkspace(result,tree,args).start,1);
  const reached={...result,events:{mergedPullRequests:[{index:1},{index:2}]}};
  const withTwo={truncated:false,tree:[
    ...tree.tree,{path:'docs/gh-aura/exercise-0002.md'}]};
  const noMore=nextBadgePlanFromWorkspace(reached,withTwo,{repo,tier:'base'});
  assert.equal(noMore.status,'target-reached-in-workspace-events-award-unverified');
  assert.equal(noMore.observedMergedExercises,2);
  assert.throws(()=>nextBadgePlanFromWorkspace(
    {...result,observed:{...result.observed,pullsComplete:false}},tree,args),
    /incomplete/);
  assert.throws(()=>nextBadgePlanFromWorkspace(result,{...tree,truncated:true},args),
    /tree inspection/);
  assert.throws(()=>nextBadgePlanFromWorkspace(result,{...tree,tree:[]},args),
    /lacks its default-branch document/);
  assert.throws(()=>nextBadgePlanFromWorkspace(result,
    {...tree,tree:[...tree.tree,{path:'docs/gh-aura/exercise-0002.md'}]},args),
    /Unverified exercise file/);
  assert.throws(()=>nextBadgePlanFromWorkspace(
    {...result,events:{mergedPullRequests:[{index:1},{index:1}]}},tree,args),
    /duplicate/);
  assert.throws(()=>nextBadgePlanFromWorkspace(
    {...result,events:{mergedPullRequests:[{index:2}]}},withTwo,args),
    /Unverified exercise file|Gaps/);
});

test('status does not mistake a slow QA issue closure for Quickdraw eligibility',async()=>{
  const api=mockAPI({existing:true,existingMarker:'shared',statusMixed:true,
    slowQuickdraw:true});
  const report=await inspectBadgeWorkspace({repo,token:'test-only',fetch:api.fetch,reserveWrite:()=>{}});
  assert.equal(report.observed.closedOwnedExerciseIssues,1);
  assert.equal(report.observed.quickdrawTimingCandidates,0);
  assert.equal(report.events.closedQAIssues[0].elapsedSeconds,480);
  assert.equal(report.events.closedQAIssues[0].quickdrawTimingCandidate,false);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
});

test('incorrect PR head SHA and submitted reviews abort before any merge',async()=>{
  for(const opt of [{wrongHead:true},{submittedReview:true}]){
    const api=mockAPI({existing:true,existingMarker:'shared',...opt});
    const p=plan({pulls:1,quickdraw:false});
    await assert.rejects(applyBadgeRun(p,{
      confirm:p.fingerprint,token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}
    }),/PR head differs|submitted or uninspectable reviews/);
    assert.equal(api.requests.filter(x=>x.method==='PUT'&&x.path.endsWith('/merge')).length,0);
  }
});

test('runner reports a late Quickdraw close as non-qualifying timing evidence',async()=>{
  const api=mockAPI({existing:true,existingMarker:'shared',patchSlowClose:true});
  const p=plan({pulls:0,quickdraw:true});
  const result=await applyBadgeRun(p,{
    confirm:p.fingerprint,token:'test-only',fetch:api.fetch,reserveWrite:()=>{},sleep:async()=>{}
  });
  assert.equal(result.quickdrawTimingCandidate,false);
  assert.ok(result.quickdrawIssue);
  assert.equal(result.mergedPulls.length,0);
});

test('maximum-level goal advances through base, bronze, silver and gold stage boundaries',()=>{
  const make=(n)=>{
    const events=Array.from({length:n},(_,i)=>({index:i+1}));
    const tree={truncated:false,tree:[
      {path:'README.md'},...events.map(x=>({
        path:'docs/gh-aura/exercise-'+String(x.index).padStart(4,'0')+'.md'
      }))
    ]};
    const report={status:'observed-workspace-events-awards-unverified',
      repository:'https://github.com/'+repo,
      observed:{pullsComplete:true,issuesComplete:true},
      events:{mergedPullRequests:events},
      verify:'https://github.com/example?tab=achievements'};
    return {tree,report};
  };
  const expected=[
    [0,'base',2,2],[1,'base',1,2],[2,'bronze',14,16],
    [16,'silver',16,32],[127,'silver',1,128],
    [128,'gold',16,144],[1008,'gold',16,1024],
  ];
  for(const [n,tier,pulls,nextStart] of expected){
    const {tree,report}=make(n);
    const plan=nextBadgePlanFromWorkspace(report,tree,{repo,goal:'max'});
    assert.equal(plan.tier,tier,'stage for '+n);
    assert.equal(plan.pulls,pulls,'pulls for '+n);
    assert.equal(plan.nextStart,nextStart,'next index for '+n);
    assert.equal(badgeDigest(plan),plan.fingerprint);
  }
  const {tree,report}=make(1024);
  const complete=nextBadgePlanFromWorkspace(report,tree,{repo,goal:'max'});
  assert.equal(complete.status,'target-reached-in-workspace-events-award-unverified');
  assert.equal(complete.tier,'gold');
  assert.equal(complete.observedMergedExercises,1024);
  assert.throws(()=>nextBadgePlanFromWorkspace(report,tree,{repo,goal:'max',tier:'gold'}),
    /either --tier or --goal/);
});

test('status refuses to count reviewed or third-party merged PRs as YOLO candidates',async()=>{
  for(const options of [{statusReviewed:true},{otherMerger:true}]){
    const api=mockAPI({existing:true,existingMarker:'shared',
      statusMixed:true,...options});
    const result=await inspectBadgeWorkspace({repo,token:'test-only',fetch:api.fetch,reserveWrite:()=>{}});
    assert.equal(result.observed.yoloSelfMergeNoReviewCandidate,null);
    assert.equal(result.observed.yoloInspectedMergedPRs,1);
    assert.equal(result.events.yoloReviewEvidence[0].qualifiesAsEvent,false);
    assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
  }
});

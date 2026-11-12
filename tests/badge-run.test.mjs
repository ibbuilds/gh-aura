import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planBadgeRun, badgeDigest, loadBadgePlan, applyBadgeRun } from '../src/badge-run.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

const repo='example/aura-achievements';
const plan=(opts={})=>planBadgeRun({repo,pulls:2,quickdraw:true,role:'backend',...opts});
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
      return response({full_name:repo,private:true,default_branch:'main',archived:false,fork:false},{status:201});
    }
    if(path===base+'/contents/README.md?ref=main'){
      const text=options.existing ? options.existingMarker===false?'# Regular private repo':
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
    if(path===base+'/issues?state=all&per_page=100')return response(
      options.alreadyDone?[{title:'[GH-AURA-QA-0001] Validate private sandbox setup',
        state:'closed'}]:[]);
    if(path===base+'/issues' && method==='POST'){
      issue++;return response({number:issue,html_url:'https://github.com/'+repo+'/issues/'+issue},{status:201});
    }
    if(path===base+'/issues/'+issue && method==='PATCH'){
      assert.equal(body.state,'closed');return response({number:issue,state:'closed'});
    }
    if(path.startsWith(base+'/contents/docs/gh-aura/exercise-')&&method==='GET') {
      return options.alreadyDone?response({sha:'c'.repeat(40),type:'file'}):response({},404);
    }
    if(path.startsWith(base+'/git/ref/heads/gh-aura/badge-')&&method==='GET')return response({},404);
    if(path===base+'/git/ref/heads/main'&&method==='GET')
      return response({object:{sha:'a'.repeat(40)}});
    if(path===base+'/git/refs'&&method==='POST'){
      assert.ok(body.ref.startsWith('refs/heads/gh-aura/badge-'));
      return response({ref:body.ref},{status:201});
    }
    if(path.startsWith(base+'/contents/docs/gh-aura/exercise-')&&method==='PUT'){
      assert.equal(body.branch.startsWith('gh-aura/badge-'),true);
      assert.match(Buffer.from(body.content,'base64').toString(),/synthetic exercise/i);
      return response({commit:{sha:'b'.repeat(40)}});
    }
    if(path===base+'/pulls'&&method==='POST'){
      prs++;return response({number:prs,html_url:'https://github.com/'+repo+'/pull/'+prs},{status:201});
    }
    if(path===base+'/pulls/'+prs+'/merge'&&method==='PUT'){
      assert.equal(body.merge_method,'squash');
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
  const result=await applyBadgeRun(p,{confirm:p.fingerprint,
    token:'test-only',fetch:api.fetch,sleep:async()=>{}});
  assert.equal(api.created,true);
  assert.equal(result.private,true);
  assert.equal(result.mergedPulls.length,2);
  assert.equal(result.skippedAlreadyMerged.length,0);
  assert.match(result.quickdrawIssue,/\/issues\/1$/);
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
    token:'test-only',fetch:api.fetch,sleep:async()=>{}});
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
      fetch:api.fetch,sleep:async()=>{}}),/Only an active|not an explicit/);
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
    token:'test-only',fetch:api.fetch}),/owned private repository/);
  assert.equal(api.requests.filter(x=>x.method!=='GET').length,0);
});
test('CLI plan/apply are separate with required explicit review',()=>{
  validateOptions('badge-run',parseArgs(['plan','--repo',repo,'--pulls','2','--output','p.json']));
  validateOptions('badge-run',parseArgs(['apply','--review','p.json','--confirm','f'.repeat(64)]));
  assert.throws(()=>validateOptions('badge-run',parseArgs(['apply','--review','p.json'])),/confirm/);
  assert.throws(()=>validateOptions('badge-run',parseArgs(['plan','--repo',repo,'--pulls','999'])),/pulls/);
  assert.throws(()=>validateOptions('badge-run',parseArgs(['apply','--review','p.json','--confirm','f'.repeat(64),'--repo',repo])),/confirm/);
});

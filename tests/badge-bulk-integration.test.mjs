import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planBadgeRun, applyBadgeRun } from '../src/badge-run.mjs';

const repo='example/aura-bulk';
const base='/repos/'+repo;
const response=(data,status=200)=>Response.json(data,{status});
const marker='# GH Aura\nGH-AURA-PRIVATE-WORKSPACE-V1\n';
function git(args,options={}) {
  const p=spawnSync('git',args,{
    cwd:options.cwd,encoding:'utf8',timeout:30000,windowsHide:true
  });
  assert.equal(p.status,0,'git '+args.join(' ')+': '+p.stderr);
  return (p.stdout||'').trim();
}
function setup(){
  const root=mkdtempSync(join(tmpdir(),'gh-aura-bulk-apply-'));
  const remote=join(root,'remote.git'),seed=join(root,'seed');
  mkdirSync(seed);
  git(['init','--bare','--quiet',remote]);
  git(['init','--quiet','--initial-branch=main'],{cwd:seed});
  writeFileSync(join(seed,'README.md'),marker);
  git(['add','README.md'],{cwd:seed});
  git(['-c','user.name=Example','-c','user.email=example@example.test',
    'commit','--quiet','-m','Initialize private workspace'],{cwd:seed});
  git(['push','--quiet',remote,'refs/heads/main:refs/heads/main'],{cwd:seed});
  return {root,remote,initial:git(['rev-parse','HEAD'],{cwd:seed})};
}
function simulatedGitHub(setup,options={}) {
  const calls=[],merged=new Set(),posted=[],reserved=[];
  let pull=0;
  const fetch=async(url,params={})=>{
    const path=url.replace('https://api.github.com','');
    const method=params.method||'GET';
    const body=params.body?JSON.parse(params.body):null;
    calls.push({path,method,body});
    if(path==='/user')return response({login:'example'});
    if(path===base&&method==='GET')return response({
      full_name:repo,private:true,fork:false,archived:false,default_branch:'main'});
    if(path===base+'/contents/README.md?ref=main')return response({
      type:'file',encoding:'base64',size:marker.length,
      content:Buffer.from(options.unmarked?'# other repo\n':marker).toString('base64')});
    if(path===base+'/git/ref/heads/main')return response({
      object:{sha:setup.initial}});
    const match=/^\/repos\/example\/aura-bulk\/contents\/docs\/gh-aura\/exercise-(\d{4})\.md\?ref=main$/.exec(path);
    if(match)return merged.has(Number(match[1]))?
      response({type:'file',sha:'d'.repeat(40)}):response({},404);
    if(path===base+'/pulls'&&method==='POST') {
      const index=Number(/badge-(\d{4})/.exec(body.head)?.[1]);
      assert.ok(Number.isInteger(index));
      const ref='refs/heads/gh-aura/badge-'+String(index).padStart(4,'0');
      const sha=git(['--git-dir',setup.remote,'rev-parse',ref]);
      pull++;
      posted.push({index,sha});
      return response({number:pull,html_url:'https://github.com/'+repo+'/pull/'+pull,
        head:{sha}},201);
    }
    if(/^\/repos\/example\/aura-bulk\/pulls\/\d+\/reviews\?per_page=100$/.test(path))
      return response(options.submittedReviews?[{state:'APPROVED'}]:[]);
    const mergeMatch=/^\/repos\/example\/aura-bulk\/pulls\/(\d+)\/merge$/.exec(path);
    if(mergeMatch&&method==='PUT') {
      const pr=posted[Number(mergeMatch[1])-1];
      assert.equal(body.sha,pr.sha);
      assert.equal(body.merge_method,'squash');
      merged.add(pr.index);
      return response({merged:true,sha:'c'.repeat(40)});
    }
    throw Error('Unexpected REST '+method+' '+path);
  };
  return {fetch,calls,posted,merged,reserved,
    reserveWrite:async(owner,count=1)=>{assert.equal(owner,'example');reserved.push(count);return {remaining:300};}};
}
test('approved v3 batch stages branches in one Git push, then two REST writes per PR',async()=>{
  const local=setup();
  try{
    const api=simulatedGitHub(local);
    const plan=planBadgeRun({repo,strategy:'git-batch',pulls:2,quickdraw:false});
    assert.equal(plan.format,'gh-aura-private-badges-v3');
    assert.equal(plan.strategy,'git-batch');
    const result=await applyBadgeRun(plan,{
      confirm:plan.fingerprint,token:'dummy-credential',
      fetch:api.fetch,testRemote:local.remote,
      reserveWrite:api.reserveWrite,sleep:async()=>{}
    });
    assert.equal(result.strategy,'git-batch');
    assert.equal(result.gitPushes,1);
    assert.equal(result.stagedBranches,2);
    assert.equal(result.mergedPulls.length,2);
    assert.equal(result.contentWrites,6);
    assert.deepEqual(api.reserved,[2,1,1,1,1]);
    assert.equal(api.calls.filter(x=>x.method==='POST').length,2);
    assert.equal(api.calls.filter(x=>x.method==='PUT').length,2);
    assert.ok(api.calls.every(x=>!x.path.endsWith('/git/refs')));
    assert.ok(api.calls.every(x=>!x.path.includes('/contents/docs/gh-aura/exercise-')||x.method==='GET'));
    assert.equal(git(['--git-dir',local.remote,'rev-parse','main']),local.initial);

    const replay=await applyBadgeRun(plan,{
      confirm:plan.fingerprint,token:'dummy-credential',
      fetch:api.fetch,testRemote:local.remote,
      reserveWrite:api.reserveWrite,sleep:async()=>{}
    });
    assert.equal(replay.gitPushes,0);
    assert.deepEqual(replay.skippedAlreadyMerged,[1,2]);
    assert.equal(replay.mergedPulls.length,0);
  }finally{rmSync(local.root,{recursive:true,force:true});}
});
test('unmarked repo and altered review fail before a single write or push',async()=>{
  const local=setup();
  try{
    const api=simulatedGitHub(local,{unmarked:true});
    const plan=planBadgeRun({repo,strategy:'git-batch',pulls:1,quickdraw:false});
    await assert.rejects(applyBadgeRun(plan,{
      confirm:plan.fingerprint,token:'dummy-credential',
      fetch:api.fetch,testRemote:local.remote,
      reserveWrite:api.reserveWrite,sleep:async()=>{}
    }),/not a GH Aura-marked/);
    assert.equal(api.calls.filter(x=>x.method!=='GET').length,0);
    assert.equal(api.reserved.length,0);
    const invalid={...plan,strategy:'rest'};
    await assert.rejects(applyBadgeRun(invalid,{
      confirm:invalid.fingerprint,token:'dummy-credential',fetch:api.fetch
    }),/altered/);
  }finally{rmSync(local.root,{recursive:true,force:true});}
});
test('unexpected formal review blocks batch PR merge and leaves source branch inspectable',async()=>{
  const local=setup();
  try{
    const api=simulatedGitHub(local,{submittedReviews:true});
    const plan=planBadgeRun({repo,strategy:'git-batch',pulls:1,quickdraw:false});
    await assert.rejects(applyBadgeRun(plan,{
      confirm:plan.fingerprint,token:'dummy-credential',fetch:api.fetch,
      testRemote:local.remote,reserveWrite:api.reserveWrite,sleep:async()=>{}
    }),/submitted or uninspectable reviews/);
    assert.equal(api.calls.filter(x=>x.path.endsWith('/merge')).length,0);
    assert.match(git(['--git-dir',local.remote,'rev-parse','refs/heads/gh-aura/badge-0001']),/^[a-f0-9]{40}$/);
  }finally{rmSync(local.root,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fastImportBadgeBranches, stageBadgeBranches, badgeExerciseRef }
  from '../src/badge-bulk-git.mjs';

const example='This is a synthetic exercise, not independently verified work.\n';
function git(args,opts={}) {
  const p=spawnSync('git',args,{
    cwd:opts.cwd,input:opts.input,encoding:'utf8',timeout:30000,windowsHide:true
  });
  assert.equal(p.status,0,'git '+args[0]+': '+p.stderr);
  return (p.stdout||'').trim();
}
function setup(){
  const root=mkdtempSync(join(tmpdir(),'gh-aura-badge-bulk-'));
  const remote=join(root,'remote.git'),seed=join(root,'seed');
  mkdirSync(seed);
  git(['init','--bare','--quiet',remote]);
  git(['init','--quiet','--initial-branch=main'],{cwd:seed});
  writeFileSync(join(seed,'README.md'),'# GH Aura\nGH-AURA-PRIVATE-WORKSPACE-V1\n');
  git(['add','README.md'],{cwd:seed});
  git(['-c','user.name=Example','-c','user.email=example@example.test',
    'commit','--quiet','-m','init sandbox marker'],{cwd:seed});
  git(['push','--quiet',remote,'refs/heads/main:refs/heads/main'],{cwd:seed});
  return {root,remote,seed,baseSha:git(['rev-parse','HEAD'],{cwd:seed})};
}
test('16 separate synthetic branches can be staged with one atomic local Git push',async()=>{
  const p=setup();
  try {
    const entries=Array.from({length:16},(_,i)=>({index:i+1,text:example+' #'+(i+1)}));
    const count=[];
    const result=await stageBadgeBranches({
      baseSha:p.baseSha,branch:'main',repo:'example/aura-private',
      token:'fake-credential-for-local-bare-only',entries,testRemote:p.remote,
      reservePush:async n=>{count.push(n);}
    });
    assert.deepEqual(count,[16]);
    assert.equal(result.gitPushes,1);
    assert.equal(result.prepared,16);
    assert.equal(result.shaByIndex.size,16);
    assert.equal(git(['--git-dir',p.remote,'rev-parse','main']),p.baseSha);
    for(const {index,text} of entries){
      const ref=badgeExerciseRef(index);
      assert.equal(git(['--git-dir',p.remote,'rev-parse',ref]),result.shaByIndex.get(index));
      assert.equal(git(['--git-dir',p.remote,'rev-parse',ref+'^']),p.baseSha);
      const path='docs/gh-aura/exercise-'+String(index).padStart(4,'0')+'.md';
      assert.equal(git(['--git-dir',p.remote,'show',ref+':'+path]),text.trim());
    }
    let retryReservations=0;
    await assert.rejects(stageBadgeBranches({
      baseSha:p.baseSha,branch:'main',repo:'example/aura-private',
      token:'fake-credential-for-local-bare-only',entries,testRemote:p.remote,
      reservePush:async()=>{retryReservations++;}
    }),/already exists/);
    assert.equal(retryReservations,0);
  } finally {rmSync(p.root,{recursive:true,force:true});}
});
test('stale default branch stops the entire batch before any remote ref change',async()=>{
  const p=setup();
  try{
    const badSha='a'.repeat(40),reserved=[];
    await assert.rejects(stageBadgeBranches({
      baseSha:badSha,branch:'main',repo:'example/aura-private',
      token:'fake-local-token',entries:[{index:1,text:example}],testRemote:p.remote,
      reservePush:async n=>reserved.push(n)
    }),/Default branch changed/);
    assert.deepEqual(reserved,[]);
    assert.equal(git(['--git-dir',p.remote,'rev-parse','main']),p.baseSha);
    assert.equal(git(['ls-remote','--heads',p.remote,badgeExerciseRef(1)]),'');
  } finally {rmSync(p.root,{recursive:true,force:true});}
});
test('bulk input and branch name validation fails before GitHub interaction',()=>{
  assert.throws(()=>badgeExerciseRef(0),/index/);
  assert.throws(()=>badgeExerciseRef(1025),/index/);
  assert.throws(()=>fastImportBadgeBranches('a'.repeat(40),
    [{index:1,text:'pretend engineering work'}],1794528000),/unmarked/);
  assert.throws(()=>fastImportBadgeBranches('a'.repeat(40),
    [{index:1,text:example},{index:1,text:example}],1794528000),/Duplicate/);
  assert.throws(()=>fastImportBadgeBranches('x'.repeat(40),
    [{index:1,text:example}],1794528000),/verified Git SHA/);
  assert.throws(()=>fastImportBadgeBranches('a'.repeat(40),
    [{index:1,text:example}],0),/clock/);
});

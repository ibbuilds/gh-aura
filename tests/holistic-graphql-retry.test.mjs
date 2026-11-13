import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runResearch } from '../scripts/research-holistic-profiles.mjs';
import { mergeHolisticBatches } from '../scripts/merge-holistic-batches.mjs';

test('transient GraphQL 504 retries and splits a failed group without fabricating missing profiles',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-graphql-fallback-'));
  const previousFetch=globalThis.fetch,previousToken=process.env.GH_TOKEN;
  let queries=0;
  try{
    const input=join(dir,'candidates.json'),output=join(dir,'observed.json');
    writeFileSync(input,JSON.stringify({schema:'gh-aura-holistic-profile-candidates-v1',
      candidates:Array.from({length:500},(_,i)=>({
        login:'user'+i,profileUrl:'https://github.com/user'+i}))}));
    process.env.GH_TOKEN='unit-test-read-only-token';
    globalThis.fetch=async(_url,opts)=>{
      queries++;
      const values=Object.values(JSON.parse(opts.body).variables);
      if(values.length===2)return {ok:false,status:504};
      const login=values[0];
      return {ok:true,status:200,text:async()=>JSON.stringify({data:{
        p0:{login,url:'https://github.com/'+login,avatarUrl:null,pinnedItems:{nodes:[]},
          socialAccounts:{nodes:[]},contributionsCollection:{contributionCalendar:{
            totalContributions:0,weeks:[]}}}
      }})};
    };
    const result=await runResearch(['--input',input,'--start','0','--limit','2',
      '--batch-size','2','--budget','8','--output',output]);
    assert.equal(result.responded,2);
    assert.equal(result.requests,4,'two group attempts, then two successful single requests');
    assert.equal(queries,4);
    const batch=JSON.parse(readFileSync(output,'utf8'));
    assert.deepEqual(batch.profiles.map(x=>x.login),['user0','user1']);
    assert.ok(batch.profiles.every(x=>x.complete===false&&
      x.achievements.state==='not-observed'));
    const merged=mergeHolisticBatches({schema:'gh-aura-holistic-profile-candidates-v1',
      candidates:[{login:'user0'},{login:'user1'}]},[batch]);
    assert.equal(merged.covered,2);
    assert.equal(merged.fullyVisuallyReviewed,0);
  }finally{
    globalThis.fetch=previousFetch;
    if(previousToken===undefined)delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN=previousToken;
    rmSync(dir,{recursive:true,force:true});
  }
});

test('a persistently failing single GraphQL account is unknown, never counted as nonexistent',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-graphql-unknown-'));
  const prevFetch=globalThis.fetch,prevToken=process.env.GH_TOKEN;
  try{
    const input=join(dir,'candidates.json'),output=join(dir,'observed.json');
    writeFileSync(input,JSON.stringify({schema:'gh-aura-holistic-profile-candidates-v1',
      candidates:Array.from({length:500},(_,i)=>({login:'person'+i}))}));
    process.env.GH_TOKEN='unit-test-token';
    globalThis.fetch=async()=>({ok:false,status:504});
    const result=await runResearch(['--input',input,'--start','0','--limit','1',
      '--batch-size','1','--budget','3','--output',output]);
    const item=JSON.parse(readFileSync(output,'utf8')).profiles[0];
    assert.equal(result.responded,0);
    assert.equal(item.availability,'transient-github-api-unavailable');
    assert.equal(item.complete,false);
    assert.ok(item.missing.includes('achievements'));
  }finally{
    globalThis.fetch=prevFetch;
    if(prevToken===undefined)delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN=prevToken;
    rmSync(dir,{recursive:true,force:true});
  }
});
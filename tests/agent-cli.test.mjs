import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const run=(args,cwd)=>spawnSync(process.execPath,[cli,...args],{
  cwd,encoding:'utf8',timeout:10000,maxBuffer:512*1024,
  env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
});

test('source discovery and agent specs require no network or configuration',()=>{
  const folder=mkdtempSync(join(tmpdir(),'gh-aura-agent-'));
  try{
    const sources=run(['sources','list','--json'],folder);
    assert.equal(sources.status,0,sources.stderr);
    const s=JSON.parse(sources.stdout);
    assert.ok(s.count>=10);
    const found=run(['sources','recommend','--query','markdown','--direction','barebones','--json'],folder);
    assert.equal(found.status,0,found.stderr);
    const recommendation=JSON.parse(found.stdout);
    assert.ok(recommendation.sources.some(x=>x.id==='github-markdown'));
    assert.ok(recommendation.sources.every(x=>x.trust!=='third-party'));
    const withExternal=run(['sources','recommend','--query','icons',
      '--direction','expressive','--external','--json'],folder);
    assert.equal(withExternal.status,0,withExternal.stderr);
    assert.ok(JSON.parse(withExternal.stdout).sources.some(x=>x.id==='simple-icons'));
    const details=run(['sources','show','simple-icons','--json'],folder);
    assert.equal(details.status,0,details.stderr);
    assert.match(details.stdout,/trademarks/i);
    const caps=run(['agent','capabilities','--json'],folder);
    assert.equal(caps.status,0,caps.stderr);
    const c=JSON.parse(caps.stdout);
    assert.equal(c.writesExposed,false);
    const file=join(folder,'profile-spec.json');
    const spec=run(['agent','spec','--direction','technical',
      '--goal','backend engineer','--max-words','130','--output',file],folder);
    assert.equal(spec.status,0,spec.stderr);
    assert.ok(existsSync(file));
    const value=JSON.parse(readFileSync(file,'utf8'));
    assert.equal(value.format,'gh-aura-profile-spec-v1');
    assert.equal(value.goal,'backend engineer');
    assert.equal(value.maxWords,130);
    assert.equal(value.direction,'technical');
  }finally{rmSync(folder,{recursive:true,force:true});}
});

test('CLI rejects attempts to turn agent interface into a remote write or unsafe source query',()=>{
  const folder=mkdtempSync(join(tmpdir(),'gh-aura-agent-invalid-'));
  try{
    for(const args of [
      ['agent','publish','--review','oops.json'],
      ['agent','spec','--max-words','10'],
      ['sources','show','../etc/passwd'],
      ['sources','recommend','--limit','9999'],
      ['sources','list','--external'],
      ['mcp','--user','other'],
    ]){
      const r=run(args,folder);
      assert.notEqual(r.status,0,JSON.stringify(args));
      assert.match(r.stderr,/GH Aura:/);
    }
    const guide=run(['agent','spec','--direction','barebones'],folder);
    assert.equal(guide.status,0,guide.stderr);
    assert.doesNotMatch(guide.stdout,/API_KEY|GH_TOKEN|SECRET_TOKEN/);
  }finally{rmSync(folder,{recursive:true,force:true});}
});

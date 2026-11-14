import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CURATED_PROFILE_PATTERNS, listCuratedProfiles, getCuratedProfile,
  recommendCuratedPatterns } from '../src/profile-patterns.mjs';
import { professionalReview } from '../src/profile-review.mjs';
import { runAgentTool } from '../src/agent-tools.mjs';
import { handleMcpMessage } from '../src/mcp-server.mjs';
import { recommendProfileTechniques } from '../src/profile-techniques.mjs';

const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const run=(args,cwd)=>spawnSync(process.execPath,[cli,...args],{
  cwd,encoding:'utf8',timeout:12000,maxBuffer:512*1024,
  env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
});

test('reading index preserves originals and gives every category actual references',()=>{
  assert.equal(CURATED_PROFILE_PATTERNS.length,100);
  assert.equal(new Set(CURATED_PROFILE_PATTERNS.map(x=>x.id.toLowerCase())).size,CURATED_PROFILE_PATTERNS.length);
  for(const row of CURATED_PROFILE_PATTERNS){
    assert.equal(row.profileUrl,'https://github.com/'+row.id);
    assert.ok(row.categories.length>0);
    assert.match(row.status,/reading-reference/);
  }
});

test('category selection returns source URLs and inspection steps instead of preset designs',()=>{
  assert.ok(listCuratedProfiles().profiles.length<=6);
  assert.ok(listCuratedProfiles({direction:'technical'}).profiles.length>0);
  assert.equal(getCuratedProfile('ORHUN').direction,'expressive');
  const r=recommendCuratedPatterns({query:'investigación',direction:'technical'});
  assert.equal(r.category,'technical-editorial');
  assert.ok(r.profiles.length>0&&r.profiles.length<=2);
  assert.ok(r.profiles.every(x=>x.profileUrl.startsWith('https://github.com/')));
  assert.match(r.readNext,/inspect/);
  assert.throws(()=>recommendCuratedPatterns({limit:3}),/1–2/);
  assert.throws(()=>listCuratedProfiles({direction:'unknown'}),/direction/);
  assert.throws(()=>getCuratedProfile('../../secret'),/Unknown/);
  assert.throws(()=>recommendCuratedPatterns({query:'x'.repeat(401)}),/400/);
});

test('professional review gives specific, bounded observations instead of a made-up rating',()=>{
  const result=professionalReview('# X\n\n![](https://external.test/banner.gif)\n',{goal:'hiring'});
  assert.equal(result.format,'gh-aura-professional-review-v1');
  assert.ok(result.observations.some(x=>x.id==='missing-alt'));
  assert.ok(result.observations.some(x=>x.id==='image-only'));
  assert.ok(result.observations.some(x=>x.id==='project-evidence'));
  assert.equal(Object.hasOwn(result,'score'),false);
  assert.match(result.caveat,/Offline/);
  const specific=professionalReview('# Research\n\n[real work](https://github.com/example/tool)',{goal:'research'});
  assert.equal(specific.goal,'research');
  assert.ok(specific.metrics.githubProjectLinks>=1);
  assert.throws(()=>professionalReview('# Any',{goal:'fake'}),/Unknown/);
});

test('third-party visual resources require both opt-in and a specific media request',()=>{
  const general=recommendProfileTechniques({query:'backend engineer',direction:'technical',includeExternal:true});
  assert.ok(general.techniques.every(x=>!x.thirdParty));
  const icons=recommendProfileTechniques({query:'iconos',direction:'expressive',includeExternal:true});
  assert.ok(icons.techniques.some(x=>x.thirdParty));
  const blocked=recommendProfileTechniques({query:'iconos',direction:'expressive'});
  assert.ok(blocked.techniques.every(x=>!x.thirdParty));
});

test('standalone offline CLI selects reading references and reviews without any agent',()=>{
  const cwd=mkdtempSync(join(tmpdir(),'gh-aura-curation-'));
  try{
    const listing=run(['sources','profiles','--json'],cwd);
    assert.equal(listing.status,0,listing.stderr);
    assert.ok(JSON.parse(listing.stdout).profiles.length<=6);
    const detail=run(['sources','profile','mattabate','--json'],cwd);
    assert.equal(detail.status,0,detail.stderr);
    assert.equal(JSON.parse(detail.stdout).id,'mattabate');
    const chosen=run(['sources','patterns','--query','terminal retro','--direction','expressive','--json'],cwd);
    assert.equal(chosen.status,0,chosen.stderr);
    assert.ok(JSON.parse(chosen.stdout).profiles.length<=2);
    const tooMany=run(['sources','patterns','--limit','3'],cwd);
    assert.notEqual(tooMany.status,0);
    const file=join(cwd,'draft.md');
    writeFileSync(file,'# Example\n\n![](https://example.test/a.png)\n');
    const report=run(['check','--file',file,'--professional','--goal','hiring','--json'],cwd);
    assert.equal(report.status,0,report.stderr);
    assert.ok(JSON.parse(report.stdout).observations.some(x=>x.id==='missing-alt'));
    const strict=run(['check','--file',file,'--professional','--goal','hiring','--strict'],cwd);
    assert.notEqual(strict.status,0);
    const misuse=run(['sources','profile','mattabate','--catalog','/etc/passwd'],cwd);
    assert.notEqual(misuse.status,0);
  }finally{rmSync(cwd,{recursive:true,force:true});}
});

test('MCP exposes the same catalog and review with no writing tools',async()=>{
  const list=await runAgentTool('gh_aura_profiles_list',{});
  assert.ok(list.profiles.length<=6);
  const pick=await runAgentTool('gh_aura_patterns_recommend',{query:'research',direction:'technical'});
  assert.ok(pick.profiles.length<=2);
  const report=await runAgentTool('gh_aura_profile_professional_review',{markdown:'# A\n\nHello.',goal:'general'});
  assert.equal(report.format,'gh-aura-professional-review-v1');
  const rpc=await handleMcpMessage({jsonrpc:'2.0',id:4,method:'resources/read',
    params:{uri:'gh-aura://profiles/selected'}});
  assert.ok(JSON.parse(rpc.result.contents[0].text).profiles.length<=6);
  await assert.rejects(runAgentTool('gh_aura_patterns_recommend',{limit:3}),/1–2/);
  await assert.rejects(runAgentTool('gh_aura_apply',{markdown:'# Bad'}),/unauthorized/);
});

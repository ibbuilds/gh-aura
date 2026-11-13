import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditPatternStudy } from '../src/pattern-library.mjs';
import { HOLISTIC_STYLES,PROFILE_FACETS } from '../src/holistic-profile-taxonomy.mjs';
import { runAgentTool } from '../src/agent-tools.mjs';

const review=i=>({login:'fixture-review-'+i,primaryStyle:HOLISTIC_STYLES[i%8].id,secondaryStyles:[],purposes:['career'],decision:'approved',
  reviewer:'Synthetic fixture, not a real reviewer',reviewedAt:'2026-11-13',evidenceNotes:'PRIVATE-NOTE-MUST-NOT-LEAVE-THE-FILE',
  facetStates:Object.fromEntries(PROFILE_FACETS.map(f=>[f,'observed'])),visualChecks:{desktopLight:true,desktopDark:true,mobileLight:true,mobileDark:true},
  editorialChecks:{accessibility:true,assetRights:true,projectAttribution:true},evidenceUrls:['https://github.com/fixture-review-'+i]});
const pattern=()=>({id:'fixture-pattern',styles:['native-no-readme'],title:'Synthetic fixture',when:'For tests only',principle:'No actual editorial approval is asserted.',avoid:'Do not publish this fixture as research.',techniques:[],reviewLogins:['fixture-review-0','fixture-review-8','fixture-review-16']});

test('progress reports real missing fields, bounds samples and does not expose notes or fabricate complete reviews',()=>{
  const reviews=Array.from({length:52},(_,i)=>({...review(i),reviewedAt:'2026-02-30',decision:null}));
  const result=auditPatternStudy({reviews},{limit:2});assert.equal(result.complete,0);assert.equal(result.pending,52);assert.equal(result.remaining,500);
  assert.equal(result.pendingSample.length,2);assert.equal(result.sampleTruncated,true);assert.equal(result.missingCounts.editorialReview,52);assert.equal(result.missingCounts.decision,52);
  assert.equal(result.eligibleForCompilation,false);assert.ok(!JSON.stringify(result).includes('PRIVATE-NOTE'));assert.match(result.caveat,/does not perform reviews/);
});

test('compilation readiness requires the review count, all categories and compatible approved pattern sources',()=>{
  const input={reviews:Array.from({length:500},(_,i)=>review(i)),patterns:[pattern()]};
  assert.equal(auditPatternStudy(input).eligibleForCompilation,true);
  input.reviews[0].decision='conditional';const conditional=auditPatternStudy(input);assert.equal(conditional.complete,500);assert.equal(conditional.eligibleForCompilation,false);assert.deepEqual(conditional.patternProblems[0].missingReferences,['fixture-review-0']);
  input.reviews=input.reviews.map(r=>({...r,primaryStyle:'native-no-readme'}));assert.ok(auditPatternStudy(input).blockers.includes('style-coverage'));
  assert.throws(()=>auditPatternStudy({reviews:[review(0),review(0)]}),/Duplicate/);
});

test('CLI and owner-selected MCP progress summarize a local file without agent-selected paths or raw data',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'gh-aura-editorial-progress-')),file=join(directory,'reviews.json'),previous=process.env.GH_AURA_EDITORIAL_FILE;
  try{
    writeFileSync(file,JSON.stringify({reviews:[{...review(0),decision:null}]}));
    const cli=spawnSync(process.execPath,['src/cli.mjs','sources','audit','--catalog',file,'--json'],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).pending,1);
    delete process.env.GH_AURA_EDITORIAL_FILE;assert.equal((await runAgentTool('gh_aura_editorial_progress')).state,'not-configured');
    process.env.GH_AURA_EDITORIAL_FILE=file;const report=await runAgentTool('gh_aura_editorial_progress',{limit:1});assert.equal(report.pending,1);assert.equal(report.writesPerformed,0);
    assert.ok(!JSON.stringify(report).includes(directory));assert.ok(!JSON.stringify(report).includes('PRIVATE-NOTE'));
    await assert.rejects(runAgentTool('gh_aura_editorial_progress',{file}),/Unexpected/);
  }finally{if(previous===undefined)delete process.env.GH_AURA_EDITORIAL_FILE;else process.env.GH_AURA_EDITORIAL_FILE=previous;rmSync(directory,{recursive:true,force:true});}
});

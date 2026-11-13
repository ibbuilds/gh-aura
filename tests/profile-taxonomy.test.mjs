import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PROFILE_FACETS,holisticReadiness,validateHolisticReview,groupReviewedProfiles} from '../src/holistic-profile-taxonomy.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {configForTest,snapshotForTest} from './fixtures.mjs';
import {runAgentTool} from '../src/agent-tools.mjs';
const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));

test('best in category requires every facet, visual review and explicit editorial decision',()=>{
  const base={login:'some-builder',primaryStyle:'project-showcase',
    secondaryStyles:['visual-illustrated'],purposes:['product'],editorialRank:1,
    decision:'approved',reviewer:'two-person-editorial-review',reviewedAt:'2026-11-12',
    evidenceNotes:'Projects and pins inspected; imagery rights and layout checked.',editorialChecks:{accessibility:true,assetRights:true,projectAttribution:true}};
  assert.equal(holisticReadiness(base).complete,false);
  const pending=groupReviewedProfiles([base]);
  assert.equal(pending.groups['project-showcase'].length,0);
  assert.equal(pending.pending.length,1);
  const full={...base,facetStates:Object.fromEntries(PROFILE_FACETS.map(x=>[x,'observed'])),
    visualChecks:{desktopLight:true,desktopDark:true,mobileLight:true,mobileDark:true}};
  assert.equal(validateHolisticReview(full).readiness.complete,true);
  const grouped=groupReviewedProfiles([full]);
  assert.equal(grouped.groups['project-showcase'].length,1);
  assert.equal(grouped.groups['project-showcase'][0].login,'some-builder');
  assert.throws(()=>groupReviewedProfiles([full,full]),/Duplicate/);
  assert.throws(()=>validateHolisticReview({...full,primaryStyle:'fake-style'}),/Unknown/);
});
test('CLI and optional agent can describe categories, but legacy 25 never auto-fill a brief',async()=>{
  const proc=spawnSync(process.execPath,[cli,'sources','categories','--json'],{
    encoding:'utf8',env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
  assert.equal(proc.status,0,proc.stderr);
  const taxonomy=JSON.parse(proc.stdout);
  assert.equal(taxonomy.styles.length,8);
  assert.equal(taxonomy.facets.length,9);
  const agent=await runAgentTool('gh_aura_profile_categories',{});
  assert.equal(agent.styles.length,8);
  const brief=editorialBrief(snapshotForTest(),configForTest());
  assert.deepEqual(brief.patternSuggestions,[]);
  assert.match(brief.patternSelectionStatus,/provisional/);
});

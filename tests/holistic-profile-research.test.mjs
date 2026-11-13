import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildBatchQuery,normalizePublicProfile} from '../scripts/research-holistic-profiles.mjs';
import {HOLISTIC_STYLES,PROFILE_FACETS,PROFILE_PURPOSES,holisticReadiness,
  validateHolisticReview,groupReviewedProfiles} from '../src/holistic-profile-taxonomy.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {configForTest,snapshotForTest} from './fixtures.mjs';
import {runAgentTool} from '../src/agent-tools.mjs';

const candidates=JSON.parse(readFileSync(new URL('../research/profile-candidates-600.json',import.meta.url),'utf8'));
const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));

test('600 unique leads are candidates, not fabricated complete profile audits',()=>{
  assert.equal(candidates.schema,'gh-aura-holistic-profile-candidates-v1');
  assert.equal(candidates.totalCandidates,600);
  assert.equal(candidates.targetAudited,500);
  assert.equal(candidates.candidates.length,600);
  assert.equal(new Set(candidates.candidates.map(x=>x.login.toLowerCase())).size,600);
  assert.ok(candidates.studyStatus.includes('NOT 600 full-profile audits'));
  assert.equal(candidates.candidates.filter(x=>x.sources.includes('eddiehub-archived-gallery')&&x.sources.length===1).length,315);
  for(const id of ['fzn0x','SamuelSchlesinger','yetone','serenakeyitan',
    'mattabate','morluto','poteto','WenyuChiou']){
    const record=candidates.candidates.find(x=>x.login.toLowerCase()===id.toLowerCase());
    assert.ok(record,id);
    assert.ok(record.sources.includes('user-supplied-8'),id);
  }
  for(const x of candidates.candidates){
    assert.match(x.profileUrl,/^https:\/\/github\.com\/[A-Za-z0-9-]+$/);
    assert.equal(x.fullProfileState,'not-holistically-audited');
    assert.equal(x.primaryStyle,null);
    assert.deepEqual(x.secondaryStyles,[]);
    assert.ok(!Object.hasOwn(x,'achievements'));
    assert.ok(!Object.hasOwn(x,'avatarScore'));
  }
});
test('the taxonomy covers every full-profile facet and avoids equating career with visual style',()=>{
  assert.deepEqual(PROFILE_FACETS,[
    'avatar','profileHeader','biography','links','profileReadme',
    'pinnedRepositories','contributionCalendar','achievements','overallComposition']);
  assert.equal(HOLISTIC_STYLES.length,8);
  assert.equal(new Set(HOLISTIC_STYLES.map(x=>x.id)).size,8);
  assert.ok(HOLISTIC_STYLES.some(x=>x.id==='native-no-readme'));
  assert.ok(PROFILE_PURPOSES.includes('career')&&PROFILE_PURPOSES.includes('research'));
  assert.equal(holisticReadiness({}).complete,false);
});
test('GraphQL query handles five aliases with variables and avoids inline personal identifiers',()=>{
  const q=buildBatchQuery(['fzn0x','some-else']);
  assert.match(q.query,/p0:user\(login:\$u0\)/);
  assert.match(q.query,/pinnedItems\(first:6/);
  assert.match(q.query,/contributionCalendar/);
  assert.match(q.query,/avatarUrl/);
  assert.match(q.query,/repository\(name:\$u0\)/);
  assert.doesNotMatch(q.query,/fzn0x|some-else/);
  assert.equal(q.variables.u0,'fzn0x');
  assert.throws(()=>buildBatchQuery([]),/1–5/);
  assert.throws(()=>buildBatchQuery(['a','b','c','d','e','f']),/1–5/);
});
test('GraphQL normalizer records all observable components without retaining private text',()=>{
  const originalBio='A research bio that should not be retained.';
  const result=normalizePublicProfile('example',{
    login:'example',url:'https://github.com/example',
    avatarUrl:'https://avatars.githubusercontent.com/u/1',
    name:'Example',bio:originalBio,websiteUrl:'https://example.org',company:'UNVERIFIED COMPANY',location:'UNVERIFIED LOCATION',
    status:{message:'I am working on a secret project'},
    socialAccounts:{nodes:[{provider:'TWITTER',url:'https://example.com/privatehandle'}]},
    pinnedItems:{nodes:[{nameWithOwner:'example/my-lib',url:'https://github.com/example/my-lib',
      description:'A public library',isArchived:false,isFork:false,isPrivate:false,
      primaryLanguage:{name:'TypeScript'}}]},
    contributionsCollection:{contributionCalendar:{totalContributions:22,
      weeks:[{contributionDays:[{contributionCount:1},{contributionCount:0}]}]}},
    repository:{isPrivate:false,object:{oid:'a'.repeat(40),byteSize:20,
      text:'# Hi\n\nA very original profile.\n[work](https://github.com/example/my-lib)'}},
  },'2026-11-12T12:00:00Z');
  assert.equal(result.complete,false);
  assert.equal(result.avatar.state,'url-observed-visual-unreviewed');
  assert.equal(result.profileReadme.state,'observed');
  assert.equal(result.pinnedRepositories.count,1);
  assert.equal(result.contributionCalendar.activeDays,1);
  assert.equal(result.contributionCalendar.totalVisible,22);
  assert.equal(result.achievements.state,'not-observed');
  assert.equal(result.classification.primaryStyle,null);
  assert.equal(result.profileHeader.companyFieldPresent,true);
  assert.equal(result.biography.present,true);
  const data=JSON.stringify(result);
  for(const x of [originalBio,'UNVERIFIED COMPANY','UNVERIFIED LOCATION','secret project','privatehandle'])
    assert.ok(!data.includes(x),'Never persist private/public personal prose: '+x);
  const missing=normalizePublicProfile('unavailable',null,'2026-11-12T12:00:00Z');
  assert.equal(missing.availability,'not-returned-by-github');
  assert.ok(missing.missing.includes('achievements'));
});
test('best in category requires every facet, visual review and explicit editorial decision',()=>{
  const base={login:'some-builder',primaryStyle:'project-showcase',
    secondaryStyles:['visual-illustrated'],purposes:['product'],editorialRank:1,
    decision:'approved',reviewer:'two-person-editorial-review',reviewedAt:'2026-11-12',
    evidenceNotes:'Projects and pins inspected; imagery rights and layout checked.'};
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

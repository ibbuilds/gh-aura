import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PROFILE_SOURCE_STUDY,SOURCE_COMPOSITION_PRINCIPLES,recommendSourcePrinciples} from '../src/profile-research.mjs';
import {HOLISTIC_STYLES} from '../src/holistic-profile-taxonomy.mjs';
import {recommendProfileTechniques} from '../src/profile-techniques.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {writingPrompt} from '../src/editorial.mjs';
import {runAgentTool,getAgentToolDefinitions} from '../src/agent-tools.mjs';
import {configForTest,snapshotForTest} from './fixtures.mjs';

test('source study covers every style without inventing full-profile or human certifications',()=>{
  assert.equal(PROFILE_SOURCE_STUDY.profilesAssessed,500);
  assert.equal(PROFILE_SOURCE_STUDY.availablePublicUsers,499);
  for(const field of ['humanReviews','visualCertifications','rightsCertifications'])assert.equal(PROFILE_SOURCE_STUDY[field],0);
  assert.match(PROFILE_SOURCE_STUDY.datasetSHA256,/^[a-f\d]{64}$/);
  for(const style of HOLISTIC_STYLES)assert.ok(SOURCE_COMPOSITION_PRINCIPLES.some(p=>p.styles.includes(style.id)),style.id);
  for(const p of SOURCE_COMPOSITION_PRINCIPLES){
    assert.equal(p.status,'source-informed-composition-principle');
    assert.equal(new Set(p.sources).size,3);
    assert.ok(p.sources.every(s=>/^https:\/\/github\.com\/[a-z\d-]+$/i.test(s)));
  }
  assert.equal(new Set(SOURCE_COMPOSITION_PRINCIPLES.flatMap(p=>p.sources)).size,PROFILE_SOURCE_STUDY.sourceCheckedForPrinciples);
});

test('explicit terminal, dashboard and feed requests select relevant principles across direction defaults',()=>{
  assert.equal(recommendSourcePrinciples({query:'terminal ASCII sobrio',direction:'minimal'}).principles[0].id,'code-motif-with-plain-text');
  assert.equal(recommendSourcePrinciples({query:'estadísticas dashboard',direction:'technical'}).principles[0].id,'contextual-metrics');
  assert.equal(recommendSourcePrinciples({query:'blog feed updates',direction:'minimal'}).principles[0].id,'maintained-feed');
  assert.equal(recommendSourcePrinciples({direction:'barebones'}).principles[0].id,'purposeful-link-directory');
  assert.equal(recommendSourcePrinciples({direction:'minimal'}).principles[0].id,'projects-and-contributions');
  assert.match(recommendSourcePrinciples({query:'native bio pins',direction:'barebones'}).principles[0].principle,/README is optional/);
});

test('bounded selection returns independent values and rejects malformed input',()=>{
  const result=recommendSourcePrinciples({limit:1});
  result.principles[0].sources.push('https://example.test/');result.study.humanReviews=500;
  assert.equal(recommendSourcePrinciples().study.humanReviews,0);
  assert.equal(recommendSourcePrinciples().principles[0].sources.length,3);
  for(const input of [{limit:0},{limit:3},{direction:'missing'},{query:'x'.repeat(401)},{query:42}])assert.throws(()=>recommendSourcePrinciples(input));
});

test('source principles accompany design suggestions without enabling external media',async()=>{
  const options={query:'terminal stats cards',direction:'technical',includeExternal:false};
  const direct=recommendProfileTechniques(options);
  assert.ok(direct.techniques.every(t=>!t.thirdParty));
  const tool=await runAgentTool('gh_aura_design_recommend',options);
  assert.deepEqual(tool.researchGuidance,direct.researchGuidance);
  assert.equal(getAgentToolDefinitions({}).find(t=>t.name==='gh_aura_design_recommend').annotations.readOnlyHint,true);
  assert.equal((await runAgentTool('gh_aura_profile_categories',{})).sourceStudy.humanReviews,0);
});

test('editorial context uses compact source guidance while complete-review patterns stay separate',()=>{
  const brief=editorialBrief(snapshotForTest(),configForTest());
  assert.equal(brief.researchGuidance.principles.length,1);
  assert.equal(brief.researchGuidance.study.profilesAssessed,500);
  assert.deepEqual(brief.patternSuggestions,[]);
  assert.ok(Buffer.byteLength(JSON.stringify(brief))<=12000);
  assert.match(writingPrompt(brief),/AI source study/);
  assert.ok(!Object.hasOwn(brief.researchGuidance,'reviews'));
});

test('CLI exposes the synthesis offline without shipping individual profile assessments',()=>{
  const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[cli,'sources','study','--json'],{encoding:'utf8',env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
  assert.equal(result.status,0,result.stderr);
  const study=JSON.parse(result.stdout);
  assert.equal(study.principles.length,8);assert.equal(study.readOnly,true);assert.equal(study.writesPerformed,0);
  assert.equal(study.study.humanReviews,0);assert.equal(Object.hasOwn(study,'reviews'),false);
});

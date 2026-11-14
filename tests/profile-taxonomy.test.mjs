import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILE_FACETS,HOLISTIC_STYLES} from '../src/holistic-profile-taxonomy.mjs';
import {ORIGINAL_PROFILE_REFERENCES,getCuratedProfile,profileCategories,recommendProfileExamples,listCuratedProfiles} from '../src/profile-patterns.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {configForTest,snapshotForTest} from './fixtures.mjs';
import {runAgentTool} from '../src/agent-tools.mjs';
import {makeProfileSpec} from '../src/agent-profile.mjs';

test('all eight categories have several reading references and preserve the original eight',()=>{
  assert.equal(HOLISTIC_STYLES.length,8);assert.equal(PROFILE_FACETS.length,9);
  for(const category of profileCategories().styles){
    assert.ok(category.exampleCount>=3,category.id);
    const result=listCuratedProfiles({category:category.id,limit:50});
    assert.equal(result.total,category.exampleCount);
    assert.ok(result.profiles.every(p=>p.categories.includes(category.id)));
  }
  assert.equal(ORIGINAL_PROFILE_REFERENCES.length,8);
  for(const login of ORIGINAL_PROFILE_REFERENCES)assert.equal(getCuratedProfile(login).origin,'user-supplied-reference');
});

test('user intent selects a category and explicit categories support hybrid directions',()=>{
  for(const [query,category] of [['terminal retro sobrio','terminal-code'],['minimalista sobrio','minimal-text'],['estadísticas dashboard','data-dashboard'],['blog feed updates','dynamic-content'],['sin README','native-no-readme']]){
    const result=recommendProfileExamples({query,direction:'minimal'});
    assert.equal(result.category,category,query);assert.equal(result.profiles.length,3);
  }
  const exact=recommendProfileExamples({category:'terminal-code',direction:'minimal'});
  assert.equal(exact.category,'terminal-code');
  assert.ok(exact.profiles.every(p=>p.categories.includes('terminal-code')));
  assert.throws(()=>recommendProfileExamples({category:'../../private'}),/category/);
  assert.throws(()=>recommendProfileExamples({limit:7}),/1–6/);
});

test('agent category and design tools share the index and direct the agent to actual read tools',async()=>{
  assert.deepEqual(await runAgentTool('gh_aura_profile_categories',{}),profileCategories());
  const result=await runAgentTool('gh_aura_design_recommend',{category:'terminal-code',query:'terminal sobrio',direction:'minimal'});
  assert.equal(result.examples.category,'terminal-code');assert.equal(result.examples.profiles.length,3);
  assert.match(result.examples.readNext,/gh_aura_whole_profile_inspect/);
  assert.match(result.examples.readNext,/gh_aura_pins_current/);
  assert.ok(result.techniques.every(t=>!t.thirdParty));
  assert.deepEqual((await runAgentTool('gh_aura_profiles_list',{category:'terminal-code',query:'terminal sobrio',limit:3})).profiles,result.examples.profiles);
});

test('brief includes references to inspect, without a corpus or approval ceremony',()=>{
  const brief=editorialBrief(snapshotForTest(),configForTest());
  assert.equal(brief.profileExamples.profiles.length,3);
  for(const key of ['researchGuidance','patternSuggestions','patternSelectionStatus','reference'])assert.equal(Object.hasOwn(brief,key),false);
  assert.ok(Buffer.byteLength(JSON.stringify(brief))<10000);
});

test('a long explicit visual request controls reference selection without losing its full intent',()=>{
  const config=configForTest(),visualBrief='terminal ASCII console minimal. '.repeat(25);
  const spec=makeProfileSpec({goal:'Research engineering and publications',direction:'minimal',visualBrief},config);
  const brief=editorialBrief(snapshotForTest(),config,{profileSpec:spec});
  assert.equal(brief.profileExamples.category,'terminal-code');
  assert.equal(brief.profileSpec.visualBrief,visualBrief);
  assert.ok(Buffer.byteLength(JSON.stringify(brief))<=12000);
});

test('reference reads preserve revision evidence and explicitly bound README excerpts without writes',async()=>{
  const originalFetch=globalThis.fetch,content='# Example\n'+ 'Public source. '.repeat(200),calls=[];let lowercase=false;
  globalThis.fetch=async(address,init={})=>{
    assert.equal(init.method||'GET','GET');
    const url=new URL(address);assert.equal(url.origin,'https://api.github.com');calls.push(url.pathname);
    if(url.pathname==='/users/example')return Response.json({login:'example',type:'User',bio:'Public biography'});
    if(url.pathname==='/repos/example/example')return Response.json({id:42,private:false,full_name:'example/example',default_branch:'main'});
    if(url.pathname==='/repos/example/example/git/ref/heads/main')return Response.json({object:{sha:'1'.repeat(40)}});
    if(url.pathname==='/repos/example/example/contents/README.md')return lowercase?Response.json({}, {status:404}):Response.json({type:'file',path:'README.md',sha:'2'.repeat(40),encoding:'base64',content:Buffer.from(content).toString('base64')});
    if(url.pathname==='/repos/example/example/readme'){
      assert.equal(init.headers?.Authorization,undefined);assert.equal(url.searchParams.get('ref'),'1'.repeat(40));
      return Response.json({type:'file',path:'readme.md',sha:'3'.repeat(40),encoding:'base64',content:Buffer.from(content).toString('base64')});
    }
    assert.fail('Unexpected reference request: '+url.pathname);
  };
  try{
    await assert.rejects(runAgentTool('gh_aura_whole_profile_inspect',{user:'example',readmeLimit:199}),/200–12000/);
    assert.equal(calls.length,0);
    const snapshot=await runAgentTool('gh_aura_whole_profile_inspect',{user:'example',readmeLimit:200});
    assert.equal(snapshot.readme.content,content.slice(0,200));
    assert.equal(snapshot.readme.truncated,true);assert.equal(snapshot.readme.fullLength,content.length);
    assert.equal(snapshot.readme.sha,'2'.repeat(40));assert.equal(snapshot.repository.head,'1'.repeat(40));
    assert.equal(calls.length,4);
    lowercase=true;calls.length=0;
    const lower=await runAgentTool('gh_aura_whole_profile_inspect',{user:'example',readmeLimit:200});
    assert.equal(lower.readme.state,'observed');assert.equal(lower.readme.path,'readme.md');
    assert.equal(lower.readme.content,content.slice(0,200));assert.equal(lower.readme.sha,'3'.repeat(40));
    assert.equal(calls.length,5);
  }finally{globalThis.fetch=originalFetch;}
});

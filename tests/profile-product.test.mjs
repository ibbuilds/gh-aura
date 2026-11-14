import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,readFileSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installAgentSkill,agentDoctor } from '../src/agent-install.mjs';
import { scanPublicProjects,inspectPublicProject,inspectCurrentPins } from '../src/profile-projects.mjs';
import { planCalendar,validateCalendarPlan } from '../src/calendar.mjs';
import { fastImportCalendar } from '../src/calendar-apply.mjs';
import { planBadgeCampaign,executeBadgeCampaign } from '../src/badge-campaign.mjs';
import { parseVisibleAchievements,observeVisibleAchievements } from '../src/achievement-observation.mjs';
import { getAgentToolDefinitions,runAgentTool } from '../src/agent-tools.mjs';
import { makeWholeProfileSpec } from '../src/profile-plan.mjs';

const temporary=async fn=>{const root=mkdtempSync(join(tmpdir(),'aura-product-'));try{await fn(root);}finally{rmSync(root,{recursive:true,force:true});}};
test('skills install into a discovered directory, preserve edits and are idempotent',()=>temporary(async root=>{
  const result=installAgentSkill({client:'codex',home:root});
  assert.equal(result.directory,join(root,'.agents','skills','gh-aura-profile'));assert.equal(result.hostConfigurationChanged,false);
  assert.equal(installAgentSkill({client:'codex',home:root}).changed,0);
  const path=join(result.directory,'SKILL.md');writeFileSync(path,'Local edits');
  assert.throws(()=>installAgentSkill({client:'codex',home:root}),/differs locally/);assert.equal(readFileSync(path,'utf8'),'Local edits');
  assert.equal(installAgentSkill({client:'codex',directory:join(root,'.agents','skills'),force:true}).changed,1);
  assert.equal(agentDoctor().skillPackaged,true);
}));
test('public project pagination exposes coverage and can discover a strong later-page candidate',async()=>{
  const calls=[];const fetch=async address=>{const u=new URL(address),page=Number(u.searchParams.get('page'));calls.push(page);
    return Response.json(page===1?Array.from({length:100},(_,i)=>({full_name:'example/a'+i,name:'a'+i,private:false,fork:false,description:'Unrelated project',size:1,topics:[]})):
      [{full_name:'example/z-backend',name:'z-backend',private:false,fork:false,description:'Backend systems',size:20,language:'Go',topics:['backend']}]);};
  const first=await scanPublicProjects('example',{fetch,token:'',goal:'backend',pages:1});
  assert.equal(first.coverage.complete,false);assert.equal(first.coverage.nextCursor,2);
  const later=await scanPublicProjects('example',{fetch,token:'',goal:'backend',cursor:first.coverage.nextCursor,pages:1});
  assert.equal(later.coverage.complete,true);assert.equal(later.candidates[0].repository,'example/z-backend');assert.deepEqual(calls,[1,2]);
});
test('a selected private project is rejected before content inspection and pins do not infer absence',async()=>{
  let calls=0;await assert.rejects(inspectPublicProject('example/private',{token:'fixture',fetch:async()=>{calls++;return Response.json({full_name:'example/private',private:true});}}),/Public project/);
  assert.equal(calls,1);assert.equal((await inspectCurrentPins('example',{token:''})).state,'unavailable');
});
test('daily calendar targets add only deficits and can append non-overlapping practice files',()=>{
  const history=new Map([['2022-01-01',2],['2022-01-02',0]]);
  const plan=planCalendar({from:'2022-01-01',to:'2022-01-02',dailyTargets:{'2022-01-01':4,'2022-01-02':1}},history);
  assert.deepEqual(plan.days.map(d=>d.count),[2,1]);assert.equal(validateCalendarPlan(plan).summary.syntheticCommits,3);
  assert.throws(()=>planCalendar({from:'2022-01-01',to:'2022-01-02',dailyTargets:{'2022-01-01':1}},history),/remove existing/);
  assert.throws(()=>planCalendar({year:'2022',dailyTargets:{'2023-01-01':1}}),/outside/);
  const changed=structuredClone(plan);changed.days[0].startIndex=3;
  assert.match(fastImportCalendar(changed,'Fixture','fixture@example.test').toString('utf8'),/practice\/2022\/01\/01-3\.md/);
});
const html=(content)=>'<h2><a href="/example?tab=achievements">Achievements</a></h2>'+content;
const badge=(tier='')=>'<a href="/example?achievement=pull-shark&amp;tab=achievements"><img alt="Achievement: Pull Shark"/>'+(tier?'<span class="achievement-tier-label--'+tier+'"></span>':'')+'</a>';
test('award observations reject README imitations and never send a GitHub token to public HTML',async()=>{
  assert.equal(parseVisibleAchievements(html(badge('gold')),'example').items[0].tier,'gold');
  assert.equal(parseVisibleAchievements('<article class="markdown-body">'+html(badge('gold'))+'</article>','example').state,'unknown');
  assert.equal(parseVisibleAchievements('<p>No public badges</p>','example').state,'unknown');
  const observed=await observeVisibleAchievements('example',{fetch:async(url,options)=>{assert.equal(url,'https://github.com/example');assert.equal(options.headers.Authorization,undefined);return new Response(html(badge()));}});
  assert.equal(observed.retainedHTML,false);assert.match(observed.evidenceSha256,/^[a-f\d]{64}$/);
});
test('a Gold campaign stops after the pilot when the actual award is not visible',async()=>{
  const plan=planBadgeCampaign({repo:'example/gh-aura-workspace',tier:'gold'}),batches=[];
  const result=await executeBadgeCampaign(plan,plan.fingerprint,{}, {applyBatch:async batch=>{batches.push(batch);return {events:'observed'};},observeAwards:async()=>({state:'unknown',items:[]})});
  assert.equal(plan.maxPulls,1024);assert.equal(result.state,'needs-award-verification');assert.equal(result.requiredTier,'base');
  assert.equal(batches.length,1);assert.equal(batches[0].pulls,2);
  await assert.rejects(executeBadgeCampaign(plan,'0'.repeat(64),{}, {applyBatch:async()=>assert.fail('unauthorized effect')}),/approval/);
});
test('an existing Pull Shark tier does not certify missing Quickdraw or YOLO campaign awards',async()=>{
  const plan=planBadgeCampaign({repo:'example/workspace',tier:'gold'});let applied=0;
  const report={items:[{id:'pull-shark',tier:'gold',state:'visible-award-observed'}],state:'visible-section-observed'};
  const result=await executeBadgeCampaign(plan,plan.fingerprint,{}, {observeAwards:async()=>report,applyBatch:async()=>{applied++;return {};}});
  assert.equal(applied,1);assert.equal(result.state,'needs-award-verification');assert.deepEqual(result.missingAwards,['yolo','quickdraw']);
  const resumed=await executeBadgeCampaign(plan,plan.fingerprint,result,{observeAwards:async()=>report,applyBatch:async()=>{throw Error('must not scale');}});
  assert.equal(resumed.state,'needs-award-verification');
});
test('a campaign with all requested awards already visible performs no exercise writes',async()=>{
  const plan=planBadgeCampaign({repo:'example/workspace',tier:'gold'});
  const report={state:'visible-section-observed',items:[{id:'pull-shark',tier:'gold',state:'visible-award-observed'},{id:'quickdraw',state:'visible-award-observed'},{id:'yolo',state:'visible-award-observed'}]};
  const result=await executeBadgeCampaign(plan,plan.fingerprint,{}, {observeAwards:async()=>report,applyBatch:async()=>assert.fail('unnecessary write')});
  assert.equal(result.state,'award-observed');assert.equal(result.nextBatch,0);
});
test('forged campaign progress cannot bypass earlier award milestones',async()=>{
  const plan=planBadgeCampaign({repo:'example/gh-aura-workspace',tier:'gold'});
  const result=await executeBadgeCampaign(plan,plan.fingerprint,{fingerprint:plan.fingerprint,nextBatch:4,state:'events-observed'},
    {applyBatch:async()=>assert.fail('a missing pilot award must stop writes'),observeAwards:async()=>({state:'unknown',items:[]})});
  assert.equal(result.state,'needs-award-verification');assert.equal(result.requiredTier,'base');
});
test('agent execution is absent by default and model arguments cannot select a grant',async()=>{
  assert.ok(getAgentToolDefinitions({}).every(x=>x.annotations.readOnlyHint));
  const env={GH_AURA_APPROVED_PLAN:'owner-selected.json',GH_AURA_APPROVED_FINGERPRINT:'a'.repeat(64)};
  assert.equal(getAgentToolDefinitions(env).find(x=>x.name==='gh_aura_apply_approved_profile').annotations.readOnlyHint,false);
  const spec=await runAgentTool('gh_aura_whole_profile_spec',{spec:{readme:false,account:{bio:'Backend'}}});
  assert.equal(makeWholeProfileSpec(spec).account.bio,'Backend');
  await assert.rejects(runAgentTool('gh_aura_apply_approved_profile',{plan:{}}),/unauthorized|Unexpected/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { planCollaborationCampaign,validateCollaborationCampaign,executeCollaborationCampaign } from '../src/badge-collaboration-campaign.mjs';
import { compileWorkspaceActions,validateWorkspaceActions } from '../src/workspace-actions.mjs';
import { AGENT_TOOL_DEFINITIONS,runAgentTool } from '../src/agent-tools.mjs';

const intent=(kind='coauthor',tier='base',count=1)=>({repo:'owner/workspace',kind,tier,collaborator:'helper',consent:true,
  exercises:Array.from({length:count},(_,i)=>kind==='coauthor'?{content:'# Exact reviewed exercise '+i}:{question:'Reviewed question '+i,answer:'Reviewed answer '+i})});
const report=(id,tier=null)=>({state:'visible-section-observed',items:id?[{id,tier,state:'visible-award-observed'}]:[]});

test('two-account campaigns bind each distinct exercise, tier, identity and account write limits',()=>{
  for(const [kind,tier,count] of [['coauthor','gold',48],['discussion-answer','gold',32]]){
    const plan=planCollaborationCampaign(intent(kind,tier,count));assert.equal(validateCollaborationCampaign(plan),plan);assert.equal(plan.steps.length,count);
    assert.equal(plan.milestones.at(-1).afterExercise,count);assert.ok(plan.budget.primaryWrites>0);assert.equal(plan.requirements.secondary.login,'helper');
    const changed=structuredClone(plan);changed.steps[0].repo='owner/elsewhere';assert.throws(()=>validateCollaborationCampaign(changed),/changed/);
  }
  assert.throws(()=>planCollaborationCampaign(intent('discussion-answer','base',1)),/exactly 2/);
  const duplicate=intent('coauthor','bronze',10);duplicate.exercises.fill({content:'Same'});assert.throws(()=>planCollaborationCampaign(duplicate),/distinct/);
  const invalid=intent();invalid.exercises[0].token='secret';assert.throws(()=>planCollaborationCampaign(invalid),/fields/);
});

test('whole-profile and MCP read-only planning expose the same two-account campaign contract',async()=>{
  const spec=intent('discussion-answer','base',2),actions=compileWorkspaceActions('owner',{badges:{...spec,mode:'collaboration-campaign'}});
  validateWorkspaceActions('owner',actions);assert.equal(actions.badges.plan.award,'galaxy-brain');
  const tool=AGENT_TOOL_DEFINITIONS.find(t=>t.name==='gh_aura_badges_collaboration_campaign');assert.equal(tool.annotations.readOnlyHint,true);
  assert.equal((await runAgentTool(tool.name,spec)).fingerprint,actions.badges.plan.fingerprint);
});

test('an unknown actual award stops a campaign at base and the same approval resumes after observation',async()=>{
  const plan=planCollaborationCampaign(intent('coauthor','bronze',10)),done=[];let state,visible=report();
  const options={observeAwards:async()=>visible,onState:value=>{state=value;},sleep:async()=>{},applyExercise:async step=>{done.push(step.fingerprint);return {state:'events-observed'};}};
  state=await executeCollaborationCampaign(plan,plan.fingerprint,{},options);assert.equal(state.state,'needs-award-verification');assert.equal(state.requiredTier,'base');assert.equal(done.length,1);
  visible=report('pair-extraordinaire');state=await executeCollaborationCampaign(plan,plan.fingerprint,state,options);assert.equal(done.length,10);assert.equal(state.requiredTier,'bronze');
  visible=report('pair-extraordinaire','bronze');state=await executeCollaborationCampaign(plan,plan.fingerprint,state,options);assert.equal(state.state,'award-observed');assert.equal(done.length,10);
});

test('a claimed later cursor cannot bypass an unobserved previous tier; a visible final award requires no writes',async()=>{
  const plan=planCollaborationCampaign(intent('coauthor','gold',48));let applied=0;
  const options={observeAwards:async()=>report(),applyExercise:async()=>{applied++;return {state:'events-observed'};}};
  const first=await executeCollaborationCampaign(plan,plan.fingerprint,{nextExercise:24},options);assert.equal(first.requiredTier,'base');assert.equal(applied,0);
  const final=await executeCollaborationCampaign(plan,plan.fingerprint,{}, {...options,observeAwards:async()=>report('pair-extraordinaire','gold')});assert.equal(final.state,'award-observed');assert.equal(applied,0);
  await assert.rejects(executeCollaborationCampaign(plan,'wrong',{},options),/approval/);
});

test('write reservations persist before each effect and exhaustion stops further writes across resumes',async()=>{
  const plan=planCollaborationCampaign(intent());let state,effects=0;
  const options={observeAwards:async()=>report(),onState:value=>{state=value;},reserveWrite:async()=>{},applyExercise:async(step,execution)=>{
    for(let i=0;i<5;i++){await execution.reserveWrite('owner',1);assert.equal(state.writeReservations.primary,effects+1);effects++;}throw Error('lost response');
  }};
  await assert.rejects(executeCollaborationCampaign(plan,plan.fingerprint,{},options),/lost response/);assert.equal(state.state,'unknown');assert.equal(effects,5);
  await assert.rejects(executeCollaborationCampaign(plan,plan.fingerprint,state,options),/write budget/);assert.equal(effects,8);assert.equal(state.writeReservations.primary,8);
  await assert.rejects(executeCollaborationCampaign(plan,plan.fingerprint,state,{...options,applyExercise:async(step,execution)=>{await execution.reserveWrite('intruder',1);}}),/write budget/);assert.equal(effects,8);
});

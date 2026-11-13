import test from 'node:test';
import assert from 'node:assert/strict';
import { planCalendar } from '../src/calendar.mjs';
import { calendarPracticeFiles } from '../src/calendar-apply.mjs';
import { preflightWorkspaceActions,executeWorkspaceActions,prepareWorkspaceActions } from '../src/workspace-actions.mjs';
import { WORKSPACE_README } from '../src/workspace.mjs';
function fixture(){
  const calendar=planCalendar({from:'2022-01-01',to:'2022-01-02',dailyTargets:{'2022-01-01':2,'2022-01-02':1}},new Map([['2022-01-01',1],['2022-01-02',0]]));
  const plan={username:'owner',activity:{repo:'owner/workspace',plan:calendar},badges:null};
  const state={tree:calendarPracticeFiles(calendar).map(f=>({path:f.path,sha:f.sha,mode:'100644',type:'blob'})),count1:2,count2:1,writes:0};
  const fetch=async(url,init={})=>{
    const path=new URL(url).pathname;
    if(path==='/graphql'){
      assert.match(JSON.parse(init.body).query,/^query/);
      return Response.json({data:{user:{contributionsCollection:{contributionCalendar:{weeks:[{contributionDays:[{date:'2022-01-01',contributionCount:state.count1},{date:'2022-01-02',contributionCount:state.count2}]}]}}}}});
    }
    if(init.method&&init.method!=='GET')state.writes++;
    if(path==='/repos/owner/workspace')return Response.json({private:true,full_name:'owner/workspace',default_branch:'main'});
    if(path.includes('/contents/README.md'))return Response.json({type:'file',encoding:'base64',content:Buffer.from(WORKSPACE_README).toString('base64')});
    if(path.includes('/git/trees/'))return Response.json({tree:state.tree,truncated:false});
    throw Error('Unexpected endpoint '+path);
  };
  return {plan,state,options:{fetch,token:'fixture',authorName:'Owner',authorEmail:'1+owner@users.noreply.github.com'},identity:{id:1,login:'owner',created_at:'2020-01-01T00:00:00Z'}};
}
test('uncertain calendar push reconciles exact remote files and observed graph without another write',async()=>{
  const f=fixture(),preflight=await preflightWorkspaceActions(f.plan,f.identity,f.options);
  assert.equal(preflight.calendarPublished,true);
  const state={operations:{activity:{state:'unknown'}}};
  const result=await executeWorkspaceActions(f.plan,state,()=>{},{...f.options,workspacePreflight:preflight});
  assert.equal(result.pending,false);assert.equal(state.operations.activity.state,'graph-targets-observed');assert.equal(f.state.writes,0);
});
test('partial files, conflicting content and an already changed baseline block calendar effects',async()=>{
  for(const change of [s=>s.tree.pop(),s=>s.tree[0].sha='f'.repeat(40),s=>s.tree=[]]){
    const f=fixture();change(f.state);await assert.rejects(preflightWorkspaceActions(f.plan,f.identity,f.options),/conflict|baseline/);assert.equal(f.state.writes,0);
  }
});
test('calendar author validation happens before profile or workspace mutation',async()=>{
  const f=fixture();await assert.rejects(preflightWorkspaceActions(f.plan,f.identity,{...f.options,authorName:'Owner <private@example.test>'}),/author-name/);assert.equal(f.state.writes,0);
});
test('preparing daily targets reads existing contributions and computes only deficits',async()=>{
  const f=fixture();f.state.tree=[];f.state.count1=1;f.state.count2=0;
  const result=await prepareWorkspaceActions('owner',{activity:{repo:'owner/workspace',from:'2022-01-01',to:'2022-01-02',dailyTargets:{'2022-01-01':2,'2022-01-02':1}}},f.options);
  assert.deepEqual(result.activity.plan.days.map(d=>d.count),[1,1]);assert.equal(result.activity.plan.settings.expectedCounts['2022-01-01'],2);assert.equal(f.state.writes,0);
});

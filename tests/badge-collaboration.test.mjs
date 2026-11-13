import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { planBadgeCollaboration,executeBadgeCollaboration } from '../src/badge-collaboration.mjs';
import { WORKSPACE_README } from '../src/workspace.mjs';
import { planCollaborationCampaign,executeCollaborationCampaign } from '../src/badge-collaboration-campaign.mjs';
import { compileWorkspaceActions,preflightWorkspaceActions,executeWorkspaceActions } from '../src/workspace-actions.mjs';

const oid=x=>createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
function fixture(){
  const base='/repos/owner/workspace',state={owner:'owner',secondary:'helper',private:true,push:true,writes:[],refs:new Map([['main','1'.repeat(40)]]),
    commits:new Map([['1'.repeat(40),{tree:{sha:'2'.repeat(40)}}]]),trees:new Map([['2'.repeat(40),{}]]),blobs:new Map(),prs:[],discussions:[],comments:[],answers:new Map(),chosen:null,lose:null};
  const result=(data,status=200)=>Response.json(data,{status});
  const fetch=async(url,init={})=>{
    assert.equal(new URL(url).origin,'https://api.github.com');
    const u=new URL(url),p=decodeURIComponent(u.pathname),method=init.method||'GET',b=init.body?JSON.parse(init.body):null;
    const actor=init.headers.Authorization==='Bearer secondary'?state.secondary:state.owner;
    if(p==='/user')return result({login:actor,id:actor==='helper'?2:1});
    if(p==='/user/emails')return result([{email:'helper@example.test',verified:true}]);
    if(p===base)return result({full_name:'owner/workspace',private:state.private,default_branch:'main',permissions:{push:state.push}});
    if(p===base+'/contents/README.md')return result({type:'file',encoding:'base64',content:Buffer.from(WORKSPACE_README).toString('base64')});
    if(p==='/graphql'&&b.query.startsWith('query')){
      if(b.query.includes('discussionCategories'))return result({data:{repository:{id:'R',isPrivate:state.private,discussionCategories:{nodes:[{id:'Q',isAnswerable:true}],pageInfo:{hasNextPage:false}}}}});
      if(b.query.includes('discussions(first'))return result({data:{repository:{discussions:{nodes:state.discussions,pageInfo:{hasNextPage:false}}}}});
      if(b.query.includes('comments(first')){const chosen=state.chosen||state.answers.get(b.variables.id);return result({data:{node:{answer:chosen?{id:chosen}:null,comments:{nodes:state.comments.filter(c=>c.discussionId===b.variables.id),pageInfo:{hasNextPage:false}}}}});}
      if(b.query.includes('DiscussionComment')){const c=state.comments.find(x=>x.id===b.variables.id);return result({data:{node:c?{...c,isAnswer:state.answers.get(c.discussionId)===c.id,viewerCanMarkAsAnswer:true,discussion:{id:c.discussionId}}:null}});}
      const chosen=state.chosen||state.answers.get(b.variables.id);return result({data:{node:{answer:chosen?{id:chosen}:null}}});
    }
    if(method!=='GET'){
      state.writes.push({p,method,b,actor});
      if(p==='/graphql'){
        let data;
        if(b.query.includes('createDiscussion(')){const d={id:'D'+(state.discussions.length||''),body:b.variables.input.body,author:{login:actor}};state.discussions.push(d);data={createDiscussion:{discussion:d}};}
        else if(b.query.includes('addDiscussionComment(')){const c={id:'C'+(state.comments.length||''),body:b.variables.input.body,discussionId:b.variables.input.discussionId,author:{login:actor}};state.comments.push(c);data={addDiscussionComment:{comment:c}};}
        else {const c=state.comments.find(c=>c.id===b.variables.input.id);state.answers.set(c.discussionId,c.id);data={markDiscussionCommentAsAnswer:{discussion:{id:c.discussionId,answer:{id:c.id}}}};}
        if(state.lose==='graphql'){state.lose=null;throw Error('lost');}return result({data});
      }
      if(p.endsWith('/git/blobs')){const sha=oid(b.content);state.blobs.set(sha,b.content);return result({sha});}
      if(p.endsWith('/git/trees')){const tree={...state.trees.get(b.base_tree),[b.tree[0].path]:b.tree[0].sha},sha=oid(JSON.stringify(tree));state.trees.set(sha,tree);return result({sha});}
      if(p.endsWith('/git/commits')){const sha=oid(JSON.stringify(b));state.commits.set(sha,{...b,tree:{sha:b.tree},parents:b.parents.map(sha=>({sha}))});return result({sha});}
      if(p.endsWith('/git/refs')){const name=b.ref.slice(11);if(state.refs.has(name))return result({},422);state.refs.set(name,b.sha);return result({object:{sha:b.sha}});}
      if(p.endsWith('/pulls')){const pr={number:1,body:b.body,state:'open',merged_at:null,head:{sha:state.refs.get(b.head),repo:{full_name:'owner/workspace'}},base:{ref:'main',repo:{full_name:'owner/workspace'}}};state.prs.push(pr);return result(pr);}
      if(p.endsWith('/merge')){const pr=state.prs[0];assert.equal(b.sha,pr.head.sha);pr.merged_at=new Date().toISOString();pr.state='closed';state.refs.set('main',pr.head.sha);if(state.lose==='merge'){state.lose=null;throw Error('lost');}return result({merged:true});}
    }
    if(p===base+'/pulls')return result(state.prs);
    if(p===base+'/pulls/1')return result(state.prs[0]);
    if(p.startsWith(base+'/git/ref/heads/')){const sha=state.refs.get(p.slice((base+'/git/ref/heads/').length));return sha?result({object:{sha}}):result({},404);}
    if(p.startsWith(base+'/git/commits/'))return result(state.commits.get(p.split('/').at(-1)));
    if(p.startsWith(base+'/contents/')){const ref=u.searchParams.get('ref'),sha=state.refs.get(ref)||ref,tree=state.trees.get(state.commits.get(sha)?.tree.sha),path=p.slice((base+'/contents/').length),blob=tree?.[path];return blob?result({sha:blob,encoding:'base64',content:Buffer.from(state.blobs.get(blob)).toString('base64')}):result({},404);}
    if(p.startsWith(base+'/compare/')){const [before,after]=p.split('/').at(-1).split('...'),a=state.trees.get(state.commits.get(before).tree.sha),z=state.trees.get(state.commits.get(after).tree.sha);return result({files:Object.keys(z).filter(k=>a[k]!==z[k]).map(filename=>({filename,status:'added'}))});}
    throw Error('Unexpected fixture endpoint '+method+' '+p);
  };
  return {state,options:{fetch,token:'primary',collaboratorToken:'secondary',collaboratorName:'Helper',collaboratorEmail:'2+helper@users.noreply.github.com',sleep:async()=>{},reserveWrite:async()=>({})}};
}
const coauthor=()=>planBadgeCollaboration({repo:'owner/workspace',collaborator:'helper',consent:true,content:'# Reviewed collaboration\n\nDocument a testable interface.'});
const discussion=()=>planBadgeCollaboration({repo:'owner/workspace',collaborator:'helper',consent:true,kind:'discussion-answer',question:'How does this exercise work?',answer:'The sandbox explicitly labels generated practice.'});

test('two-account coauthor events bind exact contents, verified identity and private target, then replay without writes',async()=>{
  const f=fixture(),plan=coauthor();
  const first=await executeBadgeCollaboration(plan,plan.fingerprint,f.options);
  assert.equal(first.state,'events-observed');assert.equal(first.awards,'unverified');
  const commit=f.state.writes.find(x=>x.p.endsWith('/git/commits')).b;
  assert.match(commit.message,/\n\nCo-authored-by: Helper <2\+helper@users.noreply.github.com>$/);
  assert.equal(f.state.writes.filter(x=>x.p.endsWith('/merge')).length,1);
  const count=f.state.writes.length;await executeBadgeCollaboration(plan,plan.fingerprint,f.options);assert.equal(f.state.writes.length,count);
});
test('a lost coauthor merge response is reconciled, including a deleted source branch',async()=>{
  const f=fixture(),plan=coauthor();f.state.lose='merge';
  await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,f.options),/unknown/);
  for(const key of f.state.refs.keys())if(key!=='main')f.state.refs.delete(key);
  const count=f.state.writes.length;await executeBadgeCollaboration(plan,plan.fingerprint,f.options);assert.equal(f.state.writes.length,count);
});
test('wrong second identity, same account, read-only collaborator, public workspace and missing consent cause zero writes',async()=>{
  for(const change of [s=>s.secondary='other',s=>s.secondary='owner',s=>s.push=false,s=>s.private=false]){
    const f=fixture(),plan=coauthor();change(f.state);await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,f.options));assert.equal(f.state.writes.length,0);
  }
  assert.throws(()=>planBadgeCollaboration({repo:'owner/workspace',collaborator:'helper',content:'x'}),/consent/);
});
test('an invalid coauthor identity is rejected before creating any Git objects or public changes',async()=>{
  const f=fixture(),plan=coauthor();
  await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,{...f.options,collaboratorName:'Helper\u0000Injected'}),/collaborator name/);
  assert.equal(f.state.writes.length,0);
});
test('discussion exercise uses the reviewed second account to ask and accept the primary answer; replay creates no duplicates',async()=>{
  const f=fixture(),plan=discussion();await executeBadgeCollaboration(plan,plan.fingerprint,f.options);
  assert.deepEqual(f.state.writes.map(x=>x.actor),['helper','owner','helper']);
  const count=f.state.writes.length;await executeBadgeCollaboration(plan,plan.fingerprint,f.options);assert.equal(f.state.writes.length,count);
});
test('a lost Discussion creation result is found by its exact marker, without duplicating it',async()=>{
  const f=fixture(),plan=discussion();f.state.lose='graphql';await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,f.options),/unknown|reached/);
  await executeBadgeCollaboration(plan,plan.fingerprint,f.options);assert.equal(f.state.discussions.length,1);assert.equal(f.state.comments.length,1);
});
test('a conflicting Discussion or chosen answer is never overwritten',async()=>{
  const f=fixture(),plan=discussion();f.state.discussions=[{id:'D',body:'forged GH-AURA-'+plan.fingerprint,author:{login:'helper'}}];
  await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,f.options),/conflicts/);assert.equal(f.state.writes.length,0);
  const g=fixture();g.state.chosen='other-answer';await assert.rejects(executeBadgeCollaboration(plan,plan.fingerprint,g.options),/will not be replaced/);assert.equal(g.state.comments.length,0);
});

test('a whole-profile campaign executes two distinct reviewed Q&A exercises, then waits for the actual award',async()=>{
  const f=fixture(),intent={repo:'owner/workspace',mode:'collaboration-campaign',kind:'discussion-answer',collaborator:'helper',consent:true,
    exercises:[{question:'How are UTC dates represented?',answer:'Use an explicit UTC date and state synthetic additions.'},{question:'What does a retry verify?',answer:'Read the exact remote marker and answer before creating anything.'}]};
  const plan={username:'owner',...compileWorkspaceActions('owner',{badges:intent})},state={operations:{}};
  await preflightWorkspaceActions(plan,{login:'owner'},f.options);assert.equal(f.state.writes.length,0);
  const options={...f.options,observeAwards:async()=>({items:[]})},first=await executeWorkspaceActions(plan,state,()=>{},options);
  assert.equal(first.pending,true);assert.equal(state.operations.badges.nextExercise,2);assert.equal(state.operations.badges.state,'needs-award-verification');
  assert.equal(f.state.discussions.length,2);assert.equal(f.state.comments.length,2);assert.equal(f.state.answers.size,2);
  assert.deepEqual(f.state.writes.map(x=>x.actor),['helper','owner','helper','helper','owner','helper']);
  assert.deepEqual(state.operations.badges.writeReservations,{primary:2,secondary:4});
  const count=f.state.writes.length;await executeWorkspaceActions(plan,state,()=>{},options);assert.equal(f.state.writes.length,count);
  const final=await executeWorkspaceActions(plan,state,()=>{},{...options,observeAwards:async()=>({items:[{id:'galaxy-brain',tier:null,state:'visible-award-observed'}]})});
  assert.equal(final.pending,false);assert.equal(state.operations.badges.state,'award-observed');assert.equal(f.state.writes.length,count);
});

test('a lost first Discussion response resumes the same campaign without duplicate questions or lost reservations',async()=>{
  const f=fixture(),plan=planCollaborationCampaign({repo:'owner/workspace',kind:'discussion-answer',collaborator:'helper',consent:true,
    exercises:[{question:'Reviewed first question',answer:'Reviewed first answer'},{question:'Reviewed second question',answer:'Reviewed second answer'}]});
  let state;const options={...f.options,observeAwards:async()=>({items:[]}),onState:value=>{state=value;}};
  f.state.lose='graphql';await assert.rejects(executeCollaborationCampaign(plan,plan.fingerprint,{},options),/unknown|reached/);
  assert.equal(state.nextExercise,0);assert.equal(state.writeReservations.secondary,1);
  const result=await executeCollaborationCampaign(plan,plan.fingerprint,state,options);
  assert.equal(result.state,'needs-award-verification');assert.equal(f.state.discussions.length,2);assert.equal(f.state.comments.length,2);
  assert.deepEqual(result.writeReservations,{primary:2,secondary:4});assert.equal(f.state.writes.length,6);
});

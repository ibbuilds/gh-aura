import { getJSON, decodeReadme, validateLogin } from './github.mjs';
import { managedWorkspaceReadme } from './workspace.mjs';
import { planCalendar, validateCalendarPlan,calendarDigest } from './calendar.mjs';
import { applyCalendar, verifyAuthorEmail, calendarPracticeFiles,validCalendarIdentity } from './calendar-apply.mjs';
import { planBadgeRun, validateBadgePlan, applyBadgeRun, inspectBadgeWorkspace } from './badge-run.mjs';
import { planBadgeCampaign, validateBadgeCampaign, executeBadgeCampaign } from './badge-campaign.mjs';
import { readContributionWindows } from './contributions.mjs';
import { planBadgeCollaboration,validateBadgeCollaboration,preflightBadgeCollaboration,executeBadgeCollaboration } from './badge-collaboration.mjs';
import { observeVisibleAchievements } from './achievement-observation.mjs';
import { planCollaborationCampaign,validateCollaborationCampaign,executeCollaborationCampaign } from './badge-collaboration-campaign.mjs';

function workspace(value,user){
  const name=value||user+'/gh-aura-workspace';
  if(typeof name!=='string'||!/^[-a-z\d]{1,39}\/[a-z\d_.-]{1,100}$/i.test(name)||name.split('/')[0].toLowerCase()!==user.toLowerCase())throw Error('Workspace must belong to the reviewed profile owner.');
  return name;
}
const allowed=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))throw Error('Unknown workspace intent fields.');};
export function compileWorkspaceActions(user,{activity,badges}){
  validateLogin(user);let a=null,b=null;
  if(activity){allowed(activity,['repo','year','from','to','density','growth','weekends','intensity','seed','mode','role','dailyTargets','observedCounts']);
    const {repo,observedCounts,...settings}=activity;
    const history=observedCounts?new Map(Object.entries(observedCounts)):null;
    a={repo:workspace(repo,user),plan:planCalendar(settings,history)};
  }
  if(badges){allowed(badges,['repo','mode','tier','strategy','role','quickdraw','pulls','start','kind','collaborator','consent','content','question','answer','exercises']);
    const repo=workspace(badges.repo,user),mode=badges.mode||'events';
    if(!['events','campaign','collaboration','collaboration-campaign'].includes(mode))throw Error('Use events, campaign, collaboration or collaboration-campaign for the reviewed badge workspace.');
    if(mode==='collaboration-campaign')allowed(badges,['repo','mode','tier','kind','collaborator','consent','exercises']);
    b={repo,mode,plan:mode==='collaboration-campaign'?planCollaborationCampaign({...badges,repo}):mode==='campaign'?planBadgeCampaign({...badges,repo}):mode==='collaboration'?planBadgeCollaboration({...badges,repo}):planBadgeRun({...badges,repo})};
  }
  if(a&&b&&a.repo.toLowerCase()!==b.repo.toLowerCase())throw Error('Activity and Badges must share the same reviewed private workspace.');
  if(a&&b&&a.plan.days.some(d=>d.date===new Date().toISOString().slice(0,10)))throw Error('Badge exercises also affect today. Run badges first, then observe and plan today’s calendar target; historical dates can share one plan.');
  return {activity:a,badges:b};
}
export async function prepareWorkspaceActions(user,intent,options={}){
  let prepared=intent;
  if(intent.activity&&!intent.activity.observedCounts){
    // Validate intent before reads, but do not enforce the *new commit* cap on
    // a fictitious zero baseline. Existing contributions may make this a no-op.
    compileWorkspaceActions(user,{...intent,activity:null});
    allowed(intent.activity,['repo','year','from','to','density','growth','weekends','intensity','seed','mode','role','dailyTargets','observedCounts']);
    workspace(intent.activity.repo,user);
    const range=planCalendar({...intent.activity,density:0,dailyTargets:{}});
    const days=await observeCalendarDays(user,range.settings,options);
    prepared={...intent,activity:{...intent.activity,observedCounts:Object.fromEntries(days)}};
  }
  const actions=compileWorkspaceActions(user,prepared);
  const activity=actions.activity;
  if(activity?.plan.days.length){
    const base='/repos/'+activity.repo.split('/').map(encodeURIComponent).join('/'),api={...options,cache:undefined,publicRead:false};
    const repo=await getJSON(base,api);
    if(!repo&&(Object.hasOwn(activity.plan.settings.dailyTargets||{},new Date().toISOString().slice(0,10))||activity.plan.days.some(d=>d.date===new Date().toISOString().slice(0,10))))
      throw Error('Initialize the private workspace before observing and planning today’s exact target; repository creation can also affect today’s graph.');
    if(repo){
      if(repo.private!==true||repo.full_name?.toLowerCase()!==activity.repo.toLowerCase()||repo.fork||repo.archived)throw Error('Calendar workspace must be owned, private and active.');
      const readme=await getJSON(base+'/contents/README.md?ref='+encodeURIComponent(repo.default_branch),api);
      if(!readme||!managedWorkspaceReadme(decodeReadme(readme)))throw Error('Calendar workspace marker is missing.');
      const tree=await getJSON(base+'/git/trees/'+encodeURIComponent(repo.default_branch)+'?recursive=1',api);
      if(!Array.isArray(tree?.tree)||tree.truncated!==false)throw Error('Complete workspace tree is needed to plan non-overlapping calendar files.');
      const highest=new Map();
      for(const file of tree.tree){const m=/^practice\/(\d{4})\/(\d{2})\/(\d{2})-(\d+)\.md$/.exec(file.path||'');if(m){const date=m[1]+'-'+m[2]+'-'+m[3];highest.set(date,Math.max(highest.get(date)||0,Number(m[4])));}}
      activity.plan.days=activity.plan.days.map(day=>highest.has(day.date)?{...day,startIndex:highest.get(day.date)+1}:day);
      activity.plan.fingerprint=calendarDigest(activity.plan);validateCalendarPlan(activity.plan);
    }
  }
  return actions;
}
export function validateWorkspaceActions(user,{activity,badges}){
  if(activity){allowed(activity,['repo','plan']);workspace(activity.repo,user);validateCalendarPlan(activity.plan);}
  if(badges){allowed(badges,['repo','mode','plan']);workspace(badges.repo,user);
    if(badges.mode==='collaboration-campaign')validateCollaborationCampaign(badges.plan);else if(badges.mode==='campaign')validateBadgeCampaign(badges.plan);else if(badges.mode==='collaboration')validateBadgeCollaboration(badges.plan);else if(badges.mode==='events')validateBadgePlan(badges.plan);else throw Error('Unknown badge execution mode.');
    if(badges.plan.repo.toLowerCase()!==badges.repo.toLowerCase())throw Error('Badge workspace differs from the reviewed target.');
  }
  if(activity&&badges&&activity.repo.toLowerCase()!==badges.repo.toLowerCase())throw Error('Workspace targets differ.');
}
export async function preflightWorkspaceActions(plan,identity,options={}){
  validateWorkspaceActions(plan.username,plan);
  if(!plan.activity&&!plan.badges)return {};
  let calendarPublished=false;
  if(plan.badges?.mode==='collaboration')await preflightBadgeCollaboration(plan.badges.plan,options);
  if(plan.badges?.mode==='collaboration-campaign')await preflightBadgeCollaboration(plan.badges.plan.steps[0],options);
  const name=plan.activity?.repo||plan.badges.repo,base='/repos/'+name.split('/').map(encodeURIComponent).join('/');
  const repo=await getJSON(base,{...options,cache:undefined,publicRead:false});
  if(!repo&&plan.activity?.plan.days.length&&(Object.hasOwn(plan.activity.plan.settings.dailyTargets||{},new Date().toISOString().slice(0,10))||plan.activity.plan.days.some(d=>d.date===new Date().toISOString().slice(0,10))))
    throw Error('Initialize the private workspace before planning today’s exact target.');
  if(repo){
    if(repo.private!==true||repo.archived===true||repo.fork===true||repo.full_name?.toLowerCase()!==name.toLowerCase())throw Error('Workspace is not the reviewed active private repository.');
    const readme=await getJSON(base+'/contents/README.md?ref='+encodeURIComponent(repo.default_branch),{...options,cache:undefined,publicRead:false});
    if(!readme||readme.type!=='file'||!managedWorkspaceReadme(decodeReadme(readme)))throw Error('Private workspace marker is missing.');
    if(plan.activity?.plan.days.length){
      const tree=await getJSON(base+'/git/trees/'+encodeURIComponent(repo.default_branch)+'?recursive=1',{...options,cache:undefined,publicRead:false});
      if(!Array.isArray(tree?.tree)||tree.truncated!==false)throw Error('Complete private tree is required to reconcile calendar publication.');
      const files=new Map(tree.tree.map(f=>[f.path,f])),expected=calendarPracticeFiles(plan.activity.plan);
      const present=expected.filter(f=>files.has(f.path));
      if(present.length){
        if(present.length!==expected.length||expected.some(f=>files.get(f.path).sha!==f.sha||files.get(f.path).type!=='blob'||files.get(f.path).mode!=='100644'))
          throw Error('Calendar paths conflict or publication is incomplete; inspect before changing the plan.');
        calendarPublished=true;
      }
    }
  }
  if(plan.activity?.plan.summary.syntheticCommits){
    const name=options.authorName||process.env.GH_AURA_AUTHOR_NAME,email=options.authorEmail||process.env.GH_AURA_AUTHOR_EMAIL;
    if(!name||!email)throw Error('Configure the verified calendar author locally using GH_AURA_AUTHOR_NAME and GH_AURA_AUTHOR_EMAIL. Do not send email credentials to a model.');
    validCalendarIdentity(name,email);
    await verifyAuthorEmail(email,identity,options);
    if(!Number.isFinite(Date.parse(identity.created_at||''))||Date.parse(plan.activity.plan.settings.from+'T00:00:00Z')<Date.parse(identity.created_at)-86400000)
      throw Error('Activity range precedes the authenticated account or account age is unknown.');
    const settings=plan.activity.plan.settings;
    if(settings.expectedCounts&&!calendarPublished){
      const current=await observeCalendarDays(plan.username,settings,options),added=new Map(plan.activity.plan.days.map(d=>[d.date,d.count]));
      const totals=settings.dailyTargets||settings.expectedCounts;
      for(const [date,target] of Object.entries(totals))if(current.get(date)!==target-(added.get(date)||0))
        throw Error('Contribution baseline changed or is unavailable for '+date+'; observe and prepare a new calendar plan.');
    }
  }
  return {calendarPublished};
}
async function observeCalendarDays(user,settings,options){
  const from=Number(settings.from.slice(0,4)),to=Number(settings.to.slice(0,4));
  const windows=[];
  for(let year=from;year<=to;year++)windows.push({year,from:Math.max(Date.parse(settings.from+'T00:00:00Z'),Date.parse(year+'-01-01T00:00:00Z')),
    to:Math.min(Date.parse(settings.to+'T23:59:59Z'),Date.parse(year+'-12-31T23:59:59Z'))});
  const observed=await readContributionWindows(user,windows.map(x=>({...x,from:new Date(x.from).toISOString(),to:new Date(x.to).toISOString()})),options);
  return new Map(observed.flatMap(x=>x.collection.contributionCalendar?.weeks?.flatMap(w=>w.contributionDays?.map(d=>[d.date,d.contributionCount])||[])||[]));
}
export async function verifyWorkspaceCalendar(user,action,options={}){
  const settings=action.plan.settings,days=await observeCalendarDays(user,settings,options);
  const targets=settings.dailyTargets||settings.expectedCounts;
  if(!targets)return {state:'attribution-unknown',reason:'This legacy plan has no observed baseline. Read the graph and prepare a new plan to verify totals.'};
  const differences=Object.entries(targets).map(([date,target])=>({date,target,observed:days.has(date)?days.get(date):null})).filter(x=>x.observed!==x.target);
  return {state:differences.length?'awaiting-attribution-or-target-differs':'graph-targets-observed',differences,
    caveat:'Graph observations depend on GitHub processing, reader visibility and other contributions. They do not certify professional experience.'};
}
export async function executeWorkspaceActions(plan,state,save,options={}){
  if(plan.badges){
    const action=plan.badges;
    if(action.mode==='collaboration-campaign'){
      state.operations.badges=await executeCollaborationCampaign(action.plan,action.plan.fingerprint,state.operations.badges||{},
        {...options,onState:progress=>{state.operations.badges=structuredClone(progress);save();}});save();
      if(state.operations.badges.state!=='award-observed')return {pending:true};
    }else if(action.mode==='collaboration'){
      state.operations.badges=await executeBadgeCollaboration(action.plan,action.plan.fingerprint,options);save();
    }else if(action.mode==='campaign'){
      state.operations.badges=await executeBadgeCampaign(action.plan,action.plan.fingerprint,state.operations.badges||{},
        {...options,onState:progress=>{state.operations.badges=structuredClone(progress);save();}});save();
      if(state.operations.badges.state!=='award-observed')return {pending:true};
    }else if(state.operations.badges?.state!=='events-observed'){
      if(state.operations.badges?.state==='unknown'){
        const observed=await inspectBadgeWorkspace({...options,repo:action.repo}),indices=new Set(observed.events?.mergedPullRequests?.map(x=>x.index));
        if(!observed.observed?.pullsComplete||Array.from({length:action.plan.pulls},(_,i)=>action.plan.start+i+1).some(i=>!indices.has(i))||
          action.plan.quickdraw&&!observed.observed?.quickdrawTimingCandidates)throw Error('Badge events remain uncertain; inspect before retrying.');
        state.operations.badges={state:'events-observed',awards:'unknown'};save();
      }else{
        state.operations.badges={state:'unknown'};save();
        const result=await applyBadgeRun(action.plan,{...options,confirm:action.plan.fingerprint});
        state.operations.badges={state:'events-observed',result,awards:'unknown'};save();
      }
    }
  }
  if(plan.activity){
    const action=plan.activity;
    if(options.workspacePreflight?.calendarPublished)state.operations.activity={state:'pushed-awaiting-graph',publication:'exact-workspace-files-observed'};
    if(action.plan.summary.syntheticCommits===0)state.operations.activity={state:'verified-no-op'};
    else if(!state.operations.activity||!['pushed-awaiting-graph','graph-targets-observed'].includes(state.operations.activity.state)){
      if(state.operations.activity?.state==='unknown')throw Error('Calendar push remains uncertain; inspect the workspace before retrying.');
      state.operations.activity={state:'unknown'};save();
      const result=await applyCalendar(action.plan,{...options,repo:action.repo,confirm:action.plan.fingerprint,
        authorName:options.authorName||process.env.GH_AURA_AUTHOR_NAME,authorEmail:options.authorEmail||process.env.GH_AURA_AUTHOR_EMAIL});
      state.operations.activity={state:'pushed-awaiting-graph',result};save();
    }
    try{state.operations.activity.observation=await verifyWorkspaceCalendar(plan.username,action,options);
      state.operations.activity.state=state.operations.activity.observation.state==='graph-targets-observed'?'graph-targets-observed':'pushed-awaiting-graph';}
    catch{state.operations.activity.observation={state:'unknown',reason:'Graph visibility or processing could not be verified.'};state.operations.activity.state='pushed-awaiting-graph';}
    save();
  }
  if(plan.badges&&!['campaign','collaboration-campaign'].includes(plan.badges.mode)){
    try{
      const report=await (options.observeAwards?options.observeAwards():observeVisibleAchievements(plan.username,options.publicFetch?{fetch:options.publicFetch}:{}));
      const wanted=plan.badges.mode==='collaboration'?[plan.badges.plan.attempt]:plan.badges.plan.attempts.map(x=>x.badge);
      const visible=new Set(report.items?.map(x=>x.id));
      state.operations.badges.award=report;
      state.operations.badges.state=wanted.every(id=>visible.has(id))?'award-observed':'events-observed';
    }catch{state.operations.badges.awards='unknown';state.operations.badges.state='events-observed';}
    save();
  }
  return {pending:!!plan.badges&&state.operations.badges?.state!=='award-observed'||!!plan.activity&&!['graph-targets-observed','verified-no-op'].includes(state.operations.activity?.state)};
}

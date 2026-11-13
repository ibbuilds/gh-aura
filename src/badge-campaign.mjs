import { createHash } from 'node:crypto';
import { planBadgeRun, validateBadgePlan, applyBadgeRun, inspectBadgeWorkspace } from './badge-run.mjs';
import { PULL_SHARK_TIERS } from './achievement-matrix.mjs';
import { observeVisibleAchievements, observedPullSharkTier } from './achievement-observation.mjs';
import { validateLogin } from './github.mjs';

const fingerprint=plan=>createHash('sha256').update(JSON.stringify(plan)).digest('hex');
export function planBadgeCampaign({repo,tier='base',strategy='rest',role='general engineering',quickdraw=true}={}){
  if(!Object.hasOwn(PULL_SHARK_TIERS,tier))throw Error('Unknown campaign tier.');
  const batches=[],milestones=[];let start=0;
  for(const [stage,target] of Object.entries(PULL_SHARK_TIERS)){
    if(target>PULL_SHARK_TIERS[tier])break;
    while(start<target){const batch=planBadgeRun({repo,tier:stage,strategy,role,start,pulls:Math.min(16,target-start),quickdraw:quickdraw&&start===0});batches.push(batch);start=batch.nextStart;}
    milestones.push({tier:stage,afterBatch:batches.length,target});
  }
  const plan={format:'gh-aura-badge-campaign-v1',repo:batches[0].repo,tier,strategy,role,quickdraw,maxPulls:start,batches,milestones,
    awardVerification:'Observe the actual public achievement after every tier; stop when it is hidden, missing or unknown.'};
  return {...plan,fingerprint:fingerprint(plan)};
}
export function validateBadgeCampaign(input){
  const expected=planBadgeCampaign(input);
  if(expected.fingerprint!==input?.fingerprint||JSON.stringify(expected)!==JSON.stringify(input))throw Error('Badge campaign changed; prepare a new review.');
  input.batches.forEach(validateBadgePlan);return input;
}
export async function executeBadgeCampaign(input,approval,state={},options={}){
  const plan=validateBadgeCampaign(input);
  if(approval!==plan.fingerprint)throw Error('Exact campaign approval required.');
  const owner=validateLogin(plan.repo.split('/')[0]);
  const observe=options.observeAwards||(()=>observeVisibleAchievements(owner,options.publicFetch?{fetch:options.publicFetch}:{}));
  const apply=options.applyBatch||((batch)=>applyBadgeRun(batch,{...options,confirm:batch.fingerprint}));
  const persist=options.onState||(()=>{});
  const progress={format:'gh-aura-badge-campaign-state-v1',fingerprint:plan.fingerprint,nextBatch:0,...state};
  if(progress.fingerprint!==plan.fingerprint||!Number.isInteger(progress.nextBatch)||progress.nextBatch<0||progress.nextBatch>plan.batches.length)throw Error('Campaign progress is invalid.');
  let report=await observe();
  if(observedPullSharkTier(report,plan.tier))return {...progress,state:'award-observed',award:report};
  if(progress.state==='unknown'){
    const batch=plan.batches[progress.nextBatch];
    if(!batch)throw Error('Unknown final campaign result.');
    const found=await (options.inspectWorkspace||(()=>inspectBadgeWorkspace({...options,repo:plan.repo})))();
    const indices=new Set(found.events?.mergedPullRequests?.map(x=>x.index));
    if(!found.observed?.pullsComplete||Array.from({length:batch.pulls},(_,i)=>batch.start+i+1).some(i=>!indices.has(i))||
      batch.quickdraw&&!found.observed?.quickdrawTimingCandidates)throw Error('Campaign batch is uncertain; inspect before retrying.');
    progress.nextBatch++;progress.state='events-observed';persist(progress);
  }
  for(let i=progress.nextBatch;i<plan.batches.length;i++){
    const prior=plan.milestones.filter(x=>x.afterBatch<=i).find(x=>!observedPullSharkTier(report,x.tier));
    if(prior&&!observedPullSharkTier(report,prior.tier))return {...progress,state:'needs-award-verification',requiredTier:prior.tier,award:report};
    progress.nextBatch=i;progress.state='unknown';persist(progress);
    try{progress.lastBatch=await apply(plan.batches[i]);}
    catch(error){progress.error=String(error.message).slice(0,300);persist(progress);throw error;}
    progress.nextBatch=i+1;progress.state='events-observed';delete progress.error;persist(progress);
    const milestone=plan.milestones.find(x=>x.afterBatch===i+1);
    if(milestone){report=await observe();if(!observedPullSharkTier(report,milestone.tier))return {...progress,state:'needs-award-verification',requiredTier:milestone.tier,award:report};}
  }
  return {...progress,state:observedPullSharkTier(report,plan.tier)?'award-observed':'needs-award-verification',award:report};
}

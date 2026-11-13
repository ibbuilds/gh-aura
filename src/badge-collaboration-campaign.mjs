import { createHash } from 'node:crypto';
import { matrixEntry } from './achievement-matrix.mjs';
import { planBadgeCollaboration,executeBadgeCollaboration } from './badge-collaboration.mjs';
import { observeVisibleAchievements,observedAchievementTier } from './achievement-observation.mjs';
import { reserveBadgeWrite } from './badge-write-budget.mjs';

const tiers=['base','bronze','silver','gold'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function planCollaborationCampaign({repo,kind='coauthor',collaborator,consent,tier='base',exercises}={}){
  const award=kind==='coauthor'?'pair-extraordinaire':kind==='discussion-answer'?'galaxy-brain':null;
  if(!award||!tiers.includes(tier))throw Error('Unknown collaboration campaign route or tier.');
  const thresholds=matrixEntry(award).tierThresholds,target=thresholds[tiers.indexOf(tier)];
  if(!Array.isArray(exercises)||exercises.length!==target)throw Error('Review exactly '+target+' distinct exercises for this campaign tier.');
  const fields=kind==='coauthor'?['content']:['question','answer'];
  for(const exercise of exercises)if(!exercise||typeof exercise!=='object'||Array.isArray(exercise)||Object.keys(exercise).length!==fields.length||Object.keys(exercise).some(k=>!fields.includes(k)))throw Error('Invalid reviewed campaign exercise fields.');
  const steps=exercises.map(exercise=>planBadgeCollaboration({repo,kind,collaborator,consent,...exercise}));
  if(new Set(steps.map(step=>step.fingerprint)).size!==steps.length)throw Error('Campaign exercises must have distinct exact content.');
  const plan={format:'gh-aura-collaboration-campaign-v1',repo,kind,collaborator,consent:true,tier,award,
    exercises:structuredClone(exercises),steps,milestones:thresholds.slice(0,tiers.indexOf(tier)+1).map((afterExercise,index)=>({tier:tiers[index],afterExercise})),
    budget:{maxExercises:target,primaryWrites:target*(kind==='coauthor'?8:2),secondaryWrites:kind==='coauthor'?0:target*3},
    requirements:steps[0].requirements,
    caveat:'Reviewed private exercises, not professional history. Thresholds are source-labeled estimates; actual observed awards gate every tier. Local write reservations include bounded retry room.'};
  if(Buffer.byteLength(JSON.stringify(plan))>1536*1024)throw Error('Collaboration campaign exceeds 1.5 MiB.');
  return {...plan,fingerprint:hash(plan)};
}
export function validateCollaborationCampaign(input){
  const expected=planCollaborationCampaign(input);
  if(expected.fingerprint!==input?.fingerprint||JSON.stringify(expected)!==JSON.stringify(input))throw Error('Collaboration campaign changed; review a new plan.');
  return input;
}
export async function executeCollaborationCampaign(input,approval,state={},options={}){
  const plan=validateCollaborationCampaign(input);
  if(approval!==plan.fingerprint)throw Error('Exact collaboration campaign approval required.');
  const progress={format:'gh-aura-collaboration-campaign-state-v1',fingerprint:plan.fingerprint,nextExercise:0,writeReservations:{primary:0,secondary:0},...structuredClone(state)};
  if(progress.format!=='gh-aura-collaboration-campaign-state-v1'||progress.fingerprint!==plan.fingerprint||!Number.isInteger(progress.nextExercise)||progress.nextExercise<0||progress.nextExercise>plan.steps.length)throw Error('Invalid collaboration campaign progress.');
  for(const actor of ['primary','secondary'])if(!Number.isSafeInteger(progress.writeReservations?.[actor])||progress.writeReservations[actor]<0||progress.writeReservations[actor]>plan.budget[actor+'Writes'])throw Error('Invalid campaign write reservations.');
  const save=()=>options.onState?.(structuredClone(progress)),owner=plan.repo.split('/')[0];
  const observe=options.observeAwards||(()=>observeVisibleAchievements(owner,options.publicFetch?{fetch:options.publicFetch}:{}));
  const reserve=options.reserveWrite||((login,count)=>reserveBadgeWrite(login,{directory:options.budgetDirectory,count}));
  const reserveWrite=async(login,count)=>{
    const actor=login.toLowerCase()===owner.toLowerCase()?'primary':login.toLowerCase()===plan.collaborator.toLowerCase()?'secondary':null;
    if(!actor||count!==1||progress.writeReservations[actor]+count>plan.budget[actor+'Writes'])throw Error('Reviewed campaign write budget exhausted; inspect and authorize a new scope if needed.');
    await reserve(login,count);progress.writeReservations[actor]+=count;save();
  };
  const apply=options.applyExercise||((step,execution)=>executeBadgeCollaboration(step,step.fingerprint,execution));
  let report=await observe(),applied=0;
  if(observedAchievementTier(report,plan.award,plan.tier))return {...progress,state:'award-observed',award:report};
  for(let i=progress.nextExercise;i<plan.steps.length;i++){
    const prior=plan.milestones.find(m=>m.afterExercise<=i&&!observedAchievementTier(report,plan.award,m.tier));
    if(prior)return {...progress,state:'needs-award-verification',requiredTier:prior.tier,award:report};
    if(applied++>0)await(options.sleep||((ms)=>new Promise(resolve=>setTimeout(resolve,ms))))(1100);
    progress.nextExercise=i;progress.state='unknown';save();
    // Each exact route reconciles its remote marker, content and merge/answer
    // before continuing, including a step whose previous response was lost.
    const result=await apply(plan.steps[i],{...options,reserveWrite});
    if(result?.state!=='events-observed')throw Error('Campaign exercise result remains uncertain.');
    progress.nextExercise=i+1;progress.state='events-observed';progress.lastExercise={fingerprint:plan.steps[i].fingerprint,kind:plan.kind};save();
    const milestone=plan.milestones.find(m=>m.afterExercise===i+1);
    if(milestone){
      report=await observe();
      if(observedAchievementTier(report,plan.award,plan.tier))return {...progress,state:'award-observed',award:report};
      if(!observedAchievementTier(report,plan.award,milestone.tier))return {...progress,state:'needs-award-verification',requiredTier:milestone.tier,award:report};
    }
  }
  return {...progress,state:'needs-award-verification',requiredTier:plan.tier,award:report};
}

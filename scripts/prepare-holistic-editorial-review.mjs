// Turn offline 600-candidate provisional triage into the EXACT human-review
// input schema consumed by select-holistic-exemplars.mjs. Never approve by default.
import {readFileSync,writeFileSync,statSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PROFILE_FACETS,validateHolisticReview} from '../src/holistic-profile-taxonomy.mjs';
const SOURCE=new URL('../research/holistic-category-triage.json',import.meta.url);
const visual=()=>({desktopLight:false,desktopDark:false,mobileLight:false,mobileDark:false});
export function createHolisticReviewQueue(triage){
  if(triage?.schema!=='gh-aura-holistic-category-triage-v1'||
    triage.counts?.candidates!==600||!Array.isArray(triage.accounts))
    throw Error('Expected complete, bounded public profile triage.');
  const eligible=triage.accounts.filter(x=>x.publicData&&x.htmlObserved);
  if(eligible.length<500)throw Error('Fewer than 500 public profiles were available for review.');
  const reviews=eligible.map(p=>({
    login:p.login,profileUrl:p.url,
    primaryStyle:null,secondaryStyles:[],purposes:[],
    facetStates:Object.fromEntries(PROFILE_FACETS.map(f=>[f,'not-observed'])),
    visualChecks:visual(),
    decision:null,editorialRank:null,reviewer:null,reviewedAt:null,evidenceNotes:null,
    research:{hypothesis:p.category.primary,secondaryHypotheses:p.category.secondary,
      publicEvidenceReference:'research/holistic-category-triage.json#'+p.login,
      instructions:'Check the real GitHub page. Mark observed, checked-absent, privacy-hidden or unavailable with evidence. Do not infer employment or unseen achievements.'},
  }));
  const seen=new Set();
  for(const r of reviews){
    if(seen.has(r.login.toLowerCase()))throw Error('Duplicate candidate in manual review queue.');
    seen.add(r.login.toLowerCase());
    if(validateHolisticReview(r).readiness.complete)
      throw Error('An unreviewed template must not pass editorial completeness.');
  }
  return {schema:'gh-aura-holistic-editorial-review-queue-v1',
    status:'UNREVIEWED - NO PROFILE APPROVALS, NO CATEGORY WINNERS',
    targetComplete:500,availableForReview:reviews.length,
    source:'GitHub public profile and HTML evidence. Every field requires direct visual/editorial confirmation.',
    instruction:'After inspecting the complete profile, fill primaryStyle, secondaryStyles, purposes, each facetStates entry, four visualChecks, decision, rank, reviewer, reviewedAt and evidenceNotes. Never turn absent data into zero or infer private facts.',
    unavailable:triage.accounts.filter(x=>!x.publicData||!x.htmlObserved).map(x=>x.login),
    reviews};
}
function main(args){
  if(args.length!==2||args[0]!=='--output'||!args[1].endsWith('.json'))
    throw Error('Usage: node scripts/prepare-holistic-editorial-review.mjs --output NEW.json');
  const out=resolve(args[1]);
  if(existsSync(out))throw Error('Review output exists: no overwrite.');
  if(statSync(SOURCE).size>1024*1024)throw Error('Triage input too large.');
  const triage=JSON.parse(readFileSync(SOURCE,'utf8')),result=createHolisticReviewQueue(triage);
  writeFileSync(out,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({reviewable:result.availableForReview,
    remaining:result.unavailable.length,approved:0})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}catch(e){
    process.stderr.write('GH Aura manual review preparation: '+e.message+'\n');process.exitCode=1;
  }
}

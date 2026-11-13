// A final category shortlist requires full, dated, human-reviewed public profile
// evidence, not only an API batch or a README. No quotas, stars or badge counts.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {HOLISTIC_STYLES,groupReviewedProfiles,validateHolisticReview} from '../src/holistic-profile-taxonomy.mjs';

export function assessCategorySelection(reviews,{target=500,minSamplesPerStyle=3}={}){
  if(!Array.isArray(reviews)||reviews.length>2500)throw Error('Expected bounded review array.');
  if(!Number.isInteger(target)||target<1||target>2500||
    !Number.isInteger(minSamplesPerStyle)||minSamplesPerStyle<0||minSamplesPerStyle>50)
    throw Error('Invalid category study acceptance bounds.');
  const all=reviews.map(validateHolisticReview);
  const complete=all.filter(x=>x.readiness.complete&&x.decision);
  const styles=Object.fromEntries(HOLISTIC_STYLES.map(x=>[x.id,0]));
  complete.forEach(x=>{styles[x.primaryStyle]++;});
  const shortages=Object.entries(styles).filter(([_,n])=>n<minSamplesPerStyle)
    .map(([style,n])=>({style,observed:n,minimum:minSamplesPerStyle}));
  const conditions=[
    ...(complete.length<target?['Only '+complete.length+' of '+target+' required holistic evaluations are complete.']:[]),
    ...(shortages.length?['Some style categories have insufficient complete reviews.']:[]),
  ];
  if(conditions.length)return {status:'blocked-incomplete-holistic-research',
    candidateReviews:all.length,completed:complete.length,target,styles,shortages,conditions,
    note:'No best-in-category list has been generated. Missing facets and category coverage must be reviewed.'};
  const grouped=groupReviewedProfiles(all),groups=grouped.groups;
  const missingWinners=Object.entries(groups).filter(([_,r])=>!r.length).map(([id])=>id);
  if(missingWinners.length)return {status:'blocked-category-without-approved-exemplar',
    completed:complete.length,missingWinners,styles,note:'A reviewer must approve and rank an exemplar for each represented style.'};
  return {schema:'gh-aura-holistic-category-exemplars-v1',
    status:'editorially-selected-from-complete-profile-reviews',
    evaluated:complete.length,target,styles,
    selectedCount:Object.values(groups).reduce((n,g)=>n+g.length,0),
    categories:groups,
    limitations:'Editorial judgments relative to a style and intended user. No universal professional score, employment verification or badge-award guarantee.',
    source:'Human-reviewed complete profile observations with corresponding archived evidence.'};
}
function execute(args){
  let input,output;
  for(let i=0;i<args.length;i+=2){
    if(args[i]==='--reviews')input=args[i+1];
    else if(args[i]==='--output')output=args[i+1];
    else throw Error('Use --reviews REVIEWED.json --output CATEGORY-WINNERS.json.');
  }
  if(!input?.endsWith('.json')||!output?.endsWith('.json'))
    throw Error('Use --reviews REVIEWED.json --output CATEGORY-WINNERS.json.');
  const data=JSON.parse(readFileSync(resolve(input),'utf8'));
  const reviews=Array.isArray(data)?data:data.reviews;
  const result=assessCategorySelection(reviews);
  if(result.status!=='editorially-selected-from-complete-profile-reviews')
    throw Error(result.status+': '+(result.conditions||[result.note]).join(' '));
  writeFileSync(resolve(output),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({selected:result.selectedCount,categories:Object.keys(result.categories).length})+'\n');
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main)try{execute(process.argv.slice(2));}catch(e){
  process.stderr.write('GH Aura holistic selection: '+e.message+'\n');process.exitCode=1;
}

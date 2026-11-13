// Merge optional, locally generated read-only API observation batches.
// No GitHub writes, no secret data, no claim of full-profile visual acceptance.
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const ROSTER_URL=new URL('../research/profile-candidates-600.json',import.meta.url);
const read=(path)=>{if(statSync(path).size>8*1024*1024)throw Error('Research JSON exceeds 8 MiB.');
  return JSON.parse(readFileSync(path,'utf8'));};
const key=login=>String(login||'').toLowerCase();
export function mergeHolisticBatches(roster,batches){
  if(!roster||roster.schema!=='gh-aura-holistic-profile-candidates-v1'||
    !Array.isArray(roster.candidates))throw Error('Invalid holistic candidate roster.');
  if(!Array.isArray(batches)||!batches.length||batches.length>60)
    throw Error('Provide between 1 and 60 bounded observation batches.');
  const unique=new Map();
  for(const batch of batches){
    if(batch.schema!=='gh-aura-holistic-api-observation-batch-v1'||
      !Number.isInteger(batch.start)||!Number.isInteger(batch.requested)||
      !Array.isArray(batch.profiles)||batch.requested!==batch.profiles.length)
      throw Error('Invalid holistic research batch.');
    const expected=roster.candidates.slice(batch.start,batch.start+batch.requested);
    if(expected.length!==batch.profiles.length)throw Error('Research batch exceeds the candidate roster.');
    for(let i=0;i<expected.length;i++){
      const observation=batch.profiles[i],login=key(expected[i].login);
      if(key(observation.login)!==login||unique.has(login))
        throw Error('Research batch order mismatch or repeated profile.');
      if(!['graphql-public-metadata','not-returned-by-github'].includes(observation.availability)||
        observation.complete!==false||!observation.observedAt)
        throw Error('Invalid observation state; completed visual profiles cannot come from an API batch.');
      if(Object.hasOwn(observation,'rawBio')||Object.hasOwn(observation,'rawReadme')||
        Object.hasOwn(observation,'token'))
        throw Error('Refusing sensitive or unbounded research fields.');
      unique.set(login,observation);
    }
  }
  const records=roster.candidates.flatMap(x=>unique.has(key(x.login))?[unique.get(key(x.login))]:[]);
  const missed=roster.candidates.filter(x=>!unique.has(key(x.login))).map(x=>x.login);
  return {schema:'gh-aura-holistic-observations-merged-v1',
    status:'PUBLIC API METADATA ONLY — no complete rendered-profile review',
    corpusCandidates:roster.candidates.length,covered:records.length,
    responded:records.filter(x=>x.availability==='graphql-public-metadata').length,
    fullyVisuallyReviewed:0,
    missingCount:missed.length,missingAccounts:missed,
    next:'Human review of all eight profile facets, visual rendering and editorial categories before choosing winners.',
    profiles:records};
}
export function manualReviewQueue(merged){
  if(merged.schema!=='gh-aura-holistic-observations-merged-v1')
    throw Error('Expected merged holistic API observations.');
  return {schema:'gh-aura-holistic-manual-review-queue-v1',
    status:'UNREVIEWED templates only; not best-of-category rankings.',
    reviews:merged.profiles.filter(x=>x.availability==='graphql-public-metadata').map(p=>({
      login:p.login,profileUrl:p.profileUrl,
      primaryStyle:null,secondaryStyles:[],purposes:[],
      facetStates:{avatar:'not-observed',profileHeader:'not-observed',
        biography:'not-observed',links:'not-observed',profileReadme:'not-observed',
        pinnedRepositories:'not-observed',contributionCalendar:'not-observed',
        achievements:'not-observed',overallComposition:'not-observed'},
      visualChecks:{desktopLight:false,desktopDark:false,mobileLight:false,mobileDark:false},
      decision:null,editorialRank:null,reviewer:null,reviewedAt:null,evidenceNotes:null,
    }))};
}
function execute(argv){
  const o=argv.indexOf('--output'),m=argv.indexOf('--reviews');
  if(o<0||!argv[o+1]?.endsWith('.json'))
    throw Error('Usage: merge-holistic-batches --output result.json [--reviews queue.json] batch*.json');
  const paths=argv.filter((a,i)=>a!=='--output'&&a!=='--reviews'&&i!==o+1&&(m<0||i!==m+1));
  if(!paths.length||paths.some(x=>!x.endsWith('.json')))
    throw Error('Supply at least one JSON batch.');
  if(m>=0&&!argv[m+1]?.endsWith('.json'))throw Error('Expected --reviews queue.json');
  const roster=read(ROSTER_URL),batches=paths.map(read),merged=mergeHolisticBatches(roster,batches);
  const output=resolve(argv[o+1]);
  writeFileSync(output,JSON.stringify(merged,null,2)+'\n',{flag:'wx',mode:0o600});
  if(m>=0){
    if(!argv[m+1]?.endsWith('.json'))throw Error('Expected --reviews queue.json');
    writeFileSync(resolve(argv[m+1]),JSON.stringify(manualReviewQueue(merged),null,2)+'\n',
      {flag:'wx',mode:0o600});
  }
  process.stdout.write(JSON.stringify({covered:merged.covered,responded:merged.responded,
    completeVisualReviews:0,missing:merged.missingCount})+'\n');
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main)try{execute(process.argv.slice(2));}catch(e){
  process.stderr.write('GH Aura research merge: '+e.message+'\n');process.exitCode=1;
}

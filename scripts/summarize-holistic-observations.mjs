// Developer-only local analysis of observed public GitHub GraphQL profile records.
// Never used in ordinary CLI workflows, and never selects "best" profiles.
import {readFileSync,readdirSync,statSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const DATA_ROOT=new URL('../research/',import.meta.url);
const validStyle=new Set(['native-no-readme','minimal-text','technical-editorial','project-showcase',
  'visual-illustrated','terminal-code','data-dashboard','dynamic-content']);
export function suggestReviewStyles(profile){
  const observed=profile?.availability==='graphql-public-metadata';
  if(!observed)return [];
  const tags=[],seen=new Set();
  const add=(style,reason)=>{if(!validStyle.has(style)||seen.has(style))return;seen.add(style);
    tags.push({style,reason,certainty:'structural-hypothesis-only'});};
  const r=profile.profileReadme||{};
  const pins=profile.pinnedRepositories?.count??null;
  if(pins>=3)add('project-showcase','At least three public pinned items; quality and purpose still need human inspection.');
  if(r.state==='observed'){
    if(r.approxWords<=90&&r.imageCount<=1)
      add('minimal-text','Short, low-image README; inspect avatar/sidebar/pins before classifying.');
    if(r.approxWords>=120&&r.headings>=2)
      add('technical-editorial','Longer structured README; actual technical value not verified.');
    if(r.imageCount>=3||r.themeAwareImages>=1)
      add('visual-illustrated','README uses multiple images or theme-aware media; rights and quality unknown.');
    if(r.remoteStatsImages>=2)
      add('data-dashboard','README refers to multiple stats services; metrics and visual quality unverified.');
  }else if(pins>=2){
    add('native-no-readme','Two or more visible pins but no observed root README; a README is optional.');
  }
  return tags;
}
export function summarizeObservations(roster,batches){
  if(roster?.schema!=='gh-aura-holistic-profile-candidates-v1'||
    !Array.isArray(roster.candidates)||roster.candidates.length<500)
    throw Error('Expected GH Aura verified candidate roster.');
  if(!Array.isArray(batches)||!batches.length)throw Error('No GraphQL observation batches.');
  const seen=new Map();
  const starts=new Set();
  for(const batch of batches){
    if(batch?.schema!=='gh-aura-holistic-api-observation-batch-v1'||
      !Number.isInteger(batch.start)||!Array.isArray(batch.profiles)||
      batch.profiles.length!==batch.requested||starts.has(batch.start))
      throw Error('Malformed or duplicate GraphQL batch.');
    starts.add(batch.start);
    const source=roster.candidates.slice(batch.start,batch.start+batch.profiles.length);
    if(source.length!==batch.profiles.length)throw Error('GraphQL batch index exceeds corpus.');
    for(let i=0;i<source.length;i++){
      const want=source[i].login.toLowerCase(),p=batch.profiles[i];
      if(want!==String(p.login||'').toLowerCase()||seen.has(want)||
        p.complete!==false||!p.observedAt)
        throw Error('GraphQL candidate order, uniqueness, or incomplete status is invalid.');
      seen.set(want,p);
    }
  }
  const profiles=roster.candidates.map(x=>seen.get(x.login.toLowerCase())).filter(Boolean);
  const available=profiles.filter(x=>x.availability==='graphql-public-metadata');
  const missing=roster.candidates.filter(x=>!seen.has(x.login.toLowerCase()));
  const n=(fn)=>available.filter(fn).length;
  const candidateCounts=Object.fromEntries([...validStyle].map(x=>[x,0]));
  const byLogin={};
  for(const p of available){
    const hints=suggestReviewStyles(p);
    hints.forEach(h=>candidateCounts[h.style]++);
    byLogin[p.login.toLowerCase()]=hints;
  }
  const summary={schema:'gh-aura-observed-public-profiles-summary-v1',
    stage:'API-OBSERVED, NOT HOLISTICALLY OR VISUALLY REVIEWED',
    inputs:{candidates:roster.candidates.length,receivedProfiles:profiles.length,
      batchCount:batches.length,missingCount:missing.length},
    counts:{
      publiclyReturned:available.length,
      userNotReturned:profiles.filter(x=>x.availability==='not-returned-by-github').length,
      temporaryApiUnknown:profiles.filter(x=>x.availability==='transient-github-api-unavailable').length,
      publicAvatarUrls:n(x=>x.avatar?.state==='url-observed-visual-unreviewed'),
      publicBiographyPresent:n(x=>x.biography?.present===true),
      publicWebsitePresent:n(x=>x.links?.websitePresent===true),
      profilesWithPinnedItems:n(x=>(x.pinnedRepositories?.count||0)>0),
      publicPinnedItemLinks:available.reduce((s,x)=>s+(x.pinnedRepositories?.items||[]).length,0),
      rootReadmesObserved:n(x=>x.profileReadme?.state==='observed'),
      rootReadmesNotObserved:n(x=>x.profileReadme?.state!=='observed'),
      visibleContributionCalendars:n(x=>x.contributionCalendar?.state==='github-visible-to-query-caller'),
      visuallyReviewed:0,achievementsManuallyChecked:0,holisticallyReviewed:0,categoryWinners:0,
    },
    preliminaryStyleHypotheses:candidateCounts,
    majorGaps:['Avatar URL is not a visual appraisal.',
      'Contribution count does not prove work quality or expose private activity.',
      'No official public achievement award status was certified by these queries.',
      'README Markdown features are not desktop/mobile rendering evidence.',
      'Style hypotheses may overlap or be wrong and are never category approvals.'],
    evidence:'GitHub GraphQL publicly visible profile metadata via read-only GitHub Actions token.',
    includedLogins:profiles.map(x=>x.login),
    missingLogins:missing.map(x=>x.login)};
  const queue={schema:'gh-aura-holistic-visual-review-queue-v1',
    status:'AWAITING HUMAN VISUAL REVIEW; no style assigned automatically',
    required:['avatar','profileHeader','biography','links','profileReadme','pinnedRepositories',
      'contributionCalendar','achievements','overallComposition','desktopLight',
      'desktopDark','mobileLight','mobileDark'],
    entries:roster.candidates.map(candidate=>{
      const p=seen.get(candidate.login.toLowerCase());
      return {login:candidate.login,profileUrl:candidate.profileUrl,
        apiAvailability:p?.availability||'not-collected',
        apiObservedAt:p?.observedAt||null,
        hypotheses:p?suggestReviewStyles(p):[],
        primaryStyle:null,secondaryStyles:[],
        reviewedAvatar:false,reviewedProfileHeader:false,reviewedBiography:false,
        reviewedLinks:false,reviewedReadme:false,reviewedPins:false,
        reviewedContributions:false,reviewedAchievements:false,
        reviewedOverallComposition:false,
        desktopLight:false,desktopDark:false,mobileLight:false,mobileDark:false,
        editorialDecision:null,needsHumanReview:true};
    })};
  return {summary,queue};
}
function main(args){
  const root=resolve(fileURLToPath(DATA_ROOT)),dir=resolve(root,'graphql-observations');
  const files=readdirSync(dir).filter(x=>/^batch-\d{3}\.json$/.test(x)).sort();
  const roster=JSON.parse(readFileSync(resolve(root,'profile-candidates-600.json'),'utf8'));
  const batches=files.map(name=>{
    const path=resolve(dir,name);if(statSync(path).size>1024*1024)throw Error('GraphQL research batch exceeds 1 MiB');
    return JSON.parse(readFileSync(path,'utf8'));
  });
  const {summary,queue}=summarizeObservations(roster,batches);
  if(summary.inputs.receivedProfiles!==roster.candidates.length)
    throw Error('Incomplete research corpus: '+summary.inputs.receivedProfiles+'/'+roster.candidates.length);
  const outputs={'--summary':null,'--queue':null};
  for(let i=0;i<args.length;i+=2){
    if(!(args[i] in outputs)||!args[i+1]?.endsWith('.json'))
      throw Error('Specify --summary FILE.json and --queue FILE.json');
    outputs[args[i]]=resolve(args[i+1]);
  }
  if(!outputs['--summary']||!outputs['--queue']||outputs['--summary']===outputs['--queue']||
    Object.values(outputs).some(existsSync))
    throw Error('Choose two distinct, nonexistent JSON output paths.');
  writeFileSync(outputs['--summary'],JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(outputs['--queue'],JSON.stringify(queue,null,2)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify(summary.counts)+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}
  catch(e){process.stderr.write('GH Aura holistic study: '+e.message+'\n');process.exitCode=1;}
}

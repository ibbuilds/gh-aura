// Holistic GitHub profile taxonomy. README content alone is never enough to
// certify a style or elect a category representative.
export const PROFILE_FACETS=Object.freeze([
  'avatar','profileHeader','biography','links','profileReadme',
  'pinnedRepositories','contributionCalendar','achievements','overallComposition',
]);
const cat=(id,title,about,checks)=>Object.freeze({id,title,about,checks:Object.freeze(checks)});
export const HOLISTIC_STYLES=Object.freeze([
  cat('native-no-readme','Native GitHub identity',
    'Avatar, public sidebar, pins and activity carry the profile; README may be absent.',
    ['avatar and sidebar coherence','pins and activity context','no forced README']),
  cat('minimal-text','Minimal text',
    'Sparse but intentional self-description and links, with an appropriately quiet visual system.',
    ['identity clarity','link relevance','content proportional to the owner']),
  cat('technical-editorial','Technical editorial',
    'A structured technical narrative that explains observable work and proof.',
    ['specific work','readable hierarchy','links to implementation']),
  cat('project-showcase','Project/product showcase',
    'A strong relationship between public pins, examples, project presentation and evidence.',
    ['project purpose','personal work distinctions','quality of pin selection']),
  cat('visual-illustrated','Illustrated visual identity',
    'Distinct, original imagery that supports the overall identity and inspectable work.',
    ['rights-cleared art','mobile and theme legibility','projects not eclipsed']),
  cat('terminal-code','Terminal or code-inspired',
    'Code and terminal motifs coherently tied to actual projects, not pasted ASCII gimmicks.',
    ['accessible code imagery','theme clarity','real tools and projects']),
  cat('data-dashboard','Data-rich dashboard',
    'Metrics, statistics and activity visuals intentionally support the narrative.',
    ['accurate metrics','non-misleading activity','external-service resilience']),
  cat('dynamic-content','Actively maintained content',
    'Current projects, writing or releases appear through reliable updates.',
    ['freshness','useful information','maintained automation']),
]);
export const PROFILE_PURPOSES=Object.freeze([
  'career','research','open-source','product','personal','educational',
]);
export const FACET_STATES=Object.freeze([
  'observed','checked-absent','privacy-hidden','not-observed','unavailable',
]);
const checked=new Set(FACET_STATES.slice(0,3));
const styleSet=new Set(HOLISTIC_STYLES.map(x=>x.id));
const purposeSet=new Set(PROFILE_PURPOSES);

// True only after each visible area has been checked, including areas that
// legitimately are absent or hidden. API metadata and a README SHA are *partial*.
export function holisticReadiness(review={}){
  const states=review.facetStates||{};
  const missing=PROFILE_FACETS.filter(facet=>!checked.has(states[facet]));
  const displays=review.visualChecks||{};
  for(const kind of ['desktopLight','desktopDark','mobileLight','mobileDark'])
    if(displays[kind]!==true)missing.push('visualChecks.'+kind);
  if(!review.reviewedAt||!review.reviewer||!review.evidenceNotes)
    missing.push('editorialReview');
  return {complete:missing.length===0,missing};
}
export function validateHolisticReview(review){
  if(!review||typeof review!=='object'||Array.isArray(review))
    throw Error('Expected one holistic profile review object.');
  if(typeof review.login!=='string'||!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(review.login))
    throw Error('Invalid reviewed GitHub login.');
  if(!styleSet.has(review.primaryStyle))throw Error('Unknown primary profile style.');
  if(!Array.isArray(review.secondaryStyles)||review.secondaryStyles.some(x=>!styleSet.has(x))||
    new Set(review.secondaryStyles).size!==review.secondaryStyles.length)
    throw Error('Invalid secondary style tags.');
  if(!Array.isArray(review.purposes)||review.purposes.some(x=>!purposeSet.has(x)))
    throw Error('Invalid independent purposes.');
  const states=review.facetStates||{};
  if(Object.keys(states).some(f=>!PROFILE_FACETS.includes(f)||!FACET_STATES.includes(states[f])))
    throw Error('Invalid profile facet states.');
  if(review.editorialRank!==undefined&&(!Number.isInteger(review.editorialRank)||review.editorialRank<1))
    throw Error('Editorial rank must be a positive integer when provided.');
  if(review.decision!==undefined&&!['approved','conditional','exclude'].includes(review.decision))
    throw Error('Invalid manual editorial decision.');
  return {...review,readiness:holisticReadiness(review)};
}
export function groupReviewedProfiles(reviews){
  if(!Array.isArray(reviews)||reviews.length>2500)throw Error('Invalid holistic review collection.');
  const seen=new Set(),groups=Object.fromEntries(HOLISTIC_STYLES.map(x=>[x.id,[]]));
  const pending=[];
  for(const raw of reviews){
    const review=validateHolisticReview(raw),id=review.login.toLowerCase();
    if(seen.has(id))throw Error('Duplicate reviewed account.');
    seen.add(id);
    if(!review.readiness.complete||!review.decision){
      pending.push({login:review.login,missing:review.readiness.missing});continue;
    }
    if(review.decision==='approved'&&Number.isInteger(review.editorialRank))
      groups[review.primaryStyle].push({
        login:review.login,profileUrl:'https://github.com/'+review.login,
        rank:review.editorialRank,purposes:review.purposes,
        secondaryStyles:review.secondaryStyles,evidenceNotes:review.evidenceNotes,
      });
  }
  for(const entries of Object.values(groups))entries.sort((a,b)=>a.rank-b.rank||a.login.localeCompare(b.login));
  return {status:pending.length?'incomplete-editorial-coverage':'reviewed-subset-only',
    groups,pending,reviewed:seen.size,
    caveat:'Manual editorial ranks within each category, not measured professional ability, hiring potential or GitHub achievement eligibility. No quotas are imposed.'};
}

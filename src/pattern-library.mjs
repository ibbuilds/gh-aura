import { lstatSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { HOLISTIC_STYLES, groupReviewedProfiles, validateHolisticReview } from './holistic-profile-taxonomy.mjs';
import { PROFILE_TECHNIQUES } from './profile-techniques.mjs';
import { intentWords, intentMatchScore } from './profile-query.mjs';
import { plain, httpsUrl } from './text.mjs';

export const ORIGINAL_PROFILE_REFERENCES=Object.freeze(['fzn0x','SamuelSchlesinger','yetone','serenakeyitan','mattabate','morluto','poteto','WenyuChiou']);
export const STYLE_DIRECTIONS=Object.freeze({
  'native-no-readme':['barebones'],'minimal-text':['barebones','minimal'],
  'technical-editorial':['technical'],'project-showcase':['minimal','technical','expressive'],
  'visual-illustrated':['expressive'],'terminal-code':['technical','expressive'],
  'data-dashboard':['technical','expressive'],'dynamic-content':['minimal','technical','expressive'],
});
const safe=(x,n,label)=>{
  if(typeof x!=='string'||!x.trim()||x.length>n||plain(x)!==x)throw Error('Invalid pattern '+label+'.');
  return x;
};
function validatePattern(pattern){
  if(!pattern||!/^[-a-z\d]{2,64}$/.test(pattern.id||'')||!Array.isArray(pattern.styles)||!pattern.styles.length||
    pattern.styles.some(x=>!Object.hasOwn(STYLE_DIRECTIONS,x))||new Set(pattern.styles).size!==pattern.styles.length)
    throw Error('Invalid pattern identity/styles.');
  const techniques=pattern.techniques||[];
  if(!Array.isArray(techniques)||techniques.length>8||techniques.some(id=>!PROFILE_TECHNIQUES.some(x=>x.id===id)))throw Error('Unknown pattern technique.');
  if(!Array.isArray(pattern.reviewLogins)||pattern.reviewLogins.length<3||pattern.reviewLogins.length>12||pattern.reviewLogins.some(x=>typeof x!=='string'||!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(x))||new Set(pattern.reviewLogins.map(x=>x.toLowerCase())).size!==pattern.reviewLogins.length)
    throw Error('A pattern needs 3–12 distinct reviewed references.');
  return {id:pattern.id,styles:pattern.styles,title:safe(pattern.title,120,'title'),
    when:safe(pattern.when,400,'context'),principle:safe(pattern.principle,500,'principle'),
    avoid:safe(pattern.avoid,400,'limitations'),techniques,reviewLogins:pattern.reviewLogins};
}
export function compilePatternLibrary(input){
  if(!input||!Array.isArray(input.reviews)||input.reviews.length<500||input.reviews.length>2500||
    !Array.isArray(input.patterns)||!input.patterns.length||input.patterns.length>64)throw Error('Expected 500–2500 complete reviews and 1–64 patterns.');
  groupReviewedProfiles(input.reviews); // Reject duplicate accounts before counting.
  const reviews=input.reviews.map(validateHolisticReview),complete=reviews.filter(x=>x.readiness.complete&&x.decision&&Object.hasOwn(STYLE_DIRECTIONS,x.primaryStyle));
  if(complete.length<500)throw Error('At least 500 complete editorial reviews are required.');
  const styleCounts=Object.fromEntries(HOLISTIC_STYLES.map(x=>[x.id,complete.filter(r=>r.primaryStyle===x.id).length]));
  if(Object.values(styleCounts).some(n=>n<3))throw Error('Every style needs at least three complete reviews.');
  const byLogin=new Map(complete.map(x=>[x.login.toLowerCase(),x])),ids=new Set();
  const patterns=input.patterns.map(raw=>{
    const p=validatePattern(raw);if(ids.has(p.id))throw Error('Duplicate pattern.');ids.add(p.id);
    const evidence=p.reviewLogins.map(login=>{
      const review=byLogin.get(login.toLowerCase());
      if(!review||review.decision!=='approved'||!p.styles.some(s=>review.primaryStyle===s||review.secondaryStyles.includes(s))||
        !Array.isArray(review.evidenceUrls)||!review.evidenceUrls.length||review.evidenceUrls.length>8||review.evidenceUrls.some(u=>!httpsUrl(u)))
        throw Error('Pattern reference lacks approved, compatible, source-linked review: '+login);
      return {login:review.login,reviewer:review.reviewer,reviewedAt:review.reviewedAt,sources:review.evidenceUrls,
        note:review.evidenceNotes.slice(0,400)};
    });
    return {...p,status:'approved-editorial-pattern',directions:[...new Set(p.styles.flatMap(s=>STYLE_DIRECTIONS[s]))],evidence};
  });
  return {format:'gh-aura-pattern-library-v1',sourceDigest:createHash('sha256').update(JSON.stringify(input)).digest('hex'),
    reviewedProfiles:complete.length,styleCounts,patterns,
    limitations:'Editorial composition patterns, not a hiring score, identity verification or permission to copy source assets.'};
}
export function auditPatternStudy(input,{limit=20}={}){
  if(!input||!Array.isArray(input.reviews)||input.reviews.length>2500||!Number.isInteger(limit)||limit<1||limit>50)throw Error('Expected up to 2500 editorial reviews and sample limit 1–50.');
  groupReviewedProfiles(input.reviews);
  const reviews=input.reviews.map(validateHolisticReview),pending=[],missingCounts={},complete=[];
  const styles=Object.fromEntries(HOLISTIC_STYLES.map(style=>[style.id,0]));
  for(const review of reviews){
    const missing=[...review.readiness.missing,...(!review.decision?['decision']:[]),...(!review.primaryStyle?['primaryStyle']:[])];
    if(missing.length){pending.push({login:review.login,missing});for(const key of missing)missingCounts[key]=(missingCounts[key]||0)+1;}
    else{complete.push(review);styles[review.primaryStyle]++;}
  }
  const byLogin=new Map(complete.map(review=>[review.login.toLowerCase(),review]));
  if(input.patterns!==undefined&&!Array.isArray(input.patterns)||input.patterns?.length>64)throw Error('Expected up to 64 candidate patterns.');
  const patternProblems=(input.patterns||[]).map(raw=>{
    const pattern=validatePattern(raw),missingReferences=pattern.reviewLogins.filter(login=>{
      const review=byLogin.get(login.toLowerCase());
      return !review||review.decision!=='approved'||!pattern.styles.some(style=>review.primaryStyle===style||review.secondaryStyles.includes(style))||
        !Array.isArray(review.evidenceUrls)||!review.evidenceUrls.length||review.evidenceUrls.length>8||review.evidenceUrls.some(url=>!httpsUrl(url));
    });
    return {id:pattern.id,missingReferences};
  }).filter(pattern=>pattern.missingReferences.length);
  const blockers=[];
  if(complete.length<500)blockers.push('complete-review-count');
  if(Object.values(styles).some(count=>count<3))blockers.push('style-coverage');
  if(!input.patterns?.length)blockers.push('no-candidate-patterns');
  if(patternProblems.length)blockers.push('pattern-references');
  let eligible=blockers.length===0;
  if(eligible){try{compilePatternLibrary(input);}catch{blockers.push('compilation-contract');eligible=false;}}
  return {format:'gh-aura-editorial-progress-v1',supplied:reviews.length,complete:complete.length,pending:pending.length,target:500,
    remaining:Math.max(0,500-complete.length),styles,minimumPerStyle:3,missingCounts,pendingSample:pending.slice(0,limit),sampleTruncated:pending.length>limit,
    candidatePatterns:input.patterns?.length||0,patternProblems,eligibleForCompilation:eligible,blockers,readOnly:true,writesPerformed:0,
    caveat:'Readiness of supplied evidence only. This does not perform reviews, certify human approval or activate patterns. Counts include complete conditional/excluded reviews; pattern sources must be approved separately.'};
}
export function readPatternLibrary(file=process.env.GH_AURA_PATTERNS_FILE){
  if(!file)return {format:'gh-aura-pattern-library-v1',patterns:[],status:'awaiting-complete-editorial-reviews'};
  const stat=lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>128*1024)throw Error('Pattern library must be a regular JSON file under 128 KiB.');
  const data=JSON.parse(readFileSync(file,'utf8'));
  if(data?.format!=='gh-aura-pattern-library-v1'||!Number.isInteger(data.reviewedProfiles)||data.reviewedProfiles<500||
    !/^[a-f\d]{64}$/.test(data.sourceDigest||'')||!Array.isArray(data.patterns)||!data.patterns.length||data.patterns.length>64||
    HOLISTIC_STYLES.some(x=>!Number.isInteger(data.styleCounts?.[x.id])||data.styleCounts[x.id]<3))throw Error('Unaccepted editorial pattern library.');
  if(Object.values(data.styleCounts).reduce((n,v)=>n+v,0)!==data.reviewedProfiles)throw Error('Editorial category totals differ.');
  const ids=new Set();
  for(const pattern of data.patterns){
    const p=validatePattern(pattern),directions=[...new Set(p.styles.flatMap(s=>STYLE_DIRECTIONS[s]))];
    if(ids.has(p.id)||JSON.stringify(pattern.directions)!==JSON.stringify(directions)||pattern.status!=='approved-editorial-pattern'||
      !Array.isArray(pattern.evidence)||pattern.evidence.length!==p.reviewLogins.length||pattern.evidence.some((e,i)=>
        !e||e.login!==p.reviewLogins[i]||typeof e.reviewer!=='string'||!e.reviewer.trim()||e.reviewer.length>160||
        typeof e.reviewedAt!=='string'||!Number.isFinite(Date.parse(e.reviewedAt))||
        typeof e.note!=='string'||!e.note.trim()||e.note.length>400||!Array.isArray(e.sources)||!e.sources.length||e.sources.length>8||e.sources.some(u=>!httpsUrl(u))))
      throw Error('Pattern lacks valid editorial provenance.');
    ids.add(p.id);
  }
  return {...data,sourceTrust:'owner-configured-editorial-library; review claims require owner verification'};
}
export function recommendApprovedPatterns({query='',direction='minimal',limit=2,library=readPatternLibrary()}={}){
  if(typeof query!=='string'||query.length>1400||!['barebones','minimal','technical','expressive'].includes(direction)||!Number.isInteger(limit)||limit<1||limit>2)throw Error('Invalid approved pattern query.');
  const words=intentWords(query);
  return {status:library.patterns.length?'editorial-library-available':'awaiting-complete-editorial-reviews',
    patterns:library.patterns.filter(x=>x.directions.includes(direction)).map(item=>({item,score:intentMatchScore({...item,description:item.when+' '+item.principle,tags:item.styles},words)}))
      .filter(x=>!words.length||x.score>0).sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id)).slice(0,limit)
      .map(({item})=>({id:item.id,title:item.title,when:item.when,principle:item.principle,avoid:item.avoid,techniques:item.techniques,
        status:item.status,sources:item.evidence.flatMap(x=>x.sources).slice(0,3)}))};
}

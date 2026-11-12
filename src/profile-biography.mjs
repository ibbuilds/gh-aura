import { plain, httpsUrl } from './text.mjs';

export const BIOGRAPHY_FORMAT='gh-aura-biography-v1';
export const BIO_VOICES=Object.freeze(['direct','technical','approachable','editorial','distinctive']);
export const BIO_PERSPECTIVES=Object.freeze(['first-person','third-person','no-pronouns']);
export const BIO_FOCUS=Object.freeze(['engineering','research','products','open-source','learning','creative','custom']);
const str=(value,max,label)=>{
  if(typeof value!=='string'||value.length>max||plain(value)!==value)
    throw Error('Invalid biography '+label+'.');
  return value.trim();
};
const validStatements=(statements)=>{
  if(!Array.isArray(statements)||statements.length>8)
    throw Error('Biography claims must be an array with at most eight statements.');
  return statements.map(item=>{
    if(!item||typeof item!=='object'||Array.isArray(item)||
       Object.keys(item).some(k=>!['statement','proofUrl'].includes(k)))
      throw Error('Biography claims accept only statement and proofUrl.');
    const statement=str(item.statement,220,'claim');
    const proofUrl=str(item.proofUrl||'',500,'proof link');
    if(!statement||proofUrl&&!httpsUrl(proofUrl))
      throw Error('Biography claim needs original text and an optional safe HTTPS proof link.');
    return {statement,proofUrl,
      provenance:'user-supplied-not-independently-verified'};
  });
};
const dedupeWords=(list,max)=>{
  if(!Array.isArray(list)||list.length>max)
    throw Error('Biography exclusion list is too long.');
  return [...new Set(list.map(value=>str(value,80,'avoid phrase')).filter(Boolean))];
};
export function normalizeBiography(input={},direction='minimal'){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).some(k=>!['voice','perspective','focus','maxWords',
      'toneNotes','avoid','claims'].includes(k)))
    throw Error('Invalid biography controls.');
  const defaults={
    voice:direction==='technical'?'technical':direction==='expressive'?'distinctive':'direct',
    perspective:'first-person',focus:direction==='barebones'?'custom':'engineering',
    maxWords:direction==='barebones'?40:direction==='technical'?100:70,
    toneNotes:'',avoid:[],claims:[],
  };
  const options={...defaults,...input};
  if(!BIO_VOICES.includes(options.voice)||!BIO_PERSPECTIVES.includes(options.perspective)||
    !BIO_FOCUS.includes(options.focus))
    throw Error('Invalid biography voice, perspective or focus.');
  if(!Number.isInteger(options.maxWords)||options.maxWords<12||options.maxWords>250)
    throw Error('Biography maxWords must be 12..250.');
  const toneNotes=str(options.toneNotes,700,'tone notes');
  return {format:BIOGRAPHY_FORMAT,voice:options.voice,
    perspective:options.perspective,focus:options.focus,maxWords:options.maxWords,
    toneNotes,avoid:dedupeWords(options.avoid,12),
    claims:validStatements(options.claims),
    note:'A style guide for original prose, not a prewritten biography. Every user-supplied claim must be verified by the owner.',
  };
}
const cleanObserved=(s,max)=>typeof s==='string'?plain(s).slice(0,max):'';
export function biographyEvidence(brief=null){
  if(!brief)return {profile:{},projects:[],observedAt:null,
    note:'No live profile supplied; do not invent name, employer, location or work history.'};
  const profile=brief.publicProfile||brief.user||{};
  const sourceProjects=brief.showcaseEvidence||brief.repos||[];
  const projects=sourceProjects.filter(p=>p&&p.private!==true).slice(0,5).map(p=>({
    repository:cleanObserved(p.name||p.full_name,110),
    description:cleanObserved(p.description,160),
    url:typeof p.url==='string'&&httpsUrl(p.url)?p.url:
      typeof p.html_url==='string'&&httpsUrl(p.html_url)?p.html_url:null,
    evidence:'GitHub-public-observation-only; not confirmation of personal authorship.',
  }));
  return {profile:{
    name:cleanObserved(profile.name,100),
    bio:cleanObserved(profile.bio,260),
    website:typeof profile.blog==='string'&&httpsUrl(profile.blog)?profile.blog:null,
  },projects,observedAt:brief.observedAt||null,
  note:'Public GitHub observations are metadata, not proof of employment, seniority or individual ownership.'};
}
export function makeBiographyGuide(biography,context=null){
  const bio=normalizeBiography(biography?.format===BIOGRAPHY_FORMAT?
    Object.fromEntries(Object.entries(biography).filter(([key])=>
      ['voice','perspective','focus','maxWords','toneNotes','avoid','claims'].includes(key)))
    :biography||{});
  const observed=biographyEvidence(context);
  const queries=[
    ...(observed.profile.bio?[]:['What do you actually build or study, in your own words?']),
    ...(observed.projects.length?[]:['Which real projects can visitors inspect?']),
    ...(bio.claims.length?[]:['Which personal contribution or interest would you like to emphasize?']),
    'Which claims can you verify and which should be removed?',
  ];
  const rules=[
    'Write a new, individual biography, not a copied text or fill-in-the-blank template.',
    'A hiring target is not a current employer or seniority claim.',
    'Prefer specific work, inspected repos and user-approved personal voice over generic slogans.',
    'Mark user-supplied claims as unverified until the owner checks them and their evidence.',
    'No invented metrics, dates, degrees, awards, coauthors, clients or experience.',
    'Honor the requested perspective and avoid list; do not add unwanted badges or animations.',
  ];
  return {format:'gh-aura-bio-guide-v1',biography:bio,observations:observed,
    questions:queries,rules,
    structure:'Choose a fitting original narrative arc; identity → relevant work → evidence/contact are optional elements, not mandatory sections.',
    publishing:'User reviews the original Markdown before any independent CLI publication.'};
}

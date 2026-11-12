import { intentWords, intentMatchScore } from './profile-query.mjs';

export const PROFILE_TECHNIQUES_VERSION='2026-11-12.v1';
const t=(id,title,medium,tags,opts={})=>Object.freeze({
  id,title,medium,tags:Object.freeze(tags),supportedIn:'github-profile-readme',
  fit:'Use only when it improves communication of genuine, relevant work.',
  constraints:'Must remain legible on desktop/mobile and respect GitHub Markdown sanitization.',
  accessibility:'Use meaningful text links and alt text for non-decorative images.',
  thirdParty:false,risk:'low',sourceIds:['github-markdown'],
  ...opts,
});
export const PROFILE_TECHNIQUES=Object.freeze([
 t('identity','Name, specialty and one-line identity','native-gfm',
   ['bio','identity','headline','intro','professional','minimal','barebones','typography'],{
     fit:'State what the person actually builds, not the role they hope to imply they already hold.',
     sourceIds:['github-profile','github-resume']}),
 t('short-biography','Brief original biography','native-gfm',
   ['biography','bio','about','story','writing','minimal','personal'],{
     fit:'One or two concrete sentences grounded in user-confirmed work and public evidence.',
     sourceIds:['github-profile','gh-aura-research']}),
 t('research-biography','Research or systems-focused narrative','native-gfm',
   ['technical','research','engineering','systems','biography','bio','projects'],{
     fit:'Describe genuine specialty, study or collaboration; no invented institution or qualification.',
     sourceIds:['github-resume','gh-aura-research']}),
 t('proof-projects','Two to three inspectable projects','native-gfm',
   ['projects','featured','portfolio','engineering','technical','hiring','minimal'],{
     fit:'Show the real problem, personally verifiable contribution, and direct repository/demo link.',
     sourceIds:['github-resume','github-pins']}),
 t('project-list','Compact project and link list','native-gfm',
   ['links','projects','portfolio','barebones','minimal','list'],{
     fit:'Prioritize one-line project summaries and make verification one click away.'}),
 t('project-table','Structured project comparison','native-gfm',
   ['table','projects','technical','portfolio','grid'],{
     fit:'Use only if comparing several distinct projects; tables can become cramped on mobile.',
     sourceIds:['github-tables']}),
 t('proof-first','Engineering evidence and CI links','native-gfm',
   ['tests','ci','proof','technical','professional','engineering'],{
     fit:'Link to actual tests, CI results and reproducible demos. File presence alone is not proof.',
     sourceIds:['github-actions','github-resume']}),
 t('link-hub','Personal and professional links','native-gfm',
   ['contact','links','portfolio','barebones','minimal','email'],{
     fit:'Use a few user-approved HTTPS links and avoid broadcasting unnecessary personal data.'}),
 t('technologies-text','Verified technology names as text','native-gfm',
   ['skills','stack','technologies','technical','minimal','text'],{
     fit:'Mention technologies only when the person confirms hands-on use.'}),
 t('code-portrait','Original identity presented as a code block','native-gfm',
   ['terminal','code','developer','ascii','bio','creative','expressive'],{
     fit:'A short, original code-like introduction with factual fields, not copied profile source.',
     sourceIds:['github-code-fences']}),
 t('ascii-art','Custom original ASCII or text illustration','native-gfm',
   ['ascii','terminal','retro','pixel','art','visual','barebones'],{
     fit:'Only with an accessible text equivalent; avoid enormous walls of characters.',
     sourceIds:['github-code-fences']}),
 t('blockquote','Short personal statement','native-gfm',
   ['quote','voice','bio','personal','minimal','editorial'],{
     fit:'User-authored or user-approved original statement; no unattributed quotations.'}),
 t('sections-details','Collapsible optional details','native-gfm',
   ['details','collapsible','advanced','projects','technical'],{
     fit:'Keep high-priority work visible; collapse optional depth only.',
     sourceIds:['github-collapsed']}),
 t('alerts','Small, relevant GitHub callout','native-gfm',
   ['alerts','note','status','markdown','professional'],{
     fit:'Use alerts for real caveats or active work; not for decoration.',
     sourceIds:['github-markdown']}),
 t('architecture-diagram','Mermaid diagram for a real system','native-gfm',
   ['diagram','mermaid','architecture','system','technical','engineering'],{
     fit:'Show actual topology; include a text fallback for accessibility.',
     sourceIds:['github-diagrams']}),
 t('light-dark-image','Separate images for light and dark themes','owned-static-asset',
   ['light','dark','theme','image','visual','polish'],{
     fit:'Use real user-owned assets and test readability in both GitHub themes.',
     sourceIds:['github-images']}),
 t('one-hero-image','One original brand/illustration image','owned-static-asset',
   ['hero','banner','illustration','pixel','tarot','visual','expressive','art'],{
     fit:'Use artwork the owner has the rights to use; keep it subordinate to proof of work.',
     sourceIds:['github-images','w3c-alt-text']}),
 t('small-project-screenshot','Screenshot or demo of a real project','owned-static-asset',
   ['screenshot','demo','image','project','proof','technical'],{
     fit:'A current genuine screenshot can be stronger than decorative banners.',
     sourceIds:['github-images','w3c-alt-text']}),
 t('custom-svg','User-owned SVG as a static asset','owned-static-asset',
   ['svg','vector','illustration','diagram','visual','pixel'],{
     fit:'Use static SVG from the repository, not arbitrary embedded scripts or unsupported CSS.',
     sourceIds:['github-images']}),
 t('icon-row','Small row of technology logos','third-party-image',
   ['icons','logos','technologies','stack','visual','expressive'],{
     thirdParty:true,risk:'medium',
     fit:'Only confirmed technologies, small icon count and logo license checks.',
     sourceIds:['simple-icons','devicon','skill-icons']}),
 t('status-badge','Verified status/version badge','third-party-image',
   ['badge','status','ci','shields','technical','visual'],{
     thirdParty:true,risk:'medium',
     fit:'Only link to a genuinely passing build, release or verified metric.',
     sourceIds:['shields','github-actions']}),
 t('stats-card','Optional dynamic project stats','third-party-image',
   ['stats','cards','statistics','contributions','visual','expressive'],{
     thirdParty:true,risk:'high',
     fit:'Prefer GitHub native activity; avoid volatile or misleading dynamic metrics.',
     sourceIds:['github-stats-extended','github-stats-action']}),
 t('streak-card','Optional contribution streak graphic','third-party-image',
   ['streak','activity','chart','statistics','visual'],{
     thirdParty:true,risk:'high',
     fit:'Not a proxy for engineering skill; requires upkeep and external image service.',
     sourceIds:['streak-stats']}),
 t('typing-banner','Optional animated typing title','third-party-image',
   ['typing','gif','animation','hero','expressive','terminal'],{
     thirdParty:true,risk:'high',
     fit:'Avoid by default. Repetitive animation may distract from professional content.',
     sourceIds:['typing-svg']}),
 t('capsule-header','Optional generated decorative header','third-party-image',
   ['banner','hero','gradient','color','expressive'],{
     thirdParty:true,risk:'high',
     fit:'One restrained visual if personally selected; no external media by default.',
     sourceIds:['capsule-render']}),
]);
const directions=['barebones','minimal','technical','expressive'];
export function recommendProfileTechniques({query='',direction='minimal',includeExternal=false,
  limit=10}={}){
  if(!directions.includes(direction))throw Error('Invalid design direction.');
  if(!Number.isInteger(limit)||limit<1||limit>25)
    throw Error('Technique limit must be 1..25.');
  const words=intentWords(query);
  const ranked=PROFILE_TECHNIQUES.filter(t=>includeExternal||!t.thirdParty)
    .map(item=>{const match=intentMatchScore(item,words);
      return {item,match,score:match+(item.tags.includes(direction)?4:0)+
        (item.risk==='low'?2:0)};})
    .filter(x=>!words.length||x.match>0);
  ranked.sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
  const selected=ranked.length?ranked:
    PROFILE_TECHNIQUES.filter(x=>!x.thirdParty).slice(0,6).map(item=>({item}));
  return {version:PROFILE_TECHNIQUES_VERSION,query,direction,includeExternal,
    total:ranked.length,techniques:selected.slice(0,limit).map(x=>x.item),
    note:'Techniques are composable possibilities, not fixed READMEs, and do not authorize copying text, images or unverified claims.'};
}

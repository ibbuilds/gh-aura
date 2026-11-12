import { EXTRA_PROFILE_SOURCES } from './profile-source-extra.mjs';
import { readCustomProfileSources } from './profile-custom-sources.mjs';
import { intentWords,intentMatchScore } from './profile-query.mjs';

/** Offline, versioned citations and design options, never copied README templates.
 * URLs are reading references, not remote assets automatically injected into output.
 */
export const SOURCE_CATALOG_VERSION='2026-11-12.v2';
export const SOURCE_REVIEWED_AT='2026-11-12';
const row=(id,title,category,url,tags,opts={})=>({
  id,title,category,url,tags,trust:opts.trust||'github-official',
  license:opts.license||'read-only documentation; check upstream terms before reuse',
  maintenance:opts.maintenance||'check-upstream-before-reuse',
  checkedAt:SOURCE_REVIEWED_AT,
  externalRequests:opts.externalRequests??false,
  use:opts.use||'Consult the source; do not copy another developer’s profile.',
  example:opts.example||'Link to verified work in native GitHub Markdown.',
  limitations:opts.limitations||'GitHub rendering and availability may change.',
  ...opts,
});
const entries=[
row('github-profile','GitHub Profile README','platform',
 'https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme',
 ['readme','profile','about','original','minimal','barebones'],{
 use:'Check the special USER/USER repository behavior and profile visibility.',
 example:'Keep a brief introduction with inspectable repository links.',
 limitations:'Requires a public username-matching repository; personal data is public.'}),
row('github-markdown','GitHub Flavored Markdown','platform',
 'https://github.github.com/gfm/',
 ['markdown','format','table','link','image','barebones','minimal'],{
 use:'Produce readable GFM without forcing a theme.',
 example:'Use native headings, short paragraphs and [Project](https://github.com/OWNER/REPO).',
 limitations:'Not all HTML/CSS or external embeds render on GitHub.'}),
row('github-markdown-api','GitHub REST Markdown rendering','platform',
 'https://docs.github.com/en/rest/markdown/markdown',
 ['markdown','preview','render','html'],{
 use:'For optional GitHub rendering tests after explicit permission to transmit Markdown.',
 example:'POST markdown to GitHub only when the user authorizes transmitting draft content.',
 externalRequests:true,
 limitations:'Rendering requests may transmit private draft text; local Markdown checks are preferable by default.'}),
row('github-pins','GitHub profile pinned items','platform',
 'https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile',
 ['pins','repository','featured','project','portfolio'],{
 use:'Select up to six relevant public repositories or gists; configure pins in GitHub.',
 example:'Choose three projects that demonstrate specific engineering work.',
 limitations:'Pins require user action in GitHub; GH Aura cannot guarantee pin changes.'}),
row('github-resume','GitHub profile for resume','professional',
 'https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume',
 ['hiring','professional','technical','evidence','minimal'],{
 use:'Prioritize real projects, concise bio and evidence for hiring reviewers.',
 example:'Explain the problem, your verified contribution and where to inspect the outcome.',
 limitations:'Profile appearance does not prove job readiness or hiring outcomes.'}),
row('github-actions','GitHub Actions status checks','engineering',
 'https://docs.github.com/en/actions',
 ['tests','ci','verification','engineering','technical'],{
 use:'Link to genuinely passing automated checks, when they exist.',
 example:'Add a CI status link for one verified project, not a fabricated green badge.',
 limitations:'A workflow file alone does not prove tests pass.'}),
row('github-pages','GitHub Pages','engineering',
 'https://docs.github.com/en/pages',
 ['demo','website','project','portfolio','technical'],{
 use:'Link an independently published, relevant live demo if it exists.',
 example:'Provide the demo URL beside the GitHub repository.',
 limitations:'A deployed page is optional; content may be outdated or unavailable.'}),
row('shields','Shields.io','visual',
 'https://shields.io/docs/',
 ['badge','status','ci','visual','expressive','technical'],{
 trust:'third-party',license:'see Shields.io repository and service terms',
 externalRequests:true,
 use:'Optional small status badge for a verifiable CI or version signal.',
 example:'Prefer one genuine build-status badge over decorative badge grids.',
 limitations:'Remote image requests expose visitor IP/metadata; status source must be real.'}),
row('simple-icons','Simple Icons','visual',
 'https://github.com/simple-icons/simple-icons',
 ['icons','logos','technology','expressive','technical'],{
 trust:'third-party',license:'CC0-1.0 collection; individual logo trademarks/licenses require review',
 externalRequests:true,
 use:'Optional brand icons for a few user-confirmed technologies.',
 example:'Use only logos for actual experience and cite the upstream source.',
 limitations:'Individual trademarks may have separate restrictions; no implicit expertise claim.'}),
row('skill-icons','Skill Icons','visual',
 'https://github.com/tandpfun/skill-icons',
 ['icons','skills','technology','expressive'],{
 trust:'third-party',license:'MIT repository; verify individual brand terms',
 externalRequests:true,
 use:'Optional technology icon row if the user deliberately opts in.',
 example:'Show two or three technologies the owner explicitly confirms.',
 limitations:'External SVG image delivery and third-party uptime; not needed for professional profiles.'}),
row('github-stats-extended','GitHub Stats Extended','visual',
 'https://github.com/stats-organization/github-stats-extended',
 ['statistics','graphs','cards','expressive','visual'],{
 trust:'third-party',license:'verify repository license and deployment terms',
 externalRequests:true,
 use:'Optional activity card, only if it adds useful context.',
 example:'Prefer GitHub’s native contribution graph unless the user requests a card.',
 limitations:'Dynamic image services can fail, expose metadata or display misleading metrics.'}),
row('gh-aura-research','GH Aura ordinary-profile research','professional',
 'https://github.com/ibbuilds/gh-aura/blob/main/research/ORDINARY_STUDY.md',
 ['hiring','minimal','barebones','technical','evidence'],{
 trust:'local-research',license:'GH Aura MIT repository; do not copy individual biographies',
 externalRequests:false,maintenance:'dated structural sample; not a live hiring study',
 use:'Review high-level structural findings rather than copying user identities.',
 example:'Prefer a short introduction and links to demonstrable work.',
 limitations:'Company affiliation is not verified employment; no hiring outcome evidence.'}),
];
export const PROFILE_SOURCES=Object.freeze([...entries,...EXTRA_PROFILE_SOURCES]
  .map(x=>Object.freeze({...x,tags:Object.freeze([...x.tags]),
    sourceType:'curated',
    renderMode:x.externalRequests?'optional-external-reference':'documented-native-link',
    accessibility:'Prefer alt text, readable contrast, descriptive links and mobile-friendly composition.',
  })));
const DIRECTIONS=['barebones','minimal','technical','expressive'];
const registry=(file)=>[...PROFILE_SOURCES,...readCustomProfileSources(file)];
export function findProfileSources({query='',category='',direction='minimal',
  includeExternal=false,limit=8,sourceFile}={}){
  if(typeof category!=='string'||category.length>40)
    throw Error('Invalid source category.');
  if(!DIRECTIONS.includes(direction))
    throw Error('Source direction must be barebones, minimal, technical or expressive.');
  if(!Number.isInteger(limit)||limit<1||limit>50)
    throw Error('Source limit must be 1..50.');
  const words=intentWords(query);
  const scored=[];
  for(const item of registry(sourceFile)){
    if(category&&item.category!==category)continue;
    if(!includeExternal&&['third-party','user-supplied'].includes(item.trust))continue;
    const match=intentMatchScore(item,words);
    if(words.length&&match===0)continue;
    const score=match+(item.tags.includes(direction)?4:0)+
      (item.trust==='github-official'?3:0)+
      (item.trust==='public-standard'?2:0)+
      (item.trust==='local-research'?1:0);
    scored.push({item,score});
  }
  scored.sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
  return {version:SOURCE_CATALOG_VERSION,reviewedAt:SOURCE_REVIEWED_AT,
    query,category,direction,includeExternal,total:scored.length,
    sources:scored.slice(0,limit).map(x=>x.item),
    note:'References only: no external URL is fetched, executed, embedded or copied. Third-party and user-supplied assets require opt-in.'};
}
export function getProfileSource(id,options={}){
  if(typeof id!=='string'||id.length>100)
    throw Error('Invalid source ID.');
  const item=registry(options.sourceFile).find(x=>x.id===id);
  if(!item)throw Error('Unknown source id. Run gh-aura sources list.');
  return item;
}
export function listProfileSources(options={}){
  const sources=registry(options.sourceFile);
  return {version:SOURCE_CATALOG_VERSION,reviewedAt:SOURCE_REVIEWED_AT,
    count:sources.length,customCount:sources.length-PROFILE_SOURCES.length,sources};
}

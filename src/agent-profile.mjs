import { DEFAULT_CONFIG, validateConfig } from './config.mjs';
import { resolveProfileDirection } from './profile-directions.mjs';
import { findProfileSources, getProfileSource } from './profile-sources.mjs';
import { checkDraft } from './editorial.mjs';
import { diffText } from './diff.mjs';
import { normalizeBiography } from './profile-biography.mjs';
import { plain, httpsUrl } from './text.mjs';
import { extractProfileReferences } from './profile-references.mjs';

export const PROFILE_SPEC_FORMAT='gh-aura-profile-spec-v1';
const DIRECTION_NAMES=['barebones','minimal','technical','expressive'];
const SECTION_NAMES=['about','projects','technologies','links','stats','extras'];
const slug=/^[a-z\d_.-]+(?:\/[a-z\d_.-]+)?$/i;
const safeText=(v,n,label)=>{
  if(typeof v!=='string'||v.length>n||plain(v)!==v)
    throw Error(label+' must be plain text under '+n+' characters.');
  return v;
};
const names=(items,kind,max)=> {
  if(!Array.isArray(items)||items.length>max||items.some(x=>typeof x!=='string'||x.length>110||
    (kind==='repo'&&!slug.test(x))||plain(x)!==x))
    throw Error('Invalid '+kind+' list.');
  return [...new Set(items)];
};
function validateLinks(links){
  if(!Array.isArray(links)||links.length>20)
    throw Error('Profile links must be an array with up to 20 items.');
  return links.map(link=>{
    if(!link||typeof link!=='object'||Array.isArray(link)||
       Object.keys(link).some(k=>!['label','url'].includes(k)))
      throw Error('Profile links need only a label and HTTPS URL.');
    const label=safeText(link.label,80,'Link label');
    const url=safeText(link.url,500,'Link URL');
    if(!label||!httpsUrl(url))throw Error('Profile link must contain a label and safe HTTPS URL.');
    return {label,url};
  });
}
function bioControls(raw,direction){
  if(raw?.format==='gh-aura-biography-v1'){
    const allowed=['voice','perspective','focus','maxWords','toneNotes','avoid','claims'];
    return normalizeBiography(Object.fromEntries(
      Object.entries(raw).filter(([key])=>allowed.includes(key))),direction);
  }
  return normalizeBiography(raw||{},direction);
}
function validateMedia(media){
  if(!Array.isArray(media)||media.length>8)
    throw Error('Profile media references must be at most eight.');
  return media.map(item=>{
    if(!item||typeof item!=='object'||Array.isArray(item)||
       Object.keys(item).some(k=>!['url','alt','rights'].includes(k)))
      throw Error('Media reference needs only HTTPS URL, alt and rights.');
    const url=safeText(item.url,600,'Media URL');
    const alt=safeText(item.alt,200,'Media alt text');
    const rights=item.rights||'unverified';
    if(!httpsUrl(url)||!alt||!['user-owned','permitted-license','unverified'].includes(rights))
      throw Error('Media reference requires safe HTTPS, alt text and declared rights.');
    return {url,alt,rights};
  });
}
export function makeProfileSpec(options={},config=DEFAULT_CONFIG){
  validateConfig(config);
  const direction=options.direction||config.editorial.direction||'minimal';
  const intent=resolveProfileDirection(direction);
  const role=safeText(options.goal??config.editorial.targetRole??'',160,'Target role');
  const language=options.language||config.editorial.language;
  if(!['en','es'].includes(language))throw Error('Profile language must be en or es.');
  const maxWords=options.maxWords??config.editorial.maxWords;
  if(!Number.isInteger(maxWords)||maxWords<30||maxWords>1000)
    throw Error('Profile word target must be 30..1000.');
  const includeExternal=options.includeExternal===true;
  const sections={...Object.fromEntries(SECTION_NAMES.map(k=>[k,
    k==='about'||k==='projects'||k==='links'||k==='extras'])),
    ...config.profile.sections,...options.sections};
  for(const [key,value] of Object.entries(sections)){
    if(!SECTION_NAMES.includes(key)||typeof value!=='boolean')
      throw Error('Profile sections must be approved boolean toggles.');
  }
  const maxProjects=options.maxProjects??config.profile.maxProjects;
  if(!Number.isInteger(maxProjects)||maxProjects<0||maxProjects>6)
    throw Error('Profile maxProjects must be 0..6.');
  const featured=names(options.featured??config.profile.featured,'repo',6);
  const links=validateLinks(options.links??config.profile.links);
  const notes=safeText(options.notes??'',700,'Editorial notes');
  const visualBrief=safeText(options.visualBrief??'',1000,'Visual design brief');
  const mediaReferences=validateMedia(options.mediaReferences??[]);
  const biography=bioControls(options.biography,direction);
  const recommended=findProfileSources({query:role,direction,
    includeExternal,limit:6}).sources;
  const fallbacks=recommended.length?recommended:
    findProfileSources({direction,includeExternal,limit:6}).sources;
  return {
    format:PROFILE_SPEC_FORMAT,
    purpose:'Create a custom, evidence-grounded GitHub README for the owner’s chosen goal. This is editable intent, not a Markdown template or a hiring-only workflow.',
    direction:intent.name,language,goal:role,maxWords,sections,maxProjects,featured,links,
    visualBrief,mediaReferences,biography,
    includeExternal,sourceIds:fallbacks.map(x=>x.id),notes,
    design:intent, provenance:{
      publicGitHub:'observations only; fetch at use time',
      userSelections:'unverified until owner confirms',
      unknown:'leave out or ask; never fabricate',
    },
    workflow:['inspect','choose sources','draft original Markdown','validate','show diff','human approve separately'],
    publication:'No autonomous publish; run gh-aura preview --file draft.md --save review.json and independently approve apply.',
  };
}
export function validateProfileSpec(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    input.format!==PROFILE_SPEC_FORMAT)throw Error('Invalid profile spec format.');
  if(!DIRECTION_NAMES.includes(input.direction))throw Error('Invalid spec direction.');
  const goal=safeText(input.goal,160,'Target role');
  const notes=safeText(input.notes,700,'Editorial notes');
  const visualBrief=safeText(input.visualBrief??'',1000,'Visual design brief');
  const mediaReferences=validateMedia(input.mediaReferences??[]);
  const biography=bioControls(input.biography,input.direction);
  if(!['en','es'].includes(input.language)||!Number.isInteger(input.maxWords)||
    input.maxWords<30||input.maxWords>1000)
    throw Error('Invalid spec language or word budget.');
  if(typeof input.includeExternal!=='boolean'||!Number.isInteger(input.maxProjects)||
    input.maxProjects<0||input.maxProjects>6)throw Error('Invalid spec presentation controls.');
  const c=input.sections;
  if(!c||typeof c!=='object'||Array.isArray(c)||
    Object.entries(c).some(([k,v])=>!SECTION_NAMES.includes(k)||typeof v!=='boolean'))
    throw Error('Invalid spec section switches.');
  const featured=names(input.featured,'repo',6);
  const links=validateLinks(input.links);
  const sourceIds=names(input.sourceIds,'source',50);
  for(const id of sourceIds) {
    const source=getProfileSource(id);
    if(!input.includeExternal&&['third-party','user-supplied'].includes(source.trust))
      throw Error('An external source cannot be enabled without opt-in.');
  }
  return {...input,goal,notes,visualBrief,mediaReferences,biography,
    sections:{...c},featured,sourceIds,links,
    design:resolveProfileDirection(input.direction)};
}
export function refineProfileSpec(input,changes={}){
  const current=validateProfileSpec(input);
  const allowed=['direction','goal','language','maxWords','sections','maxProjects',
    'featured','links','includeExternal','sourceIds','notes',
    'visualBrief','mediaReferences','biography'];
  if(!changes||typeof changes!=='object'||Array.isArray(changes)||
    Object.keys(changes).some(k=>!allowed.includes(k)))
    throw Error('Profile refinement can change only approved spec fields.');
  const next={...current,...changes,sections:{...current.sections,...(changes.sections||{})},
    biography:{...current.biography,...(changes.biography||{})}};
  if(Object.hasOwn(changes,'direction'))next.design=resolveProfileDirection(changes.direction);
  if(changes.includeExternal===false && !Object.hasOwn(changes,'sourceIds')){
    next.sourceIds=next.sourceIds.filter(id=>getProfileSource(id).trust!=='third-party');
  }
  return validateProfileSpec(next);
}
export function compositionFromSpec(input){
  if(input?.composition){
    if(input.format&&input.format!=='gh-aura-whole-profile-v1')throw Error('Unsupported whole-profile version.');
    return validateProfileSpec(input.composition);
  }
  return validateProfileSpec(input);
}
export function validateProfileDraft(markdown,spec,options={}){
  if(typeof markdown!=='string'||Buffer.byteLength(markdown,'utf8')>256*1024)
    throw Error('Profile draft must be <=256 KiB.');
  if(plain(markdown)!==markdown)throw Error('Profile draft has control characters.');
  const validated=spec?compositionFromSpec(spec):null;
  const report=checkDraft(markdown,null,{maxWords:validated?.maxWords??220});
  if(validated){
    const refs=extractProfileReferences(markdown),links=refs.filter(r=>r.kind==='link');
    const parsed=links.flatMap(r=>{try{return [new URL(r.url)];}catch{return [];}});
    const add=(id,message,severity='error')=>report.findings.push({id,message,severity});
    if(validated.sections.projects!==false)for(const name of validated.featured.slice(0,validated.maxProjects)){
      const wanted=(name.includes('/')?name:options.username?options.username+'/'+name:null)?.toLowerCase();
      const found=parsed.some(u=>u.hostname==='github.com'&&(wanted?u.pathname.toLowerCase().replace(/^\//,'').split('/').slice(0,2).join('/')===wanted:u.pathname.split('/')[2]?.toLowerCase()===name.toLowerCase()));
      if(!found)add('selected-project-missing','Selected project is missing from visible links: '+name+'.');
    }
    if(validated.sections.links!==false)for(const link of validated.links){
      if(!parsed.some(u=>u.href===new URL(link.url).href))add('selected-link-missing','Selected contact link is missing: '+link.label+'.');
    }
    for(const ref of refs)if(ref.kind==='image'&&/^(?:javascript|data|file):/i.test(ref.url))add('unsafe-image','Remove executable, inline-data or local-file image references.');
    const headings=markdown.replace(/<!--[\s\S]*?-->/g,'').split('\n').filter(l=>/^#{1,6}\s/.test(l));
    const labels={projects:/^#{1,6}\s+(?:selected work|featured work|projects|proyectos(?: destacados)?|trabajo seleccionado)\s*$/i,
      technologies:/^#{1,6}\s+(?:technologies|tech stack|tecnolog[ií]as)\s*$/i,stats:/^#{1,6}\s+(?:stats|statistics|estad[ií]sticas|public repository snapshot|resumen de repositorios p[uú]blicos)\s*$/i};
    for(const [section,pattern] of Object.entries(labels))if(validated.sections[section]===false&&headings.some(h=>pattern.test(h)))add('disabled-section','Review the disabled '+section+' section still present in the draft.','review');
    report.status=report.findings.length?'needs-review':'no-heuristic-findings';
  }
  return {format:'gh-aura-draft-validation-v1',...report,
    direction:validated?.direction??null,
    note:'Heuristic checks cannot prove originality, personal ownership or GitHub rendering. Review the draft yourself.'};
}
export function previewProfileDiff(before,after){
  if(typeof before!=='string'||typeof after!=='string'||
    Buffer.byteLength(before,'utf8')>256*1024||Buffer.byteLength(after,'utf8')>256*1024)
    throw Error('Profile diff inputs exceed 256 KiB.');
  if(plain(before)!==before||plain(after)!==after)
    throw Error('Profile diff contains control characters.');
  return {format:'gh-aura-diff-v1',changed:before!==after,diff:diffText(before,after),
    publication:'Read-only preview: no approval code, review file or remote write is generated by an AI tool.'};
}

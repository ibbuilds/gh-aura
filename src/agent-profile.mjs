import { DEFAULT_CONFIG, validateConfig } from './config.mjs';
import { resolveProfileDirection } from './profile-directions.mjs';
import { findProfileSources, getProfileSource } from './profile-sources.mjs';
import { checkDraft } from './editorial.mjs';
import { diffText } from './diff.mjs';
import { plain } from './text.mjs';

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
  const notes=safeText(options.notes??'',700,'Editorial notes');
  const recommended=findProfileSources({query:role,direction,
    includeExternal,limit:6}).sources;
  const fallbacks=recommended.length?recommended:
    findProfileSources({direction,includeExternal,limit:6}).sources;
  return {
    format:PROFILE_SPEC_FORMAT,
    purpose:'Create a custom, evidence-grounded, hiring-oriented GitHub README. This is an editable intent, not a Markdown template.',
    direction:intent.name,language,goal:role,maxWords,sections,maxProjects,featured,
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
  const sourceIds=names(input.sourceIds,'source',20);
  for(const id of sourceIds) {
    const source=getProfileSource(id);
    if(!input.includeExternal&&source.trust==='third-party')
      throw Error('An external source cannot be enabled without opt-in.');
  }
  return {...input,goal,notes,sections:{...c},featured,sourceIds,
    design:resolveProfileDirection(input.direction)};
}
export function refineProfileSpec(input,changes={}){
  const current=validateProfileSpec(input);
  const allowed=['direction','goal','language','maxWords','sections','maxProjects',
    'featured','includeExternal','sourceIds','notes'];
  if(!changes||typeof changes!=='object'||Array.isArray(changes)||
    Object.keys(changes).some(k=>!allowed.includes(k)))
    throw Error('Profile refinement can change only approved spec fields.');
  const next={...current,...changes,sections:{...current.sections,...(changes.sections||{})}};
  if(Object.hasOwn(changes,'direction'))next.design=resolveProfileDirection(changes.direction);
  if(changes.includeExternal===false && !Object.hasOwn(changes,'sourceIds')){
    next.sourceIds=next.sourceIds.filter(id=>getProfileSource(id).trust!=='third-party');
  }
  return validateProfileSpec(next);
}
export function validateProfileDraft(markdown,spec){
  if(typeof markdown!=='string'||Buffer.byteLength(markdown,'utf8')>256*1024)
    throw Error('Profile draft must be <=256 KiB.');
  if(plain(markdown)!==markdown)throw Error('Profile draft has control characters.');
  const validated=spec?validateProfileSpec(spec):null;
  const report=checkDraft(markdown,null,{maxWords:validated?.maxWords??220});
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

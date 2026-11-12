import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { PROFILE_SOURCES, findProfileSources, getProfileSource } from './profile-sources.mjs';
import { makeProfileSpec, refineProfileSpec, validateProfileDraft, previewProfileDiff } from './agent-profile.mjs';
import { ACHIEVEMENT_MATRIX } from './achievement-matrix.mjs';
import { profileTarget } from './workflow.mjs';
import { validateLogin } from './github.mjs';

export const AGENT_INTERFACE_VERSION='gh-aura-agent-v1';
const properties=(shape,required=[])=>({
  type:'object',properties:shape,required,additionalProperties:false,
});
const str=(description,maxLength=160)=>({type:'string',description,maxLength});
const optUser={user:str('Public GitHub username; omit to use local config.',39)};
const art={direction:{type:'string',enum:['barebones','minimal','technical','expressive']}};
const tools=[
  ['gh_aura_sources_search','Search curated GitHub README resources; no links are embedded or fetched automatically.',
    properties({query:str('Goal, keyword or resource to find',200),category:str('Source category',30),...art,
      includeExternal:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:25}})],
  ['gh_aura_sources_get','Inspect attribution, licensing, trust and usage limitations for one source.',
    properties({id:str('Source ID',80)},['id'])],
  ['gh_aura_profile_plan','Create a customizable profile intent specification, not a fixed Markdown template.',
    properties({...art,goal:str('Target engineering role, not claimed employment'),language:{type:'string',enum:['en','es']},
      maxWords:{type:'integer',minimum:30,maximum:1000},
      maxProjects:{type:'integer',minimum:0,maximum:6},includeExternal:{type:'boolean'},
      notes:str('User editing preferences',700),
      sections:{type:'object',additionalProperties:{type:'boolean'}},
      featured:{type:'array',maxItems:6,items:str('Selected repository name',110)}})],
  ['gh_aura_profile_refine','Revise an existing profile intent without losing unrelated preferences.',
    properties({spec:{type:'object'},changes:{type:'object'}},['spec','changes'])],
  ['gh_aura_profile_context','Read verified public GitHub profile/repository context for evidence-aware writing.',
    properties({...optUser,...art})],
  ['gh_aura_profile_prompt','Produce an original writing brief usable by any AI model. No AI service is called.',
    properties({...optUser,...art})],
  ['gh_aura_profile_validate','Run local heuristic checks on a Markdown draft; not a factuality certificate.',
    properties({markdown:str('Proposed original Markdown',100000),spec:{type:'object'}},['markdown'])],
  ['gh_aura_profile_diff','Compare two Markdown drafts locally; produces no approval token.',
    properties({before:str('Existing Markdown',100000),after:str('Proposed Markdown',100000)},['before','after'])],
  ['gh_aura_profile_preview','Read the public USER/USER README live and show a diff; never produce an approval token.',
    properties({...optUser,markdown:str('Proposed Markdown',100000)},['markdown'])],
  ['gh_aura_pins_rank','Rank public projects to feature; user still pins them on GitHub.',
    properties({...optUser,goal:str('Target role',160)})],
  ['gh_aura_audit','Read-only public GitHub project/profile evidence and recommendations.',
    properties({...optUser,goal:str('Target role',160)})],
  ['gh_aura_activity_read','Read actual observed contribution history; no synthetic writes.',
    properties({...optUser,year:{type:'integer',minimum:2008,maximum:2100}})],
  ['gh_aura_activity_plan','Plan synthetic private practice offline; never apply to GitHub.',
    properties({year:{type:'integer',minimum:2008,maximum:2100},
      density:{type:'integer',minimum:0,maximum:100}},['year'])],
  ['gh_aura_badges_catalog','Inspect the source-attributed achievement catalog and eligibility caveats.',
    properties({})],
  ['gh_aura_badges_plan','Plan bounded private workspace exercise attempts offline; never apply.',
    properties({tier:{type:'string',enum:['base','bronze','silver','gold']},
      strategy:{type:'string',enum:['rest','git-batch']},repo:str('Owned private GH Aura workspace OWNER/NAME',120)})],
  ['gh_aura_badges_status','Read events from the authenticated, marked private badge workspace; cannot confirm awarded badges.',
    properties({repo:str('Owned, marked private workspace OWNER/NAME',120)})],
];
export const AGENT_TOOL_DEFINITIONS=Object.freeze(tools.map(([name,description,inputSchema])=>({
  name,title:name.replaceAll('_',' '),description,inputSchema,
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
})));
export function agentCapabilities(){
  return {format:AGENT_INTERFACE_VERSION,transport:['CLI','Agent Skills','MCP stdio 2026-07-28 and legacy 2025-11-25'],
    tools:AGENT_TOOL_DEFINITIONS,resources:[
      'gh-aura://sources/catalog','gh-aura://guide/profile','gh-aura://capabilities'],
    prompts:['create_professional_profile','refine_existing_profile','compare_profile_directions'],
    writesExposed:false,aiProviderRequired:false,runtimeDependencies:0,
    publication:'No publishing tool is exposed to the AI. A human must inspect a real draft file, run gh-aura preview --file draft.md --save review.json, and independently execute gh-aura apply --review review.json --pr.',
    caveat:'Agent tools expose public data and explicit private workspace status only. No GitHub achievement awards are guaranteed.'};
}
function actualUser(value){
  if(value===undefined||value==='') {
    const user=loadConfig().user;
    if(!user)throw Error('Set gh-aura init USER or supply user explicitly.');
    return validateLogin(user);
  }
  return validateLogin(value);
}
function runCliJson(tokens,{text=false}={}){
  const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
  const child=spawnSync(process.execPath,[cli,...tokens],{
    cwd:process.cwd(),env:{...process.env},encoding:'utf8',
    input:'',timeout:45000,maxBuffer:512*1024,windowsHide:true,
    stdio:['ignore','pipe','pipe'],
  });
  if(child.status!==0||child.error){
    const cleaned=String(child.stderr||child.error?.message||'').slice(0,400)
      .replace(/Bearer\s+\S+/g,'Bearer [REDACTED]');
    throw Error('GH Aura read-only operation failed: '+(cleaned||'check account, network and permissions.'));
  }
  if(text)return child.stdout.slice(0,60000);
  try{return JSON.parse(child.stdout);}
  catch{throw Error('GH Aura did not produce a valid bounded JSON response.');}
}
export async function runAgentTool(name,args={}){
  if(!AGENT_TOOL_DEFINITIONS.some(x=>x.name===name))
    throw Error('Unknown or unauthorized GH Aura agent tool.');
  if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Tool arguments must be an object.');
  // Validate argument names, not just the JSON Schema presented to the model.
  const schema=AGENT_TOOL_DEFINITIONS.find(x=>x.name===name).inputSchema;
  if(Object.keys(args).some(key=>!Object.hasOwn(schema.properties,key))||
      (schema.required||[]).some(key=>args[key]===undefined))
    throw Error('Unexpected or missing GH Aura agent tool arguments.');
  if(name==='gh_aura_sources_search')
    return findProfileSources(args);
  if(name==='gh_aura_sources_get')
    return getProfileSource(args.id);
  if(name==='gh_aura_profile_plan')
    return makeProfileSpec(args,loadConfig());
  if(name==='gh_aura_profile_refine')
    return refineProfileSpec(args.spec,args.changes);
  if(name==='gh_aura_profile_validate')
    return validateProfileDraft(args.markdown,args.spec);
  if(name==='gh_aura_profile_diff')
    return previewProfileDiff(args.before,args.after);
  if(name==='gh_aura_profile_preview'){
    const target=await profileTarget(actualUser(args.user));
    return {...previewProfileDiff(target.content,args.markdown),
      repository:target.repo,branch:target.branch,readOnly:true,
      next:'Ask the user to inspect the draft, save it locally, then separately run gh-aura preview --file draft.md --save review.json and gh-aura apply --review review.json --pr.'};
  }
  if(name==='gh_aura_badges_catalog')
    return {entries:ACHIEVEMENT_MATRIX,
      notice:'Eligibility and tier estimates are informational. GitHub awards are never guaranteed.'};
  if(name==='gh_aura_badges_status'){
    const {inspectBadgeWorkspace}=await import('./badge-run.mjs');
    const report=await inspectBadgeWorkspace({repo:args.repo});
    return {repository:report.repository,observed:report.observed,status:report.status,
      verify:report.verify,readOnly:true,
      note:'No profile award verification or private repository content is exported.'};
  }
  if(name==='gh_aura_profile_context'||name==='gh_aura_profile_prompt'){
    const tokens=['brief',actualUser(args.user),
      ...(args.direction?['--direction',args.direction]:[]),
      ...(name==='gh_aura_profile_prompt'?['--prompt']:['--json'])];
    return runCliJson(tokens,{text:name==='gh_aura_profile_prompt'});
  }
  if(name==='gh_aura_pins_rank')
    return runCliJson(['pins',actualUser(args.user),...(args.goal?['--goal',args.goal]:[]),'--json']);
  if(name==='gh_aura_audit')
    return runCliJson(['audit',actualUser(args.user),...(args.goal?['--goal',args.goal]:[]),'--json']);
  if(name==='gh_aura_activity_read')
    return runCliJson(['contributions',actualUser(args.user),
      ...(args.year?['--year',String(args.year)]:[]),'--json']);
  if(name==='gh_aura_activity_plan')
    return runCliJson(['activity','plan',String(args.year),
      ...(args.density!==undefined?['--density',String(args.density)]:[])]);
  if(name==='gh_aura_badges_plan')
    return runCliJson(['badges','auto','plan',
      ...(args.tier?['--tier',args.tier]:[]),
      ...(args.strategy?['--strategy',args.strategy]:[]),
      ...(args.repo?['--repo',args.repo]:[])]);
  throw Error('Agent tool was not implemented.');
}

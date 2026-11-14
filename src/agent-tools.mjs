import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { findProfileSources, getProfileSource } from './profile-sources.mjs';
import { recommendProfileTechniques } from './profile-techniques.mjs';
import { PROFILE_SOURCE_STUDY } from './profile-research.mjs';
import { listCuratedProfiles, recommendCuratedPatterns } from './profile-patterns.mjs';
import { professionalReview } from './profile-review.mjs';
import { HOLISTIC_STYLES,PROFILE_FACETS,PROFILE_PURPOSES } from './holistic-profile-taxonomy.mjs';
import { makeBiographyGuide } from './profile-biography.mjs';
import { makeProfileSpec, refineProfileSpec, validateProfileSpec, validateProfileDraft, previewProfileDiff } from './agent-profile.mjs';
import { ACHIEVEMENT_MATRIX } from './achievement-matrix.mjs';
import { planCollaborationCampaign } from './badge-collaboration-campaign.mjs';
import { projectImprovements } from './project-improvements.mjs';
import { auditPatternStudy } from './pattern-library.mjs';
import { profileTarget } from './workflow.mjs';
import { validateLogin } from './github.mjs';
import { makeWholeProfileSpec, refineWholeProfileSpec, inspectWholeProfile, prepareProfilePlan,
  previewWholeProfilePlan, executeProfilePlan, approvedPlanFromHost,profileExecutionStatus,readProfileJSON } from './profile-plan.mjs';
import { scanPublicProjects, inspectPublicProject, inspectCurrentPins } from './profile-projects.mjs';
import { wholeProfileContext,nativeProfileDraft } from './profile-context.mjs';
import { checkProfileResources } from './profile-resources.mjs';
import { previewCalendar } from './calendar-preview.mjs';

export const AGENT_INTERFACE_VERSION='gh-aura-agent-v1';
const properties=(shape,required=[])=>({
  type:'object',properties:shape,required,additionalProperties:false,
});
const str=(description,maxLength=160)=>({type:'string',description,maxLength});
const optUser={user:str('Public GitHub username; omit to use local config.',39)};
const art={direction:{type:'string',enum:['barebones','minimal','technical','expressive']}};
const tools=[
  ['gh_aura_editorial_progress','Summarize gaps in the local research review file independently selected by the owner through GH_AURA_EDITORIAL_FILE. Returns counts and bounded missing-field samples, never raw review notes; cannot approve or activate patterns.',
    properties({limit:{type:'integer',minimum:1,maximum:50}})],
  ['gh_aura_project_improvements','Read bounded public project writing context, or supply exact description/topics/README changes and per-field reasons for separate reviewable proposals. Never publishes or authorizes changes.',
    properties({repo:str('Public project OWNER/REPO',140),changes:{type:'object'}},['repo'])],
  ['gh_aura_activity_preview','Compare supplied/unknown baseline counts and projected synthetic additions for one UTC year. Optional original SVG is illustrative, not a GitHub color guarantee.',
    properties({plan:{type:'object'},year:{type:'integer',minimum:2008,maximum:2100},svg:{type:'boolean'}},['plan'])],
  ['gh_aura_profile_native_draft','Generate native GitHub Markdown using the shared whole-profile intent and observed public projects; no publication or AI service.',
    properties({...optUser,spec:{type:'object'}},['spec'])],
  ['gh_aura_profile_resources_check','Check README resource metadata through bounded anonymous public HTTPS requests. Blocks private/local destinations; retains no remote body or credentials.',
    properties({markdown:str('README to check',100000),baseUrl:str('Public README URL used to resolve relative paths',2000),spec:{type:'object'}},['markdown'])],
  ['gh_aura_whole_profile_context','Build compact public evidence and writing guidance honoring the full shared intent, explicit projects and style.',
    properties({...optUser,spec:{type:'object'}},['spec'])],
  ['gh_aura_whole_profile_spec','Create or refine shared intent for README, sidebar account fields, assets, pins and optional workspace goals.',
    properties({spec:{type:'object'},changes:{type:'object'}})],
  ['gh_aura_whole_profile_inspect','Inspect public sidebar fields, profile repository and exact README/default branch revisions.',properties({...optUser})],
  ['gh_aura_whole_profile_plan','Build an exact read-only change plan from shared intent and original Markdown; never authorize it.',
    properties({...optUser,spec:{type:'object'},markdown:str('Original README; omit to leave it unchanged',100000),resources:{type:'boolean',description:'Opt into anonymous checks of public link/image metadata'},delivery:{type:'string',enum:['pr','commit']}},['spec'])],
  ['gh_aura_whole_profile_preview','Show reviewed field differences and file diffs from a plan without any remote writes.',properties({plan:{type:'object'}},['plan'])],
  ['gh_aura_projects_scan','Rank a bounded page range of public projects for a goal. Continue with nextCursor until coverage is complete.',
    properties({...optUser,goal:str('Target role',160),cursor:{type:'integer',minimum:1,maximum:100},pages:{type:'integer',minimum:1,maximum:20},inspect:{type:'integer',minimum:0,maximum:6}})],
  ['gh_aura_project_evidence','Inspect one explicitly chosen public repository, its README and source/test structure; does not execute code.',
    properties({repository:str('Public OWNER/REPO',140)},['repository'])],
  ['gh_aura_pins_current','Read currently visible pinned repositories/gists using public GraphQL; does not change them.',properties({...optUser})],
  ['gh_aura_sources_search','Search curated GitHub README resources; no links are embedded or fetched automatically.',
    properties({query:str('Goal, keyword or resource to find (Spanish or English)',400),category:str('Source category',40),...art,
      includeExternal:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:50}})],
  ['gh_aura_sources_get','Inspect attribution, licensing, trust and usage limitations for one source.',
    properties({id:str('Source ID',80)},['id'])],
  ['gh_aura_design_recommend','Combine GitHub-compatible layout techniques with source links for a natural-language design request; no template or image is downloaded.',
    properties({query:str('Requested visual effect, density, biography, or composition (Spanish or English)',400),...art,
      includeExternal:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:25}})],
  ['gh_aura_profile_categories','Describe eight whole-profile styles and facets; the old 25 list is provisional, not category winners.',properties({})],
  ['gh_aura_profiles_list','List the 25 selected public README references for human inspection; no copies or external fetch.',
    properties({query:str('Filter references by theme or role',400),
      direction:{type:'string',enum:['barebones','minimal','technical','expressive']}})],
  ['gh_aura_patterns_recommend','Recommend at most two original composition patterns from selected references. Read-only.',
    properties({query:str('User design intent or role',400),...art,
      limit:{type:'integer',minimum:1,maximum:2}})],
  ['gh_aura_profile_professional_review','Run offline, goal-aware README quality heuristics without an invented recruiter score.',
    properties({markdown:str('Proposed profile README',100000),
      goal:{type:'string',enum:['general','hiring','research','open-source','creative']}},['markdown'])],
  ['gh_aura_biography_guide','Develop a unique professional biography from declared voice, perspective and evidence without inventing career claims.',
    properties({spec:{type:'object'},context:{type:'object'}})],
  ['gh_aura_profile_plan','Create a customizable profile intent specification, not a fixed Markdown template.',
    properties({...art,goal:str('Target engineering role, not claimed employment'),language:{type:'string',enum:['en','es']},
      maxWords:{type:'integer',minimum:30,maximum:1000},
      maxProjects:{type:'integer',minimum:0,maximum:6},includeExternal:{type:'boolean'},
      notes:str('User editing preferences',700),
      visualBrief:str('Freeform visual and composition requirements; no fixed template',1000),
      biography:{type:'object',description:'Voice, perspective, focus, word budget, tone notes and user-supplied claims'},
      mediaReferences:{type:'array',maxItems:8,items:{type:'object',
        properties:{url:str('HTTPS media URL',600),alt:str('Alternative text',200),
          rights:{type:'string',enum:['user-owned','permitted-license','unverified']}},
        required:['url','alt'],additionalProperties:false}},
      sections:{type:'object',additionalProperties:{type:'boolean'}},
      featured:{type:'array',maxItems:6,items:str('Selected repository name',110)},
      links:{type:'array',maxItems:20,items:{type:'object',
        properties:{label:str('Contact link label',80),url:str('HTTPS link',500)},
        required:['label','url'],additionalProperties:false}}})],
  ['gh_aura_profile_refine','Revise an existing profile intent without losing unrelated preferences.',
    properties({spec:{type:'object'},changes:{type:'object'}},['spec','changes'])],
  ['gh_aura_profile_context','Read verified public GitHub profile/repository context for evidence-aware writing.',
    properties({...optUser,...art,includeExternal:{type:'boolean'}})],
  ['gh_aura_profile_prompt','Produce an original writing brief usable by any AI model. No AI service is called.',
    properties({...optUser,...art,includeExternal:{type:'boolean'}})],
  ['gh_aura_profile_validate','Run local heuristic checks on a Markdown draft; not a factuality certificate.',
    properties({...optUser,markdown:str('Proposed original Markdown',100000),spec:{type:'object'}},['markdown'])],
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
  ['gh_aura_badges_collaboration_campaign','Plan exact coauthor or Q&A exercises for two consenting accounts. One owner-authorized whole-profile plan can run the campaign; actual awards gate tiers. Offline and read-only.',
    properties({repo:str('Existing owned marked private workspace OWNER/REPO',120),collaborator:str('Distinct authorized second account',39),consent:{type:'boolean'},
      kind:{type:'string',enum:['coauthor','discussion-answer']},tier:{type:'string',enum:['base','bronze','silver','gold']},
      exercises:{type:'array',minItems:1,maxItems:48,items:properties({content:str('Exact coauthor exercise content',12000),question:str('Exact private question',4000),answer:str('Exact reviewed answer',8000)})}},['repo','collaborator','consent','kind','exercises'])],
  ['gh_aura_badges_plan','Plan bounded private workspace exercise attempts offline; never apply.',
    properties({tier:{type:'string',enum:['base','bronze','silver','gold']},
      strategy:{type:'string',enum:['rest','git-batch']},repo:str('Owned private GH Aura workspace OWNER/NAME',120)})],
  ['gh_aura_badges_status','Read events from the authenticated, marked private badge workspace; cannot confirm awarded badges.',
    properties({repo:str('Owned, marked private workspace OWNER/NAME',120)})],
];
export const AGENT_TOOL_DEFINITIONS=Object.freeze(tools.map(([name,description,inputSchema])=>({
  name,title:name.replaceAll('_',' '),description,inputSchema,
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:['gh_aura_profile_resources_check','gh_aura_whole_profile_plan','gh_aura_project_improvements'].includes(name)},
})));
const APPROVED_EXECUTION_TOOL=Object.freeze({name:'gh_aura_apply_approved_profile',title:'Apply owner-approved profile plan',
  description:'Execute only the exact plan pinned in owner/host configuration. Cannot choose a plan/path or create approval. May create the reviewed public profile repository, publish README/assets and update reviewed account fields.',
  inputSchema:properties({}),annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:true}});
const APPROVED_STATUS_TOOL=Object.freeze({name:'gh_aura_approved_profile_status',title:'Read approved plan status',
  description:'Read local progress only for the plan pinned by the owner/host; does not authorize or execute it.',
  inputSchema:properties({}),annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}});
export function getAgentToolDefinitions(env=process.env){
  return env.GH_AURA_APPROVED_PLAN&&/^[a-f\d]{64}$/.test(env.GH_AURA_APPROVED_FINGERPRINT||'')
    ?[...AGENT_TOOL_DEFINITIONS,APPROVED_EXECUTION_TOOL,APPROVED_STATUS_TOOL]:AGENT_TOOL_DEFINITIONS;
}
export function agentCapabilities(){
  return {format:AGENT_INTERFACE_VERSION,transport:['CLI','Agent Skills','MCP stdio 2026-07-28 and legacy 2025-11-25'],
    tools:getAgentToolDefinitions(),resources:[
      'gh-aura://sources/catalog','gh-aura://techniques/catalog','gh-aura://profiles/selected',
      'gh-aura://guide/profile','gh-aura://guide/biography',
      'gh-aura://capabilities'],
    prompts:['create_professional_profile','refine_existing_profile',
      'compare_profile_directions','write_original_biography'],
    writesExposed:getAgentToolDefinitions().some(x=>x.annotations.readOnlyHint===false),aiProviderRequired:false,runtimeDependencies:0,
    publication:'Read-only by default. The owner/host can pin one reviewed plan and fingerprint to expose only its execution. Agent tools cannot mint approval. Legacy independent preview/apply remains supported.',
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
  const definitions=getAgentToolDefinitions();
  if(!definitions.some(x=>x.name===name))
    throw Error('Unknown or unauthorized GH Aura agent tool.');
  if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Tool arguments must be an object.');
  // Validate argument names, not just the JSON Schema presented to the model.
  const schema=definitions.find(x=>x.name===name).inputSchema;
  if(Object.keys(args).some(key=>!Object.hasOwn(schema.properties,key))||
      (schema.required||[]).some(key=>args[key]===undefined))
    throw Error('Unexpected or missing GH Aura agent tool arguments.');
  if(name==='gh_aura_apply_approved_profile'){
    const plan=approvedPlanFromHost();
    const {journal,...result}=await executeProfilePlan(plan,process.env.GH_AURA_APPROVED_FINGERPRINT);
    return result;
  }
  if(name==='gh_aura_approved_profile_status')return profileExecutionStatus(approvedPlanFromHost());
  if(name==='gh_aura_whole_profile_spec')return args.changes?refineWholeProfileSpec(args.spec,args.changes):makeWholeProfileSpec(args.spec||{},loadConfig());
  if(name==='gh_aura_profile_native_draft')return nativeProfileDraft(actualUser(args.user),args.spec,{config:loadConfig()});
  if(name==='gh_aura_activity_preview')return previewCalendar(args.plan,{year:args.year,svg:args.svg===true});
  if(name==='gh_aura_profile_resources_check'){
    const spec=makeWholeProfileSpec(args.spec||{readme:false});
    return checkProfileResources(args.markdown,{baseUrl:args.baseUrl,assets:spec.assets});
  }
  if(name==='gh_aura_whole_profile_context')return wholeProfileContext(actualUser(args.user),args.spec,{config:loadConfig()});
  if(name==='gh_aura_whole_profile_inspect')return inspectWholeProfile(actualUser(args.user));
  if(name==='gh_aura_whole_profile_plan')return prepareProfilePlan(actualUser(args.user),args.spec,args.markdown,{delivery:args.delivery,resources:args.resources});
  if(name==='gh_aura_whole_profile_preview')return previewWholeProfilePlan(args.plan);
  if(name==='gh_aura_projects_scan')return scanPublicProjects(actualUser(args.user),args);
  if(name==='gh_aura_project_evidence')return inspectPublicProject(args.repository);
  if(name==='gh_aura_pins_current')return inspectCurrentPins(actualUser(args.user));
  if(name==='gh_aura_sources_search')
    return findProfileSources(args);
  if(name==='gh_aura_sources_get')
    return getProfileSource(args.id);
  if(name==='gh_aura_design_recommend'){
    const options=recommendProfileTechniques(args);
    const sourceIds=[...new Set(options.techniques.flatMap(x=>x.sourceIds))].slice(0,16);
    const sources=sourceIds.map(id=>getProfileSource(id))
      .filter(x=>args.includeExternal===true||
        !['third-party','user-supplied'].includes(x.trust))
      .map(x=>({id:x.id,title:x.title,url:x.url,license:x.license,
        trust:x.trust,externalRequests:x.externalRequests,
        limitations:x.limitations}));
    return {...options,sources};
  }
  if(name==='gh_aura_profile_categories')return {styles:HOLISTIC_STYLES,facets:PROFILE_FACETS,
    sourceStudy:PROFILE_SOURCE_STUDY,
    purposes:PROFILE_PURPOSES,qualityGate:'No best-of-category until avatar, README, pins, sidebar, contribution graph and achievements reviewed.'};
  if(name==='gh_aura_profiles_list')
    return listCuratedProfiles(args);
  if(name==='gh_aura_patterns_recommend')
    return recommendCuratedPatterns(args);
  if(name==='gh_aura_profile_professional_review')
    return professionalReview(args.markdown,{goal:args.goal||'general'});
  if(name==='gh_aura_biography_guide'){
    const spec=args.spec?validateProfileSpec(args.spec):makeProfileSpec({},loadConfig());
    return makeBiographyGuide(spec.biography,args.context??null);
  }
  if(name==='gh_aura_profile_plan')
    return makeProfileSpec(args,loadConfig());
  if(name==='gh_aura_profile_refine')
    return refineProfileSpec(args.spec,args.changes);
  if(name==='gh_aura_profile_validate')
    return validateProfileDraft(args.markdown,args.spec,{username:args.user?actualUser(args.user):undefined});
  if(name==='gh_aura_profile_diff')
    return previewProfileDiff(args.before,args.after);
  if(name==='gh_aura_profile_preview'){
    const target=await profileTarget(actualUser(args.user));
    return {...previewProfileDiff(target.content,args.markdown),
      repository:target.repo,branch:target.branch,readOnly:true,
      next:'Ask the user to inspect the draft, save it locally, then separately run gh-aura preview --file draft.md --save review.json and gh-aura apply --review review.json --pr.'};
  }
  if(name==='gh_aura_editorial_progress')return process.env.GH_AURA_EDITORIAL_FILE?
    auditPatternStudy(readProfileJSON(process.env.GH_AURA_EDITORIAL_FILE,16*1024*1024),{limit:args.limit??20}):
    {format:'gh-aura-editorial-progress-v1',state:'not-configured',next:'The owner may select a local review file using GH_AURA_EDITORIAL_FILE; the agent cannot select a path.',readOnly:true,writesPerformed:0};
  if(name==='gh_aura_project_improvements')return projectImprovements(args.repo,args.changes);
  if(name==='gh_aura_badges_collaboration_campaign')return planCollaborationCampaign(args);
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
      ...(args.includeExternal?['--external']:[]),
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

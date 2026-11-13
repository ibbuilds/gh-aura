import { loadConfig } from './config.mjs';
import { emit } from './output.mjs';
import { agentCapabilities } from './agent-tools.mjs';
import { makeProfileSpec } from './agent-profile.mjs';
import { makeBiographyGuide } from './profile-biography.mjs';
import { recommendProfileTechniques } from './profile-techniques.mjs';
import { findProfileSources, getProfileSource, listProfileSources } from './profile-sources.mjs';
import { getCuratedProfile, listCuratedProfiles, recommendCuratedPatterns } from './profile-patterns.mjs';
import { HOLISTIC_STYLES,PROFILE_FACETS,PROFILE_PURPOSES } from './holistic-profile-taxonomy.mjs';

const designOptions=options=>({
  query:options.query||'',direction:options.direction||'minimal',
  includeExternal:options.external===true,
  limit:options.limit===undefined?8:Number(options.limit),
});
export function runAgentCommand(command,options={}){
  const [action='list',id]=options.positional||[];
  if(command==='sources'){
    const sourceFile=options.catalog;
    if(action==='categories')return emit({styles:HOLISTIC_STYLES,facets:PROFILE_FACETS,
      purposes:PROFILE_PURPOSES,status:'600 candidates discovered, not 500 full-profile audits; legacy 25 README-only samples remain provisional'},options);
    if(action==='profiles')return emit(listCuratedProfiles({
      direction:options.direction||'',query:options.query||'',
    }),options);
    if(action==='profile')return emit(getCuratedProfile(id),options);
    if(action==='patterns')return emit(recommendCuratedPatterns({
      query:options.query||'',direction:options.direction||'minimal',
      limit:options.limit===undefined?2:Number(options.limit),
    }),options);
    if(action==='list'){
      const list=listProfileSources({sourceFile});
      if(options.format==='json'||options.output)return emit(list,options);
      const lines=['GH Aura sources ('+list.count+') — offline, source-attributed references'];
      for(const source of list.sources)
        lines.push('  '+source.id+' ['+source.category+'] — '+source.title);
      lines.push('More: sources show ID, sources recommend --query "biografía", sources design --query "terminal".');
      return emit(lines.join('\n'),options);
    }
    if(action==='show')return emit(getProfileSource(id,{sourceFile}),options);
    if(action==='recommend')return emit(findProfileSources({
      ...designOptions(options),category:options.category||'',sourceFile,
    }),options);
    if(action==='design'){
      const opts=designOptions(options);
      const techniques=recommendProfileTechniques(opts);
      const sourceIds=[...new Set(techniques.techniques.flatMap(t=>t.sourceIds))].slice(0,16);
      const sources=sourceIds.map(id=>getProfileSource(id,{sourceFile}))
        .filter(item=>opts.includeExternal||
          !['third-party','user-supplied'].includes(item.trust))
        .map(item=>({id:item.id,title:item.title,url:item.url,
          trust:item.trust,license:item.license,limitations:item.limitations}));
      return emit({...techniques,sources},options);
    }
    throw Error('Use sources list, show ID, recommend, design, categories, profiles, profile ID or patterns --query TEXT.');
  }
  if(command==='agent'){
    if(action==='capabilities')return emit(agentCapabilities(),options);
    if(action==='spec'||action==='bio'){
      const config=loadConfig(options.config);
      const biography={
        ...(options.voice?{voice:options.voice}:{}),
        ...(options.perspective?{perspective:options.perspective}:{}),
        ...(options.focus?{focus:options.focus}:{}),
        ...(options['bio-words']!==undefined?{maxWords:Number(options['bio-words'])}:{}),
      };
      const spec=makeProfileSpec({
        direction:options.direction,goal:options.goal,language:options.language,
        maxWords:options['max-words']===undefined?undefined:Number(options['max-words']),
        maxProjects:options['max-projects']===undefined?undefined:Number(options['max-projects']),
        includeExternal:options.external===true,notes:options.notes,
        visualBrief:options['visual-brief'],
        biography:Object.keys(biography).length?biography:undefined,
      },config);
      return emit(action==='bio'?makeBiographyGuide(spec.biography):spec,options);
    }
    throw Error('Use agent capabilities, spec or bio.');
  }
  throw Error('Unknown agent command.');
}

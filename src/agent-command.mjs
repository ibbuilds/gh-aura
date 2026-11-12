import { loadConfig } from './config.mjs';
import { emit } from './output.mjs';
import { agentCapabilities } from './agent-tools.mjs';
import { makeProfileSpec } from './agent-profile.mjs';
import { findProfileSources, getProfileSource, listProfileSources } from './profile-sources.mjs';

export function runAgentCommand(command,options={}){
  const [action='list',id]=options.positional||[];
  if(command==='sources'){
    if(action==='list'){
      const list=listProfileSources();
      if(options.format==='json'||options.output)return emit(list,options);
      const lines=['GH Aura sources ('+list.count+') — curated, offline references'];
      for(const source of list.sources)
        lines.push('  '+source.id+' ['+source.category+'] — '+source.title);
      lines.push('More: gh-aura sources show SOURCE_ID; sources recommend --query "..." [--external]');
      return emit(lines.join('\n'),options);
    }
    if(action==='show')return emit(getProfileSource(id),options);
    if(action==='recommend')return emit(findProfileSources({
      query:options.query||'',category:options.category||'',
      direction:options.direction||'minimal',includeExternal:options.external===true,
      limit:options.limit===undefined?8:Number(options.limit),
    }),options);
    throw Error('Use sources list, show ID or recommend --query TEXT.');
  }
  if(command==='agent'){
    if(action==='capabilities')return emit(agentCapabilities(),options);
    if(action==='spec')return emit(makeProfileSpec({
      direction:options.direction,goal:options.goal,language:options.language,
      maxWords:options['max-words']===undefined?undefined:Number(options['max-words']),
      maxProjects:options['max-projects']===undefined?undefined:Number(options['max-projects']),
      includeExternal:options.external===true,notes:options.notes,
    },loadConfig(options.config)),options);
    throw Error('Use agent capabilities or agent spec --direction technical --goal TEXT.');
  }
  throw Error('Unknown agent command.');
}

import { validateConfig } from './config.mjs';
import { compositionFromSpec } from './agent-profile.mjs';

/** One projection for native rendering and AI context; source configuration is immutable. */
export function profileConfigFromSpec(config,input){
  validateConfig(config);
  const spec=compositionFromSpec(input),next=structuredClone(config);
  const style={barebones:'minimal',minimal:'minimal',technical:'regular',expressive:'flashy'}[spec.direction];
  Object.assign(next.profile,{style,visual:-1,featured:spec.featured.slice(0,spec.maxProjects),maxProjects:spec.maxProjects,
    sections:{...spec.sections},links:structuredClone(spec.links)});
  Object.assign(next.editorial,{direction:spec.direction,language:spec.language,targetRole:spec.goal,maxWords:spec.maxWords});
  next.showcase.goal=spec.goal;
  return validateConfig(next);
}

// Developer-only corrections to an exported immutable research checkpoint.
import { createHash } from 'node:crypto';

export const RESEARCH_CHECKPOINT='d978bbae0234b30390885fc17bb7f2b6d52bc21b';
export const VIEWPORT_CORRECTION='visible-image-height-v1';
const before='r.top<innerWidth&&r.left<innerWidth&&r.right>0&&r.top<innerHeight';
const after='r.top<innerHeight&&r.left<innerWidth&&r.right>0';
const hash=source=>createHash('sha256').update(source).digest('hex');
export function correctVisualCollector(source){
  if(typeof source!=='string'||source.length>100000||source.split(before).length!==2)throw Error('Unexpected archived viewport predicate; no correction was applied.');
  const corrected=source.replace(before,after);
  return {source:corrected,correction:{id:VIEWPORT_CORRECTION,path:'scripts/visual-profile-smoke.mjs',sourceCommit:RESEARCH_CHECKPOINT,
    beforeSha256:hash(source),afterSha256:hash(corrected),
    change:'Compare image top to viewport height, not width. Preserve horizontal and size/intersection guards.',
    historicalResultsRecomputed:false,editorialAcceptance:false}};
}
export function collectorExpression(source){
  const literal=/^const expression=("(?:[^"\\]|\\.)*");$/m.exec(source)?.[1];
  if(!literal)throw Error('Archived collector expression is unavailable.');
  return JSON.parse(literal);
}

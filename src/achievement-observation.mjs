import { createHash } from 'node:crypto';
import { validateLogin } from './github.mjs';
import { ACHIEVEMENT_MATRIX } from './achievement-matrix.mjs';

// Public first-party observations only; no auth headers, screenshots or HTML retention.
export function parseVisibleAchievements(html,login){
  validateLogin(login);
  if(typeof html!=='string'||Buffer.byteLength(html)>2*1024*1024)throw Error('Public profile HTML exceeds the bounded input.');
  const heading=/<h2\b[^>]*>\s*<a[^>]+tab=achievements[^>]*>\s*Achievements\s*<\/a>\s*<\/h2>/i.exec(html);
  if(!heading)return {state:'unknown',items:[],reason:'Visible achievement section was not recognized; hidden or changed markup is not absence.'};
  const readme=html.search(/<article\b[^>]*class="[^"]*\bmarkdown-body\b/i);
  if(readme>=0&&heading.index>readme)return {state:'unknown',items:[],reason:'README content is not an achievement source.'};
  const region=html.slice(heading.index+heading[0].length,heading.index+heading[0].length+14000),items=[],seen=new Set();
  for(const m of region.matchAll(/<a\b[^>]*href="\/([^"?]+)\?achievement=([a-z\d-]{2,65})&amp;tab=achievements"[^>]*>([\s\S]*?)<\/a>/gi)){
    const id=m[2],known=ACHIEVEMENT_MATRIX.find(x=>x.id===id),alt=(m[3].match(/\balt="Achievement:\s*([^"]+)"/i)||[])[1];
    if(m[1].toLowerCase()!==login.toLowerCase()||!known||!alt||seen.has(id))continue;
    seen.add(id);const tier=(m[3].match(/achievement-tier-label--(bronze|silver|gold)/)||[])[1]||null;
    items.push({id,name:known.name,tier,state:'visible-award-observed',tierState:tier?'observed':'not-observed'});
  }
  return {state:'visible-section-observed',items};
}
export async function observeVisibleAchievements(login,{fetch:transport=globalThis.fetch}={}){
  validateLogin(login);const source='https://github.com/'+login;
  const response=await transport(source,{headers:{Accept:'text/html','User-Agent':'gh-aura-cli'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return {state:'unknown',items:[],source,reason:'Public profile could not be read.'};
  let bytes=0;const chunks=[];
  if(response.body?.getReader){const reader=response.body.getReader();try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2*1024*1024)throw Error('Public profile response exceeds 2 MiB.');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
  else{const body=await response.text();if(Buffer.byteLength(body)>2*1024*1024)throw Error('Public profile response exceeds 2 MiB.');chunks.push(Buffer.from(body));}
  const raw=Buffer.concat(chunks);
  return {...parseVisibleAchievements(raw.toString('utf8'),login),source,observedAt:new Date().toISOString(),
    evidenceSha256:createHash('sha256').update(raw).digest('hex'),retainedHTML:false};
}
export function observedPullSharkTier(report,target){
  const item=report?.items?.find(x=>x.id==='pull-shark'&&x.state==='visible-award-observed');
  if(!item)return false;
  if(target==='base')return true;
  const tiers=['base','bronze','silver','gold'];return item.tier!==null&&tiers.indexOf(item.tier)>=tiers.indexOf(target);
}

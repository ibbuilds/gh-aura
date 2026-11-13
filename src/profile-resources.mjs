import { extractProfileReferences } from './profile-references.mjs';
import { probePublicResource,publicURL } from './public-https.mjs';

/** Metadata checks only. No third-party photos, HTML bodies or credentials are retained. */
export async function checkProfileResources(markdown,{baseUrl,assets=[],limit=24,timeout=12000,...options}={}){
  if(!Number.isInteger(limit)||limit<1||limit>32||!Number.isInteger(timeout)||timeout<1||timeout>15000)throw Error('Invalid resource check budget.');
  const refs=extractProfileReferences(markdown),base=baseUrl?publicURL(baseUrl).href:'https://gh-aura.invalid/README.md';
  const keyFor=value=>{const url=new URL(value,base);url.hash='';return url.href;};
  const provided=new Map(assets.map(a=>[keyFor(a.path),a])),unique=new Map();
  for(const ref of refs){
    if(ref.url.startsWith('#'))continue;
    let url;try{url=new URL(ref.url,base).href;}catch{url=ref.url;}
    let key;try{key=keyFor(url);}catch{key=url;}
    if(!unique.has(key)||ref.kind==='image')unique.set(key,{...ref,url});
  }
  const entries=[...unique.values()],results=[],deadline=Date.now()+timeout;let requests=0;
  for(const ref of entries.slice(0,limit)){
    let asset;try{asset=provided.get(keyFor(ref.url));}catch{ /* unsupported references remain unverified */ }
    if(asset){results.push({...ref,state:'provided-in-plan',bytes:Buffer.byteLength(asset.content,asset.encoding==='base64'?'base64':'utf8'),rights:asset.rights});continue;}
    if(ref.url.startsWith('https://gh-aura.invalid/')){results.push({...ref,state:'unresolved-relative',reason:'Supply the public repository README URL or include the referenced asset in the plan.'});continue;}
    if(Date.now()>=deadline||requests>=48){results.push({...ref,state:'not-checked',reason:'Resource time/request budget exhausted.'});continue;}
    try{
      const response=await probePublicResource(ref.url,{...options,timeout:Math.min(3000,deadline-Date.now()),onRequest:()=>{if(requests>=48)throw Error('Resource request budget exhausted.');requests++;}});
      const reachable=response.status>=200&&response.status<300;
      const type=response.contentType.split(';')[0].toLowerCase();
      results.push({...ref,requestedUrl:ref.url,...response,state:!reachable?'unavailable':ref.kind==='image'&&type&&!type.startsWith('image/')&&type!=='application/octet-stream'?'unexpected-image-type':'reachable'});
    }catch(error){results.push({...ref,state:'unverified',reason:/public|credentials|port 443/.test(error.message)?'Destination is not an allowed public HTTPS resource.':'Connection, DNS, timeout or redirect could not be verified.'});}
  }
  return {format:'gh-aura-resource-check-v1',checkedAt:new Date().toISOString(),total:entries.length,checked:results.length,networkRequests:requests,
    truncated:entries.length>limit,results,
    state:results.some(x=>!['reachable','provided-in-plan'].includes(x.state))||entries.length>limit?'needs-review':'checked',
    caveat:'HTTP metadata and planned bytes only; not proof of decoded image quality, licensing, fragment anchors or GitHub rendering. No remote bodies or credentials retained.'};
}

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';

export function publicAddress(address){
  if(typeof address!=='string')return false;
  if(isIP(address)===4){
    const [a,b,c]=address.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||
      a===100&&b>=64&&b<=127||a===192&&b===0&&(c===0||c===2)||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
  }
  if(isIP(address)===6){
    let normalized;try{normalized=new URL('https://['+address+']/').hostname.slice(1,-1);}catch{return false;}
    const parts=normalized.split(':'),first=Number.parseInt(parts[0],16),second=Number.parseInt(parts[1]||'0',16);
    return first>=0x2000&&first<0x3ffe&&first!==0x2002&&!(first===0x2001&&(second<0x200||second===0xdb8));
  }
  return false;
}
export function publicURL(value){
  let url;try{url=new URL(value);}catch{throw Error('Resource URL is invalid.');}
  const host=url.hostname.replace(/^\[|\]$/g,'');
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||url.href.length>2000||
    !host.includes('.')&&!isIP(host)||/(?:^|\.)(?:localhost|local|internal|test|invalid|onion)$/.test(host)||isIP(host)&&!publicAddress(host))
    throw Error('Only public HTTPS resources on port 443 without credentials can be checked.');
  url.hash='';return url;
}
function headersOnly(url,{address,family,method,timeout}){
  return new Promise((resolve,reject)=>{
    const req=request(url,{method,agent:false,headers:{'User-Agent':'gh-aura-resource-check','Accept':'*/*',...(method==='GET'?{Range:'bytes=0-511'}:{})},
      lookup:(_host,settings,done)=>{
        if(typeof settings==='function'){done=settings;settings={};}
        done(null,settings.all?[{address,family}]:address,...(settings.all?[]:[family]));
      }},response=>{resolve({status:response.statusCode,headers:response.headers});response.destroy();});
    req.setTimeout(timeout,()=>req.destroy(Error('Resource check timed out.')));
    req.on('error',reject);req.end();
  });
}
/** Resolve and pin the public address at every hop; never forwards GitHub credentials. */
export async function probePublicResource(value,options={}){
  const timeout=Math.min(4000,options.timeout??3000),resolve=options.resolve||((host)=>lookup(host,{all:true,verbatim:true})),send=options.request||headersOnly;
  let url=publicURL(value),redirects=0,method='HEAD';
  const deadline=Date.now()+timeout;
  while(true){
    const remaining=deadline-Date.now();if(remaining<=0)throw Error('Resource check timed out.');
    let timer;
    const work=async()=>{
      const host=url.hostname.replace(/^\[|\]$/g,''),literal=isIP(host);
      const addresses=literal?[{address:host,family:literal}]:await resolve(host);
      if(!Array.isArray(addresses)||!addresses.length||addresses.some(x=>!publicAddress(x.address)))throw Error('Resource resolves to a non-public or unknown address.');
      if(Date.now()>=deadline)throw Error('Resource check timed out.');
      const chosen=addresses.find(x=>x.family===4)||addresses[0];
      options.onRequest?.();
      return send(url,{address:chosen.address,family:chosen.family,method,timeout:Math.max(1,deadline-Date.now())});
    };
    let result;
    try{result=await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Resource check timed out.')),remaining);})]);}
    finally{clearTimeout(timer);}
    if(!Number.isInteger(result?.status))throw Error('Resource returned an invalid response.');
    if([301,302,303,307,308].includes(result.status)){
      if(++redirects>3||typeof result.headers?.location!=='string')throw Error('Resource redirect could not be verified.');
      url=publicURL(new URL(result.headers.location,url).href);continue;
    }
    if(method==='HEAD'&&[405,501].includes(result.status)){method='GET';continue;}
    return {url:url.href,status:result.status,contentType:String(result.headers?.['content-type']||'').slice(0,120),redirects};
  }
}

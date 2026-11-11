// Employer-sourced engineering reference: curated, public company-controlled author pages.
// This collects STRUCTURE only. It does not store raw bios, readme prose or private data.
// Do not run on ordinary GH Aura commands.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const roster=JSON.parse(readFileSync('research/employer-sourced.json','utf8'));
const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
if(!token)throw Error('An authenticated GitHub read token is required');
let requests=0;
async function graphql(batch){
  if(++requests>5)throw Error('Employer study query budget exceeded');
  const declarations=batch.map((_,i)=>'$u'+i+':String!').join(',');
  const fields=batch.map((_,i)=>'p'+i+':user(login:$u'+i+'){login company bio websiteUrl '+
    'pinnedItems(first:6,types:[REPOSITORY]){nodes{...on Repository{description isPrivate}}} '+
    'repository(name:$u'+i+'){isPrivate object(expression:"HEAD:README.md"){...on Blob{text oid byteSize}}}}').join('\n');
  const response=await fetch('https://api.github.com/graphql',{
    method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
    headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json',
      'X-GitHub-Api-Version':'2026-03-10','User-Agent':'gh-aura-employer-source-study'},
    body:JSON.stringify({query:'query('+declarations+'){'+fields+'}',
      variables:Object.fromEntries(batch.map((p,i)=>['u'+i,p.login]))})});
  if(!response.ok)throw Error('GraphQL study stopped on HTTP '+response.status);
  const size=Number(response.headers.get('content-length')||0);
  if(size>3*1024*1024)throw Error('Response too large');
  const text=await response.text();
  if(Buffer.byteLength(text)>3*1024*1024)throw Error('Response too large');
  return JSON.parse(text);
}
function stats(blob){
  if(!blob)return{status:'not-observed-at-root'};
  if(typeof blob.text!=='string'||blob.byteSize>128*1024)return{status:'unavailable-or-oversized'};
  const raw=blob.text,visible=raw.replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ');
  return{status:'observed',sha256:createHash('sha256').update(raw).digest('hex'),
    wordsApprox:visible.trim().split(/\s+/u).filter(Boolean).length,
    headings:(raw.match(/^#{1,6}\s+\S/gm)||[]).length,
    images:(raw.match(/!\[[^\]]*\]\([^)]+\)|<img\b/gi)||[]).length,
    links:(raw.match(/(?<!!)\[[^\]]+\]\([^)]+\)|<a\b/gi)||[]).length,
    statWidgets:/github-readme-stats|github-readme-streak-stats|github-profile-trophy/i.test(raw)};
}
const records=[],errors=[];
for(let offset=0;offset<roster.entries.length;offset+=8){
  const batch=roster.entries.slice(offset,offset+8);
  const result=await graphql(batch);
  for(let i=0;i<batch.length;i++){
    const src=batch[i],p=result.data?.['p'+i];
    const issues=(result.errors||[]).filter(e=>!e.path||e.path[0]==='p'+i)
      .filter(e=>e.path?.[1]!=='repository'||e.type!=='NOT_FOUND');
    if(!p||issues.length){errors.push({login:src.login,reason:'unavailable or partial GraphQL profile'});continue;}
    const pins=(p.pinnedItems?.nodes||[]).filter(x=>x&&x.isPrivate===false);
    records.push({login:p.login,company:src.employer,profileUrl:'https://github.com/'+p.login,
      employerSource:src.employerSource,employerSourcePostYear:src.sourcePostYear,
      linkage:src.linkage,reviewedOn:src.reviewedOn,
      employerPageDescribesEngineeringRole:true,
      employerStatusNote:'Company-owned source describes engineering role; source can become stale after employment changes.',
      structure:{bioChars:p.bio?.trim().length||0,website:Boolean(p.websiteUrl),
        pins:pins.length,pinsDescribed:pins.filter(x=>x.description?.trim()).length,
        readme:stats(p.repository?.isPrivate===false?p.repository.object:null)}});
  }
}
const readmes=records.map(x=>x.structure.readme).filter(x=>x.status==='observed');
const median=(v)=>v.length?v.toSorted((a,b)=>a-b)[Math.floor((v.length-1)/2)]:null;
const data={schema:'gh-aura-employer-sourced-structure-v1',
  observedAt:new Date().toISOString(),rosterSource:'research/employer-sourced.json',
  selection:'Curated company-owned author pages naming an engineer and linking or corroborating their public GitHub login.',
  limitations:['Employer-owned pages are source assertions, not HR employment verification or a guarantee of current role.',
    'Two companies are represented; sample is not representative of all big-tech engineers.',
    'One Microsoft identity was corroborated with a matching public GitHub profile rather than an official outbound link.',
    'No performance, technical seniority, personal identity or hiring outcomes are inferred.',
    'README detector only observes HEAD:README.md in USER/USER. No raw bios or prose saved.'],
  requests,selected:roster.entries.length,observed:records.length,errors,
  summary:{withBio:records.filter(x=>x.structure.bioChars>0).length,
    withWebsite:records.filter(x=>x.structure.website).length,
    withPins:records.filter(x=>x.structure.pins>0).length,
    pinMedian:median(records.map(x=>x.structure.pins)),rootReadmes:readmes.length,
    medianReadmeWords:median(readmes.map(x=>x.wordsApprox)),
    readmesWithoutImages:readmes.filter(x=>x.images===0).length,
    readmesWithLinks:readmes.filter(x=>x.links>0).length,
    readmesWithStats:readmes.filter(x=>x.statWidgets).length},
  records};
writeFileSync('research/employer-observations.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({requests,observed:records.length,errors,summary:data.summary},null,2));
if(records.length<12)throw Error('Less than 12 employer-sourced public profiles were inspected.');

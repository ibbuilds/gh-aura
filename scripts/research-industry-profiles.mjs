// One-time research. Cohort: PEOPLE with public membership of a company GitHub org,
// a matching self-reported company, and a self-described engineering role.
// That combination is NOT employer-verified current employment.
// Never run as part of ordinary GH Aura CLI operations.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const firms=[
  ['github','GitHub'],['microsoft','Microsoft'],['google','Google'],['shopify','Shopify'],
  ['cloudflare','Cloudflare'],['vercel','Vercel'],['stripe','Stripe'],['gitlabhq','GitLab'],
  ['elastic','Elastic'],['hashicorp','HashiCorp'],['Netflix','Netflix'],['DataDog','Datadog'],
  ['redhat','Red Hat'],['mozilla','Mozilla'],['docker','Docker'],['grafana','Grafana'],
  ['sentry','Sentry'],['digitalocean','DigitalOcean'],['uber','Uber'],['airbnb','Airbnb'],
  ['supabase','Supabase'],['facebook','Meta'],['aws','Amazon'],['nvidia','NVIDIA'],
];
const aliases={github:['github'],microsoft:['microsoft'],google:['google','alphabet'],
  redhat:['red hat','redhat'],facebook:['meta','facebook'],aws:['aws','amazon']};
const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
if(!token)throw Error('Research requires an authenticated GitHub read token.');
let requests=0;const budget=125;
async function api(path,body){
  if(++requests>budget)throw Error('Research API request budget exhausted');
  const r=await fetch('https://api.github.com'+path,{method:body?'POST':'GET',redirect:'error',
    signal:AbortSignal.timeout(25000),headers:{...(body ? {Authorization:'Bearer '+token} : {}),
      Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',
      'User-Agent':'gh-aura-company-profile-research',...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  if(r.status===404 && path.startsWith('/orgs/') && path.includes('/public_members')) return [];
  if(!r.ok)throw Error('Research stopped on HTTP '+r.status+' for '+path);
  let size=0;const chunks=[];const reader=r.body.getReader();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>3*1024*1024){await reader.cancel();throw Error('Oversized research response');}chunks.push(value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const groups=[];
for(const [org,company] of firms){
  const list=await api('/orgs/'+encodeURIComponent(org)+'/public_members?per_page=100');
  if(!Array.isArray(list))throw Error('Invalid public members response for '+org);
  groups.push(list.filter(x=>x.type==='User'&&/^[a-z\d-]+$/i.test(x.login)
    &&x.login.length<=39&&!/(?:bot|automation)$/i.test(x.login)).slice(0,75)
    .map(x=>({login:x.login,org,company})));
}
const candidates=[],seen=new Set();
for(let i=0;i<75;i++)for(const group of groups){const v=group[i];if(!v||seen.has(v.login.toLowerCase()))continue;
  seen.add(v.login.toLowerCase());candidates.push(v);}
const role=/\b(?:software engineer|engineer|engineering|developer|architect|sre|site reliability|backend|front.?end|full.?stack|infrastructure|devops|programmer|data scientist|machine learning|platform)\b/i;
const past=/\b(?:formerly|former|previously|ex[- ]|used to work|retired|alumni)\b/i;
function companyMatch(raw,org,company){
  const normal=String(raw||'').toLowerCase().replace(/[@()[\]{}|,.;:/\\]/g,' ').replace(/\s+/g,' ');
  return (aliases[org]||[company.toLowerCase()]).some(alias=>normal.includes(alias));
}
function readme(blob){
  if(!blob)return {state:'not-observed-at-root'};
  if(typeof blob.text!=='string'||blob.byteSize>128*1024)return {state:'unknown'};
  const raw=blob.text;const visible=raw.replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ');
  return {state:'observed',sha256:createHash('sha256').update(raw).digest('hex'),
    words:visible.trim().split(/\s+/u).filter(Boolean).length,
    headings:(raw.match(/^#{1,6}\s+\S/gm)||[]).length,
    images:(raw.match(/!\[[^\]]*\]\([^)]+\)|<img\b/gi)||[]).length,
    links:(raw.match(/(?<!!)\[[^\]]+\]\([^)]+\)|<a\b/gi)||[]).length,
    stats:/github-readme-stats|github-readme-streak-stats|github-profile-trophy/i.test(raw)};
}
const records=[], counts={}, errors=[];let examined=0,qualified=0;
for(let offset=0;offset<candidates.length&&records.length<100&&requests<budget;offset+=10){
  const group=candidates.slice(offset,offset+10);
  const declarations=group.map((_,i)=>'$u'+i+':String!').join(',');
  const parts=group.map((_,i)=>'p'+i+':user(login:$u'+i+'){login company bio websiteUrl pinnedItems(first:6,types:[REPOSITORY]){nodes{...on Repository{description isPrivate}}} repository(name:$u'+i+'){isPrivate object(expression:"HEAD:README.md"){...on Blob{text oid byteSize}}}}').join('\n');
  const result=await api('/graphql',{query:'query('+declarations+'){'+parts+'}',
    variables:Object.fromEntries(group.map((v,i)=>['u'+i,v.login]))});
  for(let i=0;i<group.length;i++){
    const v=group[i],p=result.data?.['p'+i];
    const errorsHere=(result.errors||[]).filter(e=>!e.path||e.path[0]==='p'+i);
    if(!p||errorsHere.some(e=>e.path?.[1]!=='repository'||e.type!=='NOT_FOUND')){
      errors.push({login:v.login,error:'unavailable profile'});continue;}
    examined++;
    if(!companyMatch(p.company,v.org,v.company)||!role.test(p.bio||'')||
        past.test(p.company||'')||past.test(p.bio||''))continue;
    qualified++;
    if((counts[v.company]||0)>=12)continue;
    const pins=(p.pinnedItems?.nodes||[]).filter(x=>x&&x.isPrivate===false);
    records.push({login:p.login,profile:'https://github.com/'+p.login,
      org:v.org,company:v.company,
      evidence:{publicMembership:'https://github.com/orgs/'+v.org+'/people',
        publicProfile:'https://github.com/'+p.login,
        selfListedCompany:true,selfDescribedEngineeringRole:true,employerVerified:false},
      structure:{bioChars:p.bio?.trim().length||0,website:Boolean(p.websiteUrl),
        pins:pins.length,pinsDescribed:pins.filter(x=>x.description?.trim()).length,
        readme:readme(p.repository?.isPrivate===false?p.repository.object:null)}});
    counts[v.company]=(counts[v.company]||0)+1;
    if(records.length===100)break;
  }
}
const observed=records.map(x=>x.structure.readme).filter(x=>x.state==='observed');
const med=xs=>xs.length?xs.toSorted((a,b)=>a-b)[Math.floor((xs.length-1)/2)]:null;
const result={schema:'gh-aura-company-affiliated-engineers-v1',
  observedAt:new Date().toISOString(),
  selection:'Public company-org membership plus matching self-listed company and self-described engineering role. Max 12/company, 100 total.',
  employmentStatus:'UNVERIFIED. Dual signals do not certify current employment or seniority.',
  caveats:['Public org members may be external collaborators or contractors.',
    'Company and role are self-reported and may be stale; keyword filtering is imperfect.',
    'Members with hidden memberships or sparse bios are excluded.',
    'No payroll, hiring outcomes, performance or individual competence verified.',
    'Only root HEAD:README.md inspected; no biography, README prose, emails or images retained.'],
  organizations:firms.map(([org,company])=>({org,company})),
  candidates:candidates.length,examined,qualified,selected:records.length,requests,
  companyCounts:counts,errors,
  summary:{bioPresent:records.filter(x=>x.structure.bioChars>0).length,
    websitePresent:records.filter(x=>x.structure.website).length,
    withPins:records.filter(x=>x.structure.pins>0).length,
    medianPins:med(records.map(x=>x.structure.pins)),
    rootReadmes:observed.length,medianReadmeWords:med(observed.map(x=>x.words)),
    readmesWithoutImages:observed.filter(x=>x.images===0).length,
    readmesWithLinks:observed.filter(x=>x.links>0).length,
    readmesWithStatWidgets:observed.filter(x=>x.stats).length},
  records};
mkdirSync('research',{recursive:true});
writeFileSync('research/company-profiles.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({selected:records.length,examined,qualified,requests,companies:Object.keys(counts).length,summary:result.summary,counts},null,2));
if(records.length<30)throw Error('Insufficient dual-signal profiles: '+records.length);

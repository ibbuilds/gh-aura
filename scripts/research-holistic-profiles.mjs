// Optional one-time research command. NEVER imported by the regular GH Aura CLI,
// never uses GitHub write scopes, and never stores the full biography or README.
// Usage: GH_TOKEN=... node scripts/research-holistic-profiles.mjs
//   --start 0 --limit 50 --output research/audit-batch-000.json
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const API_URL='https://api.github.com/graphql';
const DEFAULT_INPUT=new URL('../research/profile-candidates-600.json',import.meta.url);
const cap=(v,n)=>String(v||'').slice(0,n);
const count=(text,re)=>(text.match(re)||[]).length;
function summaryReadme(blob){
  if(!blob)return {state:'not-observed-at-root',note:'No readable profile repository root README returned; this is not proof of an inferior profile.'};
  if(typeof blob.text!=='string'||blob.byteSize>128*1024)
    return {state:'unavailable',note:'GitHub did not expose a bounded UTF-8 README text.'};
  const raw=blob.text,visible=raw.replace(/<!--[\\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ');
  return {state:'observed',gitBlob:cap(blob.oid,40),approxWords:visible.trim().split(/\s+/u).filter(Boolean).length,
    headings:count(raw,/^#{1,6}\s+\S/gm),markdownLinks:count(raw,/(?<!!)\[[^\]]+\]\([^)]+\)/g),
    imageCount:count(raw,/!\[[^\]]*\]\([^)]+\)|<img\b/gi),
    remoteStatsImages:count(raw,/github-readme-stats|github-streak-stats|streak-stats|github-profile-trophy|komarev|ghchart/gi),
    themeAwareImages:count(raw,/#gh-dark-mode-only|#gh-light-mode-only|prefers-color-scheme/gi),
    licenseNote:'Observed public metadata only; do not copy source prose, artwork or personal claims.'};
}
const safeUrl=(x)=>typeof x==='string'&&x.startsWith('https://')&&x.length<1000?x:null;
export function normalizePublicProfile(login,person,observedAt){
  if(!person)return {login,profileUrl:'https://github.com/'+login,
    availability:'not-returned-by-github',observedAt,complete:false,
    missing:['avatar','biography','links','profileReadme','pinnedRepositories','contributionCalendar','achievements','visual review']};
  const pinned=(person.pinnedItems?.nodes||[]).filter(Boolean).slice(0,6).flatMap(x=>{
    if(x.isPrivate===true)return [];
    const url=safeUrl(x.url);
    if(!url)return [];
    return [{url,type:x.nameWithOwner?'repository':'gist',
      name:cap(x.nameWithOwner||x.name,160),
      descriptionPresent:Boolean(x.description?.trim()),archived:x.isArchived??null,
      fork:x.isFork??null,language:x.primaryLanguage?.name||null}];
  });
  const contributionDays=(person.contributionsCollection?.contributionCalendar?.weeks||[])
    .flatMap(w=>w.contributionDays||[]);
  const visibleTotal=person.contributionsCollection?.contributionCalendar?.totalContributions;
  const readme=person.repository?.isPrivate===false?summaryReadme(person.repository?.object):{
    state:person.repository?'private-or-unavailable':'not-observed-at-root',
    note:'No public root README available through this query; a README is not required.'};
  return {
    login:cap(person.login||login,39),profileUrl:safeUrl(person.url)||'https://github.com/'+login,
    availability:'graphql-public-metadata',observedAt,complete:false,
    avatar:{state:person.avatarUrl?'url-observed-visual-unreviewed':'not-observed',url:safeUrl(person.avatarUrl)},
    profileHeader:{namePresent:Boolean(person.name),statusPresent:Boolean(person.status?.message),
      companyFieldPresent:Boolean(person.company),locationFieldPresent:Boolean(person.location)},
    biography:{state:'metadata-observed',present:Boolean(person.bio?.trim()),
      characters:person.bio?.trim().length||0,textRetained:false},
    links:{state:'metadata-observed',websitePresent:Boolean(person.websiteUrl),
      socialAccounts:(person.socialAccounts?.nodes||[]).length,
      providers:[...new Set((person.socialAccounts?.nodes||[]).map(x=>cap(x.provider,30)).filter(Boolean))].slice(0,10),
      destinationsRetained:false},
    profileReadme:readme,
    pinnedRepositories:{state:'public-pinned-items',count:pinned.length,items:pinned},
    contributionCalendar:Number.isInteger(visibleTotal)?{
      state:'github-visible-to-query-caller',totalVisible:visibleTotal,
      activeDays:contributionDays.filter(x=>x.contributionCount>0).length,
      sampledDays:contributionDays.length,
      note:'Visible contribution counts do not show authorship quality, private repository details or awards.'}:
      {state:'unavailable',note:'Unknown rather than zero.'},
    achievements:{state:'not-observed',note:'No official supported per-profile award query; check visible GitHub profile manually.'},
    visualChecks:{desktopLight:false,desktopDark:false,mobileLight:false,mobileDark:false},
    classification:{primaryStyle:null,secondaryStyles:[],purposes:[],
      status:'requires-full-visual-and-contextual-review'},
    note:'This API record is NOT a holistic profile assessment and is not eligible for best-in-category selection.',
  };
}
function parse(argv){
  const out={input:DEFAULT_INPUT,start:0,limit:50,batchSize:5,budget:20,output:null};
  const keys={'--input':'input','--start':'start','--limit':'limit',
    '--batch-size':'batchSize','--budget':'budget','--output':'output'};
  for(let i=0;i<argv.length;i+=2){
    const key=keys[argv[i]],v=argv[i+1];
    if(!key||v===undefined||v.startsWith('--'))throw Error('Only --input, --start, --limit, --batch-size, --budget and --output are supported.');
    out[key]=v;
  }
  for(const [k,min,max] of [['start',0,10000],['limit',1,100],['batchSize',1,5],['budget',1,50]]){
    const v=String(out[k]);
    if(!/^\d+$/.test(v)||Number(v)<min||Number(v)>max)throw Error(k+' must be '+min+'..'+max+'.');
    out[k]=Number(v);
  }
  if(typeof out.output!=='string'||!out.output.endsWith('.json'))
    throw Error('Explicit output .json path is required; never overwrite a prior research batch.');
  return out;
}
export function buildBatchQuery(logins){
  if(!Array.isArray(logins)||logins.length<1||logins.length>5)throw Error('Batch must contain 1–5 account logins.');
  const declarations=logins.map((_,i)=>'$u'+i+':String!').join(',');
  const parts=logins.map((_,i)=>
    'p'+i+':user(login:$u'+i+'){login url avatarUrl name bio company location websiteUrl '+
    'status{message} socialAccounts(first:10){nodes{provider}} '+
    'pinnedItems(first:6,types:[REPOSITORY]){nodes{'+
    '... on Repository{nameWithOwner url description isPrivate isArchived isFork primaryLanguage{name}}}} '+
    'contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount}}}} '+
    'repository(name:$u'+i+'){isPrivate object(expression:"HEAD:README.md"){... on Blob{oid byteSize text}}}}'
  ).join('\n');
  return {query:'query('+declarations+'){'+parts+'}',variables:Object.fromEntries(logins.map((x,i)=>['u'+i,x]))};
}
async function graphql(token,payload){
  const res=await fetch(API_URL,{method:'POST',redirect:'error',signal:AbortSignal.timeout(25000),
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',
      'User-Agent':'gh-aura-holistic-research','Accept':'application/vnd.github+json'},
    body:JSON.stringify(payload)});
  if(!res.ok)throw Error('GitHub returned HTTP '+res.status+'; check local permissions or rate limits.');
  const raw=await res.text();
  if(raw.length>3*1024*1024)throw Error('Research GraphQL response exceeds 3 MiB.');
  const body=JSON.parse(raw);
  const failures=(body.errors||[]).filter(e=>
    !(e.type==='NOT_FOUND'&&Array.isArray(e.path)&&
      (e.path[1]==='repository'||(e.path.length===1&&/^p\d+$/.test(String(e.path[0]))))));
  if(failures.length||!body.data){
    const kinds=[...new Set(failures.slice(0,4).map(e=>
      String(e.type||'GRAPHQL')+':'+String(e.message||'unknown').slice(0,160)
        .replace(/https?:\/\/\S+/g,'[URL]').replace(/[\r\n]/g,' ')))];
    throw Error('Incomplete GraphQL response ('+kinds.join('; ')+'); no research file was written.');
  }
  return body.data;
}
export async function runResearch(argv=process.argv.slice(2)){
  const opts=parse(argv),token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
  if(!token)throw Error('Use an authorized GitHub read token in GH_TOKEN in your trusted terminal.');
  const input=JSON.parse(readFileSync(opts.input,'utf8'));
  if(input.schema!=='gh-aura-holistic-profile-candidates-v1'||
    !Array.isArray(input.candidates)||input.candidates.length<500)
    throw Error('Expected the 500+ candidate research roster.');
  if(opts.start+opts.limit>input.candidates.length)
    throw Error('Requested batch exceeds the available candidates.');
  const subset=input.candidates.slice(opts.start,opts.start+opts.limit);
  const profiles=[],observedAt=new Date().toISOString();let requests=0;
  for(let i=0;i<subset.length;i+=opts.batchSize){
    if(++requests>opts.budget)throw Error('Bounded research budget exhausted; no file written.');
    const group=subset.slice(i,i+opts.batchSize);
    const result=await graphql(token,buildBatchQuery(group.map(x=>x.login)));
    group.forEach((candidate,n)=>profiles.push(
      normalizePublicProfile(candidate.login,result['p'+n]||null,observedAt)));
  }
  const output={schema:'gh-aura-holistic-api-observation-batch-v1',observedAt,
    sourceRoster:'profile-candidates-600.json',start:opts.start,requested:subset.length,
    requests,responded:profiles.filter(x=>x.availability==='graphql-public-metadata').length,
    limitation:'API-only. Avatar artwork, visible achievements, rendered README/pins and mobile/light/dark layout still require direct editorial inspection.',
    profiles};
  writeFileSync(resolve(opts.output),JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
  return {output:opts.output,requested:output.requested,responded:output.responded,requests,holisticallyReviewed:0};
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main)runResearch().then(x=>process.stdout.write(JSON.stringify(x)+'\n')).catch(e=>{
  process.stderr.write('GH Aura research: '+e.message+'\n');process.exitCode=1;
});

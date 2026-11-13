// Developer-only, bounded read-only observations of GitHub-rendered public profile HTML.
// No model, no scraping private data, no image downloads, no GitHub mutations.
// Explicitly NOT a human/visual completeness certificate or category ranking.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const validLogin=/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const compact=(value)=>typeof value==='string'?value.slice(0,120):'';
const count=(text,re)=>(text.match(re)||[]).length;
const htmlDecode=(s)=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
export function parsePublicProfileHtml(login,html,observedAt){
  if(!validLogin.test(login)||typeof html!=='string'||html.length>1024*1024)
    throw Error('Invalid bounded profile HTML or account name.');
  const title=htmlDecode((html.match(/<title>([^<]{1,300})<\/title>/i)||[])[1]||'');
  // A public GitHub profile visibly displays achievement links in the sidebar.
  const heading=html.match(/<h2\b[^>]*>\s*<a[^>]+tab=achievements[^>]*>\s*Achievements\s*<\/a>\s*<\/h2>/i);
  let achievements={state:'not-observed',items:[]};
  if(heading){
    const idx=html.indexOf(heading[0])+heading[0].length;
    // Bounded: badges appear immediately after the sidebar heading.
    const region=html.slice(idx,idx+14000);
    const matches=[...region.matchAll(/<a\b[^>]*href="\/[^"]*\?achievement=([a-z\d-]{2,65})&amp;tab=achievements"[^>]*>([\s\S]*?)<\/a>/gi)];
    const items=[],seen=new Set();
    for(const m of matches){
      if(seen.has(m[1]))continue;
      const alt=(m[2].match(/\balt="Achievement:\s*([^"]+)"/i)||[])[1]||null;
      const tier=(m[2].match(/achievement-tier-label--(bronze|silver|gold)/)||[])[1]||null;
      items.push({slug:m[1],title:alt?htmlDecode(alt).slice(0,80):null,tier,source:'visible-github-profile-achievement-link'});
      seen.add(m[1]);
      if(items.length>=20)break;
    }
    achievements={state:'observed-visible-section',items};
  }
  const mi=html.search(/class="[^"]*\bmarkdown-body\b[^"]*"/);
  let readme={state:'not-observed-in-page-html'};
  if(mi>=0){
    const begin=html.lastIndexOf('<article',mi);
    const end=html.indexOf('</article>',mi);
    if(begin>=0&&end>mi&&end-begin<200000){
      const rendered=html.slice(begin,end);
      readme={state:'github-rendered-html-observed',
        images:count(rendered,/<img\b/gi),
        headings:count(rendered,/<h[1-6]\b/gi),
        links:count(rendered,/<a\b[^>]+href=/gi),
        details:count(rendered,/<details\b/gi),
        tables:count(rendered,/<table\b/gi),
        codeBlocks:count(rendered,/<pre\b/gi),
        animatedImageUrls:count(rendered,/\bsrc="[^"]+\.(gif|apng)(?:[?#"][^"]*)?"/gi),
        altMissing:count(rendered,/<img\b(?![^>]*\balt\s*=)[^>]*>/gi),
        bytes:end-begin,
        note:'Rendered HTML structure only; image content, contrast and responsive behavior not visually reviewed.'};
    }else readme={state:'rendered-html-boundary-unavailable'};
  }
  const hasSidebar=/user-profile-bio|js-profile-editable-area/.test(html);
  return {login,observedAt,profileUrl:'https://github.com/'+login,
    source:'live-github-public-profile-html',
    state:hasSidebar?'github-page-observed':'github-response-unrecognized',
    titlePresent:Boolean(title&&title.includes('GitHub')),
    achievements,
    renderedReadme:readme,
    visual:{avatarArtReviewed:false,desktopLight:false,desktopDark:false,mobileLight:false,mobileDark:false},
    completedHolisticAudit:false,
    note:'Public HTML only. Awards are those visible in the acquired page, not a full account inventory. Missing is unknown, and this is NOT a design quality approval.'};
}
function options(args){
  const o={start:null,limit:50,input:null,output:null,sleepMs:350};
  const props={'--start':'start','--limit':'limit','--input':'input',
    '--output':'output','--sleep-ms':'sleepMs'};
  for(let i=0;i<args.length;i+=2){
    if(!props[args[i]]||!args[i+1])throw Error('Use --start N --limit N --input FILE --output FILE [--sleep-ms N].');
    o[props[args[i]]]=args[i+1];
  }
  for(const [key,min,max] of [['start',0,600],['limit',1,50],['sleepMs',100,2500]]){
    if(!/^\d+$/.test(String(o[key]))||Number(o[key])<min||Number(o[key])>max)
      throw Error(key+' outside '+min+'..'+max);
    o[key]=Number(o[key]);
  }
  if(!o.input?.endsWith('.json')||!o.output?.endsWith('.json'))
    throw Error('Provide explicit input and output JSON paths.');
  return o;
}
export async function collectPublicProfileHtml(args=process.argv.slice(2)){
  const o=options(args),file=resolve(o.input);
  if(statSync(file).size>1024*1024)throw Error('GraphQL input too large.');
  const batch=JSON.parse(readFileSync(file,'utf8'));
  if(batch.schema!=='gh-aura-holistic-api-observation-batch-v1'||
    batch.start!==o.start||!Array.isArray(batch.profiles)||batch.profiles.length<o.limit)
    throw Error('Input is not an authorized matching public GraphQL observation batch.');
  const results=[];
  for(const p of batch.profiles.slice(0,o.limit)){
    const login=p.login;
    if(!validLogin.test(login))throw Error('Unexpected account name in roster.');
    const observedAt=new Date().toISOString();
    if(p.availability!=='graphql-public-metadata'){
      results.push({login,observedAt,state:'not-returned-by-github-graphql',
        achievements:{state:'not-observed',items:[]},renderedReadme:{state:'not-observed'},
        completedHolisticAudit:false});continue;
    }
    try{
      const res=await fetch('https://github.com/'+encodeURIComponent(login),{
        redirect:'error',signal:AbortSignal.timeout(15000),
        headers:{'Accept':'text/html','User-Agent':'GH-Aura-public-profile-research'}});
      if(res.status!==200){
        results.push({login,observedAt,state:'http-'+res.status,
          achievements:{state:'not-observed',items:[]},renderedReadme:{state:'not-observed'},
          completedHolisticAudit:false});
      }else{
        const size=Number(res.headers.get('content-length')||0);
        if(size>1024*1024)throw Error('HTML body size exceeded 1 MiB');
        const html=await res.text();
        results.push(parsePublicProfileHtml(login,html,observedAt));
      }
    }catch(e){
      results.push({login,observedAt,state:'http-request-failed',
        reason:e.name==='TimeoutError'?'timeout':'unavailable',
        achievements:{state:'not-observed',items:[]},renderedReadme:{state:'not-observed'},
        completedHolisticAudit:false});
    }
    await new Promise(resolve=>setTimeout(resolve,o.sleepMs));
  }
  const output={schema:'gh-aura-public-html-facets-batch-v1',observedAt:new Date().toISOString(),
    sourceBatchStart:o.start,queried:results.length,
    pageObserved:results.filter(x=>x.state==='github-page-observed').length,
    achievementsVisible:results.filter(x=>x.achievements.state==='observed-visible-section').length,
    renderedReadmes:results.filter(x=>x.renderedReadme.state==='github-rendered-html-observed').length,
    completeProfileReviews:0,
    limitations:'Public page HTML structure and visible badges only; no screenshots reviewed, image rights or contrast assessed, no verified expertise or hiring score.',
    profiles:results};
  writeFileSync(resolve(o.output),JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
  return {start:o.start,queried:output.queried,pageObserved:output.pageObserved,
    achievementsVisible:output.achievementsVisible,renderedReadmes:output.renderedReadmes};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  collectPublicProfileHtml().then(x=>process.stdout.write(JSON.stringify(x)+'\n')).catch(e=>{
    process.stderr.write('GH Aura HTML research: '+compact(e.message)+'\n');process.exitCode=1;
  });
}

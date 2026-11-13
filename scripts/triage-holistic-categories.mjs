// Developer-only OFFLINE holistic profile TRIAGE. This ranks review priority,
// not engineers, credentials, visual design quality or hiring probability.
import {readFileSync,readdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {HOLISTIC_STYLES} from '../src/holistic-profile-taxonomy.mjs';
const ROOT=fileURLToPath(new URL('../research/',import.meta.url));
const IDS=HOLISTIC_STYLES.map(x=>x.id);
const read=(path)=>{if(statSync(path).size>1024*1024)throw Error('Bounded research file exceeded 1MiB');
  return JSON.parse(readFileSync(path,'utf8'));};
const batchFiles=name=>readdirSync(resolve(ROOT,name))
  .filter(x=>/^batch-\d{3}\.json$/.test(x)).sort().map(x=>read(resolve(ROOT,name,x)));
export function styleHypotheses(g,h,ref=null){
  if(g.availability!=='graphql-public-metadata')
    return {primary:null,secondary:[],signals:[],uncertainty:'not-returned'};
  const r=g.profileReadme||{},hr=h?.renderedReadme||{},pins=g.pinnedRepositories?.count||0,
    described=(g.pinnedRepositories?.items||[]).filter(x=>x.descriptionPresent).length;
  const cues=new Map(IDS.map(x=>[x,{weight:0,reasons:[]}]));
  const add=(id,w,why)=>{const c=cues.get(id);c.weight+=w;c.reasons.push(why);};
  if(r.state!=='observed'&&pins>=2)
    add('native-no-readme',12,'No root README observed; '+pins+' pinned items. Missing is not proof of absence.');
  else if(r.state!=='observed'&&g.biography?.present)
    add('native-no-readme',6,'Sidebar supplies identity without a root README observed.');
  if(r.state==='observed'){
    const words=r.approxWords??0,imgs=r.imageCount??0,heads=r.headings??0;
    if(words<=90&&imgs<=1)
      add('minimal-text',10,'Short, low-image README: '+words+' approximate words; '+imgs+' images.');
    if(words>=115&&heads>=2)
      add('technical-editorial',10,'Structured README: '+heads+' headings and '+words+' approximate words.');
    if(words>=100&&imgs<=2)
      add('technical-editorial',2,'Text-first README merits detailed editorial inspection.');
    if(imgs>=3){
      add('visual-illustrated',11,'README references '+imgs+' images; quality and rights unreviewed.');
      if(r.themeAwareImages>0)add('visual-illustrated',2,'Theme-aware images detected.');
    }
    if(r.remoteStatsImages>=2)
      add('data-dashboard',15,'README has '+r.remoteStatsImages+' stats/media signals; metrics not verified.');
  }
  if(pins>=3){
    add('project-showcase',5,'Profile displays '+pins+' pinned items.');
    if(described>=3)add('project-showcase',3,described+' pinned projects have descriptions.');
    if(r.state==='observed'&&r.headings>=2)add('project-showcase',1,'README adds headings to pinned project links.');
  }
  if(hr.state==='github-rendered-html-observed'){
    if(hr.codeBlocks>=1)add('terminal-code',hr.codeBlocks>=2?13:9,
      'GitHub rendered README contains '+hr.codeBlocks+' code blocks.');
    if(hr.images>=3&&(r.imageCount||0)<3)
      add('visual-illustrated',8,'Rendered README contains '+hr.images+' images.');
  }
  if(ref?.discoverySource?.includes(': Dynamic')&&r.state==='observed')
    add('dynamic-content',12,'Previously catalogued dynamic README; freshness requires verification.');
  if(['simonw','Flipez','eugeneyan','athul'].some(x=>x.toLowerCase()===g.login.toLowerCase())&&r.state==='observed')
    add('dynamic-content',13,'Prior direct README observation showed dated updates; live maintenance not established.');
  const ordered=[...cues.entries()].filter(([_,x])=>x.weight>0)
    .sort((a,b)=>b[1].weight-a[1].weight||IDS.indexOf(a[0])-IDS.indexOf(b[0]));
  return {primary:ordered[0]?.[0]||null,
    secondary:ordered.slice(1,4).filter(([_,x])=>x.weight>=5).map(([id])=>id),
    signals:ordered.slice(0,5).map(([id,c])=>({style:id,signalStrength:c.weight,
      reasons:c.reasons.slice(0,3)})),
    uncertainty:'PRELIMINARY from structural features, not visual/editorial judgement'};
}
export function buildHolisticTriage(roster,graphql,html,old){
  if(roster.schema!=='gh-aura-holistic-profile-candidates-v1'||roster.candidates?.length!==600||
     graphql.length!==12||html.length!==12)throw Error('Expected complete 600-candidate research inputs.');
  const maps=[new Map(),new Map()];
  for(let source=0;source<2;source++){
    const list=source?html:graphql;
    for(const batch of list){
      if(batch.schema!==(source?'gh-aura-public-html-facets-batch-v1':'gh-aura-holistic-api-observation-batch-v1')||
        !Number.isInteger(batch.start)||batch.profiles?.length!==50)
        throw Error('Invalid public observation batch');
      for(let i=0;i<50;i++){
        const expected=roster.candidates[batch.start+i],p=batch.profiles[i],key=expected?.login.toLowerCase();
        if(!key||!p||p.login.toLowerCase()!==key||maps[source].has(key))
          throw Error('Missing, repeated or reordered account in public evidence');
        maps[source].set(key,p);
      }
    }
    if(maps[source].size!==600)throw Error('Incomplete public evidence collection');
  }
  const oldMap=new Map(old.entries.map(x=>[x.id.toLowerCase(),x]));
  const accounts=roster.candidates.map(x=>{
    const key=x.login.toLowerCase(),g=maps[0].get(key),h=maps[1].get(key),
      hypothesis=styleHypotheses(g,h,oldMap.get(key));
    const pins=g.pinnedRepositories?.items||[],badges=h.achievements?.state==='observed-visible-section'
      ?h.achievements.items.map(x=>x.slug):null;
    const readme=h.renderedReadme?.state==='github-rendered-html-observed';
    const coverage=(g.avatar?.url?1:0)+(g.biography?.state==='metadata-observed'?1:0)+
      (g.links?.state==='metadata-observed'?1:0)+
      (g.contributionCalendar?.state==='github-visible-to-query-caller'?1:0)+
      (pins.length>0?1:0)+(readme?1:0)+(badges!==null?1:0);
    return {login:x.login,url:x.profileUrl,sources:x.sources,
      publicData:g.availability==='graphql-public-metadata',
      htmlObserved:h.state==='github-page-observed',
      evidence:{avatarUrl:Boolean(g.avatar?.url),
        biographyPresent:g.biography?.present??null,website:g.links?.websitePresent??null,
        pinned:pins.length,pinnedDescribed:pins.filter(z=>z.descriptionPresent).length,
        rootReadme:g.profileReadme?.state||'unknown',
        words:g.profileReadme?.approxWords??null,
        markdownImages:g.profileReadme?.imageCount??null,
        remoteStatsSignals:g.profileReadme?.remoteStatsImages??null,
        renderedReadme:readme,
        renderedCodeBlocks:readme?h.renderedReadme.codeBlocks:null,
        renderedImages:readme?h.renderedReadme.images:null,
        visibleAchievementSlugs:badges,
        contributionCalendar:g.contributionCalendar?.state==='github-visible-to-query-caller'},
      category:hypothesis,coverageForReview:coverage,
      userSupplied:x.sources.includes('user-supplied-8'),
      status:'candidate-only; no rendered desktop/mobile themes or visual editorial review',
      approved:false};
  });
  const counts={candidates:accounts.length,
    publicApi:accounts.filter(x=>x.publicData).length,
    publicHtml:accounts.filter(x=>x.htmlObserved).length,
    achievementsVisible:accounts.filter(x=>x.evidence.visibleAchievementSlugs!==null).length,
    badgesObserved:accounts.reduce((n,x)=>n+(x.evidence.visibleAchievementSlugs?.length||0),0),
    renderedReadmes:accounts.filter(x=>x.evidence.renderedReadme).length,
    classifiedHypotheses:accounts.filter(x=>x.category.primary).length,
    visuallyReviewed:0,approvedProfiles:0,categoryWinners:0};
  const groups=Object.fromEntries(IDS.map(style=>{
    const members=accounts.filter(x=>x.category.primary===style);
    members.sort((a,b)=>b.coverageForReview-a.coverageForReview||
      Number(b.userSupplied)-Number(a.userSupplied)||
      ((b.category.signals[0]?.signalStrength||0)-(a.category.signals[0]?.signalStrength||0))||
      a.login.localeCompare(b.login));
    return [style,{count:members.length,reviewQueue:members.slice(0,12).map(x=>({
      login:x.login,url:x.url,cover:x.coverageForReview,
      reason:x.category.signals[0]?.reasons?.[0]||'Insufficient data',
      originalUserReference:x.userSupplied}))}];
  }));
  return {schema:'gh-aura-holistic-category-triage-v1',
    status:'STRUCTURAL CLASSIFICATION FOR REVIEW ONLY. NOT best profiles or final category winners',
    source:'GraphQL and GitHub public rendered HTML, not GitHub Pages',
    counts,groups,accounts,
    warnings:['Avatar URL is not an artistic quality review.',
      'Badges, stars, followers and contribution counts cannot establish skills or profile quality.',
      'No desktop/mobile and light/dark independent review of the full 600 profiles.',
      'Original eight and full 100 README study preserved. Old shortlist of 25 is provisional.',
      'Human approval and rights/link checks required before any category exemplar is published.']};
}
export function renderTriageReport(result){
  const out=['# GH Aura — perfiles públicos por categorías (revisión preliminar)','',
    '**600 candidatos; '+result.counts.publicApi+' cuentas con evidencia GraphQL; '+
    result.counts.publicHtml+' páginas HTML públicas observadas.**',
    'Hay '+result.counts.achievementsVisible+' secciones de achievements visibles y '+
      result.counts.renderedReadmes+' estructuras de README renderizado recuperadas.',
    '',
    '**NO SON GANADORES NI ESTILOS APROBADOS.** Es una cola de revisión priorizada según evidencia disponible.',''];
  for(const style of IDS){
    const group=result.groups[style];out.push('## '+style+' ('+group.count+' hipótesis)','',
      '| Perfil | Señal documentada para revisión |','| --- | --- |');
    for(const x of group.reviewQueue)out.push('| ['+x.login+']('+x.url+') | '+
      x.reason.replace(/\|/g,' / ').slice(0,160)+
      (x.originalUserReference?' · referencia original':'')+' |');
    out.push('');
  }
  out.push('## Pendientes de aprobación','',
    'Revisar en cada finalista: imagen/avatar, biografía y enlaces, README completo, pins, gráfico de contribuciones, achievements visibles, legibilidad móvil/escritorio y modos claro/oscuro. Verificar licencias y atribuciones. La selección final debe compararse dentro de cada estilo sin cuotas arbitrarias.','');
  return out.join('\n');
}
function main(argv){
  const vals={};
  for(let i=0;i<argv.length;i+=2){
    if(!['--json','--markdown'].includes(argv[i])||!argv[i+1])
      throw Error('Use --json new.json --markdown new.md');
    vals[argv[i]]=resolve(argv[i+1]);
  }
  if(!vals['--json']?.endsWith('.json')||!vals['--markdown']?.endsWith('.md')||
    Object.values(vals).some(existsSync))
    throw Error('Specify two new output paths; overwrite is not permitted.');
  const roster=read(resolve(ROOT,'profile-candidates-600.json')),
    old=read(resolve(ROOT,'profile-design-references.json'));
  const result=buildHolisticTriage(roster,batchFiles('graphql-observations'),batchFiles('html-facets'),old);
  writeFileSync(vals['--json'],JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(vals['--markdown'],renderTriageReport(result),{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({counts:result.counts,
    groups:Object.fromEntries(Object.entries(result.groups).map(([k,v])=>[k,v.count]))})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}
  catch(e){process.stderr.write('GH Aura triage: '+e.message+'\n');process.exitCode=1;}
}

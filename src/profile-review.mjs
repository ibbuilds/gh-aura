import { checkDraft } from './editorial.mjs';

// Purely local heuristics: no crawling, credentials, remote writes or invented score.
export function professionalReview(markdown,{goal='general',maxWords=220}={}){
  if(!['general','hiring','research','open-source','creative'].includes(goal))
    throw Error('Unknown professional review goal.');
  const base=checkDraft(markdown,null,{maxWords});
  const visible=markdown.replace(/<!--[\s\S]*?-->/g,'')
    .replace(/```[\s\S]*?```/g,'');
  const observations=base.findings.map(item=>({
    id:item.id,severity:item.severity==='error'?'error':'review',message:item.message,
  }));
  const add=(id,message,severity='review')=>observations.push({id,severity,message});
  const markdownImages=[...visible.matchAll(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)]
    .map(m=>({alt:m[1],url:m[2]}));
  const htmlImages=[...visible.matchAll(/<img\b([^>]*)>/gi)].map(m=>({
    alt:m[1].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1]||'',
    url:m[1].match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1]||'',
  }));
  const images=[...markdownImages,...htmlImages];
  const imageUrls=images.map(x=>x.url);
  const externalImages=images.filter(x=>/^https?:\/\//i.test(x.url));
  const unknownAlts=images.filter(x=>!x.alt.trim()).length;
  const dynamicImages=images.filter(x=>/shields\.io|github-readme-stats|streak-stats|komarev|typing-svg|ghchart|wakatime/i.test(x.url));
  const linkedRepos=new Set([...visible.matchAll(/https:\/\/github\.com\/([\w-]+)\/([\w.-]+)/gi)]
    .filter(m=>!['issues','pulls','discussions','sponsors'].includes(m[2].toLowerCase()))
    .map(m=>m[1].toLowerCase()+'/'+m[2].toLowerCase()));
  const simpleLinks=[...visible.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)];
  if(unknownAlts)add('missing-alt',unknownAlts+' image(s) have no descriptive alt text; check decorative vs meaningful use.');
  if(images.length>10)add('media-density','More than ten images; assess whether every visual helps the reader.');
  if(dynamicImages.length>3)add('dynamic-density','Several external stats, badges or animations compete with work evidence.');
  if(images.length&&imageUrls.length===1&&base.approximateWords<35)
    add('image-only','One image carries almost the entire profile; provide an accessible text and project fallback.');
  if(goal==='hiring'&&linkedRepos.size===0)
    add('project-evidence','No GitHub project link detected; a job seeker should make their actual work inspectable.');
  if(goal==='hiring'&&base.approximateWords<35)
    add('insufficient-context','This brief profile may not explain enough about an unfamiliar candidate.');
  if(goal==='research'&&!/(research|publication|paper|investigaci[oó]n|art[ií]culo|publicaci[oó]n)/i.test(visible))
    add('research-context','No clear research or publication context found; verify whether that is intended.');
  const tables=visible.split('\n').filter(l=>/^\s*\|.*\|\s*$/.test(l));
  if(tables.some(l=>(l.match(/\|/g)||[]).length>6))
    add('wide-table','A wide Markdown table may be difficult to read on mobile.');
  const externalDomains=new Set(externalImages.map(x=>{try{return new URL(x.url).hostname;}catch{return 'unknown';}}));
  if(externalDomains.size>3)
    add('external-image-dependencies','Images depend on multiple remote hosts; verify licensing, uptime and privacy.');
  return {format:'gh-aura-professional-review-v1',goal,
    status:observations.length?'needs-review':'no-heuristic-findings',
    metrics:{approximateWords:base.approximateWords,imageCount:images.length,
      externalImageHosts:externalDomains.size,dynamicImages:dynamicImages.length,
      githubProjectLinks:linkedRepos.size,markdownLinks:simpleLinks.length},
    observations,
    caveat:'Offline structural checks only: no verified authorship, hiring score, external link check, image licensing check or actual GitHub desktop/mobile rendering test. A human must review the draft.'};
}

export function renderProfessionalReview(report){
  const lines=['# Professional README review', '',
    'Goal: '+report.goal+'; '+report.metrics.approximateWords+' approximate words', '',
    ...(report.observations.length?report.observations.map(x=>'- '+x.severity+': '+x.message):
      ['No structural findings from these heuristics. Human review is still required.']),
    '',report.caveat,''];
  return lines.join('\n');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildHolisticTriage,styleHypotheses,renderTriageReport} from '../scripts/triage-holistic-categories.mjs';
import {parsePublicProfileHtml} from '../scripts/research-profile-html.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../research/'+name,import.meta.url),'utf8'));
test('public GitHub HTML extracts only bounded visible achievements and rendered README structure',()=>{
  const html='<html><title>sam (Test) · GitHub</title>'+
    '<div class="user-profile-bio"></div>'+
    '<h2><a href="/sam?tab=achievements">Achievements</a></h2>'+
    '<div><a href="/sam?achievement=pull-shark&amp;tab=achievements">'+
    '<img alt="Achievement: Pull Shark" src="/badge.png"><span class="achievement-tier-label--gold">x4</span></a></div>'+
    '<article class="markdown-body"><h2>Projects</h2><p><a href="https://example.org">Demo</a></p>'+
    '<pre>code</pre><img alt="Project screenshot" src="one.png"></article></html>';
  const result=parsePublicProfileHtml('sam',html,'2026-11-12T00:00:00Z');
  assert.equal(result.state,'github-page-observed');
  assert.equal(result.achievements.state,'observed-visible-section');
  assert.deepEqual(result.achievements.items.map(x=>x.slug),['pull-shark']);
  assert.equal(result.achievements.items[0].tier,'gold');
  assert.equal(result.renderedReadme.state,'github-rendered-html-observed');
  assert.equal(result.renderedReadme.images,1);
  assert.equal(result.renderedReadme.codeBlocks,1);
  assert.equal(result.completedHolisticAudit,false);
  assert.equal(JSON.stringify(result).includes('Project screenshot'),false);
  assert.equal(parsePublicProfileHtml('sam','<html></html>','2026-11-12').achievements.state,'not-observed');
  assert.throws(()=>parsePublicProfileHtml('../etc','<html></html>','today'),/Invalid/);
});
test('structure-only classifier emits provisional primary and secondary directions',()=>{
  const fake={login:'example',availability:'graphql-public-metadata',
    pinnedRepositories:{count:4,items:Array.from({length:4},()=>({descriptionPresent:true}))},
    biography:{present:true},profileReadme:{state:'observed',approxWords:180,
      imageCount:0,headings:3,remoteStatsImages:0,themeAwareImages:0}};
  const h={renderedReadme:{state:'github-rendered-html-observed',codeBlocks:2,
    images:0,tables:0}};
  const c=styleHypotheses(fake,h);
  assert.equal(c.primary,'terminal-code');
  assert.ok(c.secondary.includes('technical-editorial'));
  assert.match(c.uncertainty,/not visual/);
  assert.equal(styleHypotheses({...fake,availability:'not-returned-by-github'},h).primary,null);
  const pictures=styleHypotheses({...fake,profileReadme:{state:'observed',
    approxWords:80,imageCount:9,headings:1,remoteStatsImages:0}},{
    renderedReadme:{state:'github-rendered-html-observed',images:9}});
  assert.equal(pictures.primary,'visual-illustrated');
  const missing=styleHypotheses({...fake,profileReadme:{state:'not-observed-at-root'}},{});
  assert.equal(missing.primary,'native-no-readme');
});
test('600 public observations are categorized as review candidates, never winners',()=>{
  const roster=read('profile-candidates-600.json'),old=read('profile-design-references.json');
  const starts=Array.from({length:12},(_,i)=>i*50);
  const gql=starts.map(x=>read('graphql-observations/batch-'+String(x).padStart(3,'0')+'.json'));
  const html=starts.map(x=>read('html-facets/batch-'+String(x).padStart(3,'0')+'.json'));
  const report=buildHolisticTriage(roster,gql,html,old);
  assert.equal(report.counts.candidates,600);
  assert.equal(report.counts.publicApi,561);
  assert.equal(report.counts.publicHtml,561);
  assert.equal(report.counts.approvedProfiles,0);
  assert.equal(report.counts.visuallyReviewed,0);
  assert.equal(report.counts.categoryWinners,0);
  assert.ok(report.counts.achievementsVisible>450);
  assert.ok(report.counts.renderedReadmes>300);
  assert.equal(report.accounts.length,600);
  assert.equal(new Set(report.accounts.map(x=>x.login.toLowerCase())).size,600);
  assert.equal(report.accounts.filter(x=>x.publicData).length,561);
  assert.equal(report.accounts.filter(x=>x.userSupplied).length,8);
  assert.ok(report.accounts.every(x=>x.approved===false));
  assert.ok(report.accounts.every(x=>!Object.hasOwn(x,'hiringScore')));
  assert.ok(Object.keys(report.groups).length===8);
  assert.ok(Object.values(report.groups).every(x=>x.reviewQueue.length<=12));
  assert.match(renderTriageReport(report),/NO SON GANADORES/);
  const broken=structuredClone(html);
  broken[0].profiles[0].login='someone-else';
  assert.throws(()=>buildHolisticTriage(roster,gql,broken,old),/mismatched/);
});

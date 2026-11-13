// Developer-only offline aggregation of four-mode PUBLIC profile screenshot tests.
// Technical rendering telemetry does NOT complete a human editorial profile review.
import {readFileSync,readdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {MODES} from './visual-profile-smoke.mjs';
const ROOT=fileURLToPath(new URL('../research/',import.meta.url));
const MODE_NAMES=MODES.map(x=>x.id);
const sorted=(a,b)=>a.localeCompare(b);
export function analyzeFourModeEvidence(roster,batches){
  if(roster?.schema!=='gh-aura-holistic-profile-candidates-v1'||
    !Array.isArray(roster.candidates)||roster.candidates.length!==600||
    !Array.isArray(batches)||batches.length!==12)
    throw Error('Expected exact 600-candidate roster and 12 bounded screenshot batches.');
  const byId=new Map(),starts=new Set();
  for(const batch of batches){
    if(batch?.schema!=='gh-aura-four-view-render-smoke-v1'||batch.checked!==50||
      batch.profiles?.length!==50||!Number.isInteger(batch.start)||batch.start<0||
      batch.start%50!==0||batch.start>550||starts.has(batch.start)||
      batch.editorialReviews!==0||batch.categoryWinners!==0)
      throw Error('Unexpected visual smoke batch.');
    starts.add(batch.start);
    for(let i=0;i<50;i++){
      const row=batch.profiles[i],id=roster.candidates[batch.start+i]?.login;
      if(!id||id.toLowerCase()!==row.login?.toLowerCase()||byId.has(id.toLowerCase())||
        row.editoriallyReviewed!==false||row.categoryApproved!==false)
        throw Error('Mismatched profile or forged editorial approval in screenshot research.');
      byId.set(id.toLowerCase(),row);
    }
  }
  if(byId.size!==600)throw Error('Incomplete screenshot coverage');
  const accounts=roster.candidates.map(p=>{
    const row=byId.get(p.login.toLowerCase());
    const captured=MODE_NAMES.filter(id=>row.modes?.[id]?.captured===true);
    const valid=(x)=>x?.captured===true&&Number.isInteger(x.screenshotBytes)&&
      x.screenshotBytes>=1024&&/^[a-f0-9]{64}$/.test(x.screenshotSha256||'')&&
      Number.isInteger(x.viewportWidth)&&x.viewportWidth>300;
    const trustworthy=captured.every(id=>valid(row.modes[id]));
    if(!trustworthy)throw Error('Invalid screenshot digest/viewport data');
    const all4=captured.length===4;
    const modes=row.modes||{},light=modes.desktopLight,dark=modes.desktopDark,
      ml=modes.mobileLight,md=modes.mobileDark;
    const themeCheck=all4&&light.bodyBackground!==dark.bodyBackground&&
      ml.bodyBackground!==md.bodyBackground;
    const viewportCheck=all4&&light.viewportWidth===1200&&dark.viewportWidth===1200&&
      ml.viewportWidth===390&&md.viewportWidth===390;
    const overflow=all4&&(ml.overflowX===true||md.overflowX===true);
    const broken=all4&&[light,dark,ml,md].some(x=>x.brokenVisibleImages>0);
    return {
      login:p.login,profileUrl:p.profileUrl,
      capturedModes:captured,allFour:all4,
      modeStatus:row.status,
      themeChanged:all4?themeCheck:null,
      viewportMatched:all4?viewportCheck:null,
      mobileOverflow:all4?overflow:null,
      visibleBrokenImages:all4?broken:null,
      evidenceAt:row.checkedAt,reason:row.reason||null,
      humanVisualReview:'NOT_PERFORMED',editorialDecision:null,
    };
  });
  const n=fn=>accounts.filter(fn).length;
  const summary={schema:'gh-aura-public-render-smoke-summary-v1',
    status:'AUTOMATED BROWSER CHECKS ONLY — NO HOLISTIC STYLE APPROVALS',
    sources:{candidateRoster:'research/profile-candidates-600.json',
      batchCount:batches.length,modeNames:MODE_NAMES,
      browser:'headless Chromium/Google Chrome, public profiles; no authentication',
      screenshotRetention:'none; digests are in research/render-smokes/batch-*.json'},
    counts:{
      candidates:accounts.length,
      screenshot4Modes:n(x=>x.allFour),
      partialScreenshots:n(x=>x.capturedModes.length>0&&!x.allFour),
      noScreenshots:n(x=>x.capturedModes.length===0),
      bothThemesObserved:n(x=>x.themeChanged===true),
      correctViewports:n(x=>x.viewportMatched===true),
      mobileHorizontalOverflowFlags:n(x=>x.mobileOverflow===true),
      visibleBrokenImageFlags:n(x=>x.visibleBrokenImages===true),
      completeHumanVisualReviews:0,approvedProfiles:0,categoryWinners:0,
    },
    incomplete:accounts.filter(x=>!x.allFour).map(x=>({login:x.login,captured:x.capturedModes,reason:x.reason})),
    overflowCandidates:accounts.filter(x=>x.mobileOverflow).map(x=>x.login),
    brokenImageCandidates:accounts.filter(x=>x.visibleBrokenImages).map(x=>x.login),
    limitations:[
      'Each public page was rendered in four emulated viewports; the screenshot was hashed then discarded.',
      'A screenshot existing does NOT prove readability, good mobile design, accessible contrast or rightful asset use.',
      'Image visibility flags apply only to the viewport; lazy-loaded content may not have been inspected.',
      'Emulated mobile/dark rendering is technical evidence, NOT a real handset or user usability study.',
      'Avatar, real ownership of pins, achievements relevance, genuine content and category fit require human inspection.',
      'This study does not certify hiring outcomes, code skill, contribution authenticity, or any best-in-category rating.'
    ],
    records:accounts};
  return summary;
}
export function summarizeByProvisionalStyle(summary,triage){
  if(summary.schema!=='gh-aura-public-render-smoke-summary-v1'||
    triage.schema!=='gh-aura-holistic-category-triage-v1'||
    summary.records.length!==600||triage.accounts.length!==600)
    throw Error('Expected complete public profile visual smoke and provisional style corpora.');
  const rows=new Map(summary.records.map(x=>[x.login.toLowerCase(),x]));
  const groups={};
  for(const account of triage.accounts){
    const key=account.login.toLowerCase(),s=rows.get(key);
    if(!s)throw Error('Missing profile from style analysis.');
    const style=account.category?.primary||'unclassified';
    const group=groups[style]||{candidates:0,fourViews:0,themeChanges:0,mobileOverflow:0,visibleBrokenImages:0,
      incompleteSample:[]};
    group.candidates++;
    if(s.allFour)group.fourViews++;
    if(s.themeChanged)group.themeChanges++;
    if(s.mobileOverflow)group.mobileOverflow++;
    if(s.visibleBrokenImages)group.visibleBrokenImages++;
    if(!s.allFour&&group.incompleteSample.length<10)group.incompleteSample.push(account.login);
    groups[style]=group;
  }
  return {schema:'gh-aura-technical-render-by-provisional-category-v1',
    categories:groups,
    caveat:'Styles are hypotheses; counts represent first-fold technical screenshot checks, not visual merit or reviewed final category winners.'};
}
function main(args){
  if(args.length!==1||!args[0].endsWith('.json')||existsSync(resolve(args[0])))
    throw Error('Supply one new .json output file');
  const read=path=>{if(statSync(path).size>1024*1024)throw Error('Research batch too large');
    return JSON.parse(readFileSync(path,'utf8'));};
  const roster=read(resolve(ROOT,'profile-candidates-600.json'));
  const dir=resolve(ROOT,'render-smokes');
  const files=readdirSync(dir).filter(x=>/^batch-\d{3}\.json$/.test(x)).sort();
  const batches=files.map(x=>read(resolve(dir,x)));
  const data=analyzeFourModeEvidence(roster,batches);
  const triage=read(resolve(ROOT,'holistic-category-triage.json'));
  data.styleDiagnostics=summarizeByProvisionalStyle(data,triage);
  writeFileSync(resolve(args[0]),JSON.stringify(data)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({counts:data.counts,
    incomplete:data.incomplete.length,overflows:data.overflowCandidates.length})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}
  catch(e){process.stderr.write('GH Aura render summary: '+e.message+'\n');process.exitCode=1;}
}

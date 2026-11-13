import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODES,runVisualSmoke} from '../scripts/visual-profile-smoke.mjs';
import {analyzeFourModeEvidence,summarizeByProvisionalStyle} from '../scripts/summarize-four-mode-visuals.mjs';

const roster=JSON.parse(readFileSync(new URL('../research/profile-candidates-600.json',import.meta.url),'utf8'));
const fake=(login)=>{
  const modes=Object.fromEntries(MODES.map(mode=>[mode.id,{
    captured:true,viewportWidth:mode.width,screenshotBytes:18000,
    screenshotSha256:'a'.repeat(64),
    bodyBackground:mode.dark?'rgb(13, 17, 23)':'rgb(255, 255, 255)',
    brokenVisibleImages:0,overflowX:false,
  }]));
  return {login,checkedAt:'2026-11-12T23:59:59Z',
    status:'all-four-modes-captured',editoriallyReviewed:false,categoryApproved:false,modes};
};
const batch=(start)=>({schema:'gh-aura-four-view-render-smoke-v1',
  checked:50,editorialReviews:0,categoryWinners:0,start,
  profiles:roster.candidates.slice(start,start+50).map(x=>fake(x.login))});
const all=()=>Array.from({length:12},(_,i)=>batch(i*50));

test('Chrome emulation defines 4 independent modes, including actual 390px mobile',()=>{
  assert.deepEqual(MODES.map(x=>x.id),['desktopLight','desktopDark','mobileLight','mobileDark']);
  assert.deepEqual(MODES.map(x=>x.width),[1200,1200,390,390]);
  assert.deepEqual(MODES.map(x=>x.dark),[false,true,false,true]);
});
test('offline visual smoke summary requires all 600 in original order and no fake editorial approvals',()=>{
  const merged=analyzeFourModeEvidence(roster,all());
  assert.equal(merged.counts.candidates,600);
  assert.equal(merged.counts.screenshot4Modes,600);
  assert.equal(merged.counts.bothThemesObserved,600);
  assert.equal(merged.counts.correctViewports,600);
  assert.equal(merged.counts.completeHumanVisualReviews,0);
  assert.equal(merged.counts.categoryWinners,0);
  assert.equal(merged.incomplete.length,0);
  assert.ok(merged.records.every(x=>x.humanVisualReview==='NOT_PERFORMED'&&x.editorialDecision===null));
  const wrong=all();wrong[0].profiles[1].login='another';
  assert.throws(()=>analyzeFourModeEvidence(roster,wrong),/Mismatched/);
  const forgery=all();forgery[0].profiles[0].categoryApproved=true;
  assert.throws(()=>analyzeFourModeEvidence(roster,forgery),/forged/);
});
test('automated missing screenshots, mobile clipping, broken images and theme failures become flags',()=>{
  const cases=all();
  cases[0].profiles[0].modes.mobileDark={captured:false,error:'network'};
  cases[0].profiles[0].status='partially-captured';
  cases[0].profiles[1].modes.mobileLight.overflowX=true;
  cases[0].profiles[2].modes.mobileLight.brokenVisibleImages=2;
  cases[0].profiles[3].modes.desktopDark.bodyBackground='rgb(255, 255, 255)';
  const s=analyzeFourModeEvidence(roster,cases);
  assert.equal(s.counts.screenshot4Modes,599);
  assert.equal(s.counts.partialScreenshots,1);
  assert.equal(s.counts.mobileHorizontalOverflowFlags,1);
  assert.equal(s.counts.visibleBrokenImageFlags,1);
  assert.equal(s.counts.bothThemesObserved,598);
  assert.equal(s.counts.categoryWinners,0);
  assert.equal(s.incomplete[0].login.toLowerCase(),roster.candidates[0].login.toLowerCase());
});
test('real screenshot runner rejects invalid user input before opening a browser',async()=>{
  await assert.rejects(runVisualSmoke(['../../etc/passwd']),/real public/);
  await assert.rejects(runVisualSmoke([]),/real public/);
  await assert.rejects(runVisualSmoke(Array(51).fill('safe')),/real public/);
});

test('technical render diagnostics are grouped within provisional styles, never translated into professional rankings',()=>{
  const triage=JSON.parse(readFileSync(new URL('../research/holistic-category-triage.json',import.meta.url),'utf8'));
  const summary=analyzeFourModeEvidence(roster,all());
  const grouped=summarizeByProvisionalStyle(summary,triage);
  assert.equal(grouped.schema,'gh-aura-technical-render-by-provisional-category-v1');
  assert.equal(Object.values(grouped.categories).reduce((a,x)=>a+x.candidates,0),600);
  assert.equal(Object.values(grouped.categories).reduce((a,x)=>a+x.fourViews,0),600);
  assert.ok(!Object.hasOwn(grouped,'qualityScore'));
  assert.ok(!Object.hasOwn(grouped,'winners'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { planCalendar,calendarDigest,validateCalendarPlan } from '../src/calendar.mjs';
import { previewCalendar } from '../src/calendar-preview.mjs';

test('calendar preview preserves known counts, separates additions and never fills unknown dates with zero',()=>{
  const plan=planCalendar({from:'2022-01-01',to:'2022-01-02',dailyTargets:{'2022-01-01':3,'2022-01-02':1}},new Map([['2022-01-01',2],['2022-01-02',0]]));
  const preview=previewCalendar(plan,{svg:true});
  assert.deepEqual(preview.days.slice(0,2),[{date:'2022-01-01',before:2,added:1,projected:3,inRange:true},{date:'2022-01-02',before:0,added:1,projected:1,inRange:true}]);
  assert.equal(preview.days[2].before,null);assert.equal(preview.days[2].projected,null);assert.equal(preview.summary.newCommits,2);
  assert.match(preview.svg,/hatched cells have unknown counts/);assert.match(preview.svg,/not professional history/);assert.doesNotMatch(preview.svg,/<script|https:/);
});
test('a legacy plan without a baseline previews additions without claiming exact resulting totals',()=>{
  const plan=planCalendar({from:'2022-01-01',to:'2022-01-01',density:100,intensity:1});
  const preview=previewCalendar(plan);assert.equal(preview.days[0].added,1);assert.equal(preview.days[0].before,null);assert.equal(preview.days[0].projected,null);
});
test('multi-year previews require a selected year and tampered baseline projections are rejected',()=>{
  const plan=planCalendar({from:'2022-12-31',to:'2023-01-01',density:0},new Map([['2022-12-31',0],['2023-01-01',1]]));
  assert.throws(()=>previewCalendar(plan),/Choose one/);assert.equal(previewCalendar(plan,{year:2023}).year,2023);
  const changed=structuredClone(plan);delete changed.settings.initialCounts['2022-12-31'];changed.fingerprint=calendarDigest(changed);
  assert.throws(()=>validateCalendarPlan(changed),/baseline coverage/);
});
test('CLI preview is offline and rejects apply credentials on the preview action',()=>{
  const root=mkdtempSync(join(tmpdir(),'gh-aura-calendar-preview-'));
  try{
    const file=join(root,'calendar.json');writeFileSync(file,JSON.stringify(planCalendar({year:'2022',density:0})));
    const run=args=>spawnSync(process.execPath,['src/cli.mjs',...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
    const preview=run(['activity','preview','--review',file,'--svg']);assert.equal(preview.status,0,preview.stderr);assert.match(preview.stdout,/^<svg/);
    const denied=run(['activity','preview','--review',file,'--confirm','a'.repeat(64)]);assert.equal(denied.status,1);assert.match(denied.stderr,/preview accepts only/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

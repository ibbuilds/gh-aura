import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { calendarDigest, planCalendar, loadCalendarPlan } from '../src/calendar.mjs';
import { fastImportCalendar, applyCalendar } from '../src/calendar-apply.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';

const now=new Date('2026-11-11T00:00:00.000Z');
const plan=(options={})=>planCalendar({
  year:'2022',density:28,growth:50,intensity:2,weekends:30,seed:17,now,...options
});
const git=(args,{cwd,input,env}={})=>{
  const r=spawnSync('git',args,{cwd,input,env,encoding:'utf8',timeout:30000,windowsHide:true});
  assert.equal(r.status,0,'git '+args[0]+': '+r.stderr);
  return (r.stdout||'').trim();
};
test('deterministic density and per-year evolution, without modifying GitHub',()=>{
  const a=plan(),b=plan();
  assert.deepEqual(a.days,b.days);
  assert.equal(a.fingerprint,b.fingerprint);
  assert.equal(a.fingerprint,calendarDigest(a));
  assert.ok(a.summary.selectedDays>0&&a.summary.selectedDays<365);
  assert.ok(a.summary.syntheticCommits>=a.summary.selectedDays);
  assert.ok(a.days.every(d=>d.kind==='synthetic-practice'));
  const years=planCalendar({from:'2020',to:'2022',density:75,growth:80,
    weekends:30,seed:17,intensity:1,now});
  assert.ok(years.summary.perYear[2020].targetDensity<years.summary.perYear[2021].targetDensity);
  assert.ok(years.summary.perYear[2021].targetDensity<years.summary.perYear[2022].targetDensity);
  assert.ok(years.summary.perYear[2020].selectedDays<years.summary.perYear[2022].selectedDays);
});
test('explicit historical observations preserve existing days and only fill targeted gaps',()=>{
  const m=new Map();
  for(let ms=Date.parse('2022-01-01T00:00:00Z');ms<=Date.parse('2022-01-31T00:00:00Z');ms+=86400000){
    const d=new Date(ms).toISOString().slice(0,10);
    m.set(d,d==='2022-01-03'?4:0);
  }
  const a=planCalendar({from:'2022-01-01',to:'2022-01-31',density:80,
    mode:'uniform',weekends:100,intensity:1,now},m);
  assert.ok(a.days.length>0);
  assert.ok(!a.days.some(x=>x.date==='2022-01-03'));
  assert.equal(a.settings.existingHistory,'supplied-verified-counts');
  assert.throws(()=>planCalendar({from:'2022-01-01',to:'2022-01-31',now},new Map()),/incomplete/);
});
test('zero density has zero generated work; invalid ranges and oversized plans fail',()=>{
  const p=plan({density:0});
  assert.equal(p.days.length,0);
  assert.equal(p.summary.syntheticCommits,0);
  assert.throws(()=>plan({density:101}),/density/);
  assert.throws(()=>plan({year:'2022-02-30'}),/calendar date/);
  assert.throws(()=>plan({from:'2007',to:'2008'}),/between 2008/);
  assert.throws(()=>plan({year:'2027'}),/between 2008/);
  assert.throws(()=>planCalendar({from:'2020',to:'2025',density:100,
    intensity:6,weekends:100,mode:'uniform',now}),/2500 commits/);
});
test('tampering with approved file is detected before GitHub network operations',()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-calendar-file-'));
  try{
    const path=join(folder,'calendar.json'),p=plan();
    writeFileSync(path,JSON.stringify(p,null,2)+'\n');
    assert.equal(loadCalendarPlan(path).fingerprint,p.fingerprint);
    p.days[0].count=6;
    writeFileSync(path,JSON.stringify(p,null,2)+'\n');
    assert.throws(()=>loadCalendarPlan(path),/fingerprint/);
  }finally{rmSync(folder,{recursive:true,force:true});}
});
test('fast-import stream creates historical author-dated commits in a local git repository',()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-fast-import-'));
  try{
    const p=planCalendar({from:'2022-01-01',to:'2022-01-10',density:60,seed:18,
      mode:'uniform',intensity:2,now});
    git(['init','--quiet','--initial-branch=main'],{cwd:folder});
    git(['fast-import','--quiet'],{cwd:folder,
      input:fastImportCalendar(p,'Example Developer','example@users.noreply.github.com')});
    assert.equal(Number(git(['rev-list','--count','main'],{cwd:folder})),p.summary.syntheticCommits);
    const file=p.days[0].date;
    const path='practice/'+file.slice(0,4)+'/'+file.slice(5,7)+'/'+file.slice(8)+'-1.md';
    assert.match(git(['show','main:'+path],{cwd:folder}),/synthetic practice activity/i);
    assert.match(git(['log','-1','--format=%aI'],{cwd:folder}),/^2022-/);
  }finally{rmSync(folder,{recursive:true,force:true});}
});
test('calendar application requires private new repository; push occurs once with credential in env only',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'aura-calendar-private-'));
  try{
    const bare=join(folder,'remote.git');
    git(['init','--bare','--quiet',bare]);
    const p=planCalendar({from:'2022-03-01',to:'2022-03-08',density:55,seed:19,
      mode:'uniform',intensity:1,now});
    const urls=[],methods=[];
    const fetch=async(url,params={})=>{
      urls.push(url);methods.push(params.method||'GET');
      if(url.endsWith('/user'))return Response.json({login:'example',created_at:'2019-01-01T00:00:00Z'});
      if(url.endsWith('/repos/example/activity-test'))return new Response('{}',{status:404});
      if(url.endsWith('/user/repos'))return Response.json({full_name:'example/activity-test',private:true},{status:201});
      throw Error('Unexpected URL: '+url);
    };
    let pushes=0;
    const runner=(args,opts)=>{
      if(args[0]==='push'){
        pushes++;
        assert.ok(opts.env.GIT_CONFIG_VALUE_0.includes('AUTHORIZATION: basic '));
        assert.ok(!args.join(' ').includes('test-token'));
        const revised=[...args];revised[2]=bare;
        return git(revised,opts);
      }
      return git(args,opts);
    };
    const result=await applyCalendar(p,{repo:'example/activity-test',confirm:p.fingerprint,
      authorName:'Example Developer',authorEmail:'example@users.noreply.github.com',
      token:'test-token',fetch,gitRunner:runner});
    assert.equal(pushes,1);
    assert.deepEqual(methods,['GET','GET','POST']);
    assert.equal(result.status,'pushed-unverified-graph');
    assert.equal(Number(git(['--git-dir',bare,'rev-list','--count','main'])),p.summary.syntheticCommits);
    assert.ok(urls.every(u=>u.startsWith('https://api.github.com/')));
  }finally{rmSync(folder,{recursive:true,force:true});}
});
test('wrong confirmation and existing repo fail without any creation/push',async()=>{
  const p=plan();
  let calls=0;
  await assert.rejects(applyCalendar(p,{repo:'example/activity-test',confirm:'0'.repeat(64),
    authorName:'Example Developer',authorEmail:'example@users.noreply.github.com',
    token:'token',fetch:()=>{calls++;throw Error('Unexpected');}}),/fingerprint mismatch/);
  assert.equal(calls,0);
  await assert.rejects(applyCalendar(p,{repo:'example/existing',confirm:p.fingerprint,
    authorName:'Example Developer',authorEmail:'example@users.noreply.github.com',
    token:'token',fetch:async(url)=>{
      calls++;
      return Response.json(url.endsWith('/user')?{login:'example',created_at:'2019-01-01'}:
        {full_name:'example/existing',private:true});
    }}),/already exists/);
  assert.equal(calls,2);
});
test('calendar CLI accepts separate plan/apply but rejects unreviewed writes',()=>{
  validateOptions('calendar',parseArgs(['plan','2022','--density','80','--output','calendar.json']));
  validateOptions('calendar',parseArgs(['plan','--from','2020','--to','2023','--existing','history.json']));
  validateOptions('calendar',parseArgs(['apply','--repo','example/private-test',
    '--review','calendar.json','--confirm','f'.repeat(64),
    '--author-name','Example','--author-email','example@users.noreply.github.com']));
  assert.throws(()=>validateOptions('calendar',parseArgs(['apply','--repo','example/private-test'])),/requires/);
  assert.throws(()=>validateOptions('calendar',parseArgs(['plan','2022','--repo','example/private-test'])),/date\/density/);
});

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const DAY=86400000;
const MIN_YEAR=2008;
const MAX_YEARS=20;
const MAX_COMMITS=2500;
const MAX_DAYS=366*MAX_YEARS;
const maxFile=2*1024*1024;
function dateUTC(input,edge) {
  if(typeof input!=='string'||!/^\d{4}(?:-\d\d-\d\d)?$/.test(input))throw Error('--'+edge+' must be YYYY or YYYY-MM-DD.');
  const date=input.length===4?input+(edge==='from'?'-01-01':'-12-31'):input;
  const ms=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==date)throw Error('Invalid calendar date: '+input);
  return ms;
}
function integer(value,label,min,max) {
  const v=typeof value==='string'?Number(value):value;
  if(!Number.isInteger(v)||v<min||v>max)throw Error(label+' must be an integer '+min+'..'+max+'.');
  return v;
}
function unit(seed,key) {
  const hash=createHash('sha256').update(String(seed)+'|'+key).digest();
  return hash.readUInt32BE(0)/4294967296;
}
function historyFile(file) {
  if(!file)return null;
  const stat=statSync(file);
  if(!stat.isFile()||stat.size>maxFile)throw Error('Existing history must be a JSON file under 2 MiB.');
  let doc;
  try{doc=JSON.parse(readFileSync(file,'utf8'));}catch{throw Error('Invalid GitHub contribution history JSON.');}
  if(!Array.isArray(doc.years))throw Error('Expected GH Aura contributions --all --days --json output.');
  const observed=new Map();
  for(const year of doc.years) {
    if(!Array.isArray(year.days))throw Error('Historical year lacks --days observations; unknown days cannot be treated as zero.');
    for(const d of year.days) {
      if(!/^\d{4}-\d\d-\d\d$/.test(d.date)||!Number.isInteger(d.count)||d.count<0||observed.has(d.date))
        throw Error('Invalid or duplicate observed contribution day.');
      observed.set(d.date,d.count);
    }
  }
  return observed;
}
export function calendarDigest(plan) {
  const fields={format:plan.format,settings:plan.settings,days:plan.days};
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}
/**
 * Pure reproducible calendar blueprint, separate from GitHub reality.
 * A synthetic calendar is an estimate, never observed professional work.
 */
export function planCalendar(options={},history=null) {
  const now=options.now||new Date();
  const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const from=dateUTC(options.from||options.year||String(now.getUTCFullYear()),'from');
  const requestedTo=dateUTC(options.to||options.year||String(now.getUTCFullYear()),'to');
  if(from>requestedTo)throw Error('Calendar start must not exceed end.');
  if(new Date(from).getUTCFullYear()<MIN_YEAR||requestedTo>today)throw Error('Dates must be between 2008 and today (UTC).');
  const span=Math.floor((requestedTo-from)/DAY)+1;
  if(span>MAX_DAYS||new Date(requestedTo).getUTCFullYear()-new Date(from).getUTCFullYear()+1>MAX_YEARS)
    throw Error('Calendar blueprint is limited to 20 years per operation.');
  const density=integer(options.density??65,'--density',0,100);
  const growth=integer(options.growth??50,'--growth',0,100);
  const weekends=integer(options.weekends??25,'--weekends',0,100);
  const intensity=integer(options.intensity??2,'--intensity',1,6);
  const seed=integer(options.seed??2026,'--seed',0,2147483647);
  const mode=options.mode||'workweek';
  if(!['workweek','uniform','seasonal'].includes(mode))throw Error('--mode must be workweek, uniform, or seasonal.');
  const role=String(options.role||'general engineering').trim();
  if(!role||role.length>100||/[\u0000-\u001f]/.test(role))throw Error('--role must be 1-100 printable characters.');
  const firstYear=new Date(from).getUTCFullYear(),lastYear=new Date(requestedTo).getUTCFullYear();
  const years=lastYear-firstYear+1;
  const expected=new Map();
  if(history){
    if(!(history instanceof Map))throw Error('Observed history must be a Map of dated daily counts.');
    for(let ms=from;ms<=requestedTo;ms+=DAY){
      const date=new Date(ms).toISOString().slice(0,10);
      if(!history.has(date))throw Error('Existing history is incomplete for '+date+'; cannot infer zero days.');
      const count=history.get(date);
      if(!Number.isInteger(count)||count<0)throw Error('Invalid existing contribution count for '+date);
      expected.set(date,count);
    }
  }
  const candidates=[],perYear={};
  for(let ms=from;ms<=requestedTo;ms+=DAY) {
    const date=new Date(ms).toISOString().slice(0,10),currentYear=Number(date.slice(0,4));
    if(!perYear[currentYear])perYear[currentYear]={dates:0,observedActive:0,selectedDays:0,newCommits:0,targetDensity:null};
    const group=perYear[currentYear];group.dates++;
    const actual=expected.get(date)||0;if(actual)group.observedActive++;
    const progress=years===1?1:(currentYear-firstYear)/(years-1);
    const target=Math.round(density*(1-growth/100+growth/100*progress));
    group.targetDensity=target;
    const weekday=new Date(ms).getUTCDay();
    const weekend=weekday===0||weekday===6;
    // Weekend preference redistributes probability, not a claim about real habits.
    const weekly=mode==='uniform'?1:weekend?weekends/100:1;
    const seasonal=mode==='seasonal'?0.7+0.3*Math.cos((new Date(ms).getUTCMonth()-4)*Math.PI/6):1;
    const weight=Math.max(0,unit(seed,date+'pick')*weekly*seasonal);
    candidates.push({date,year:currentYear,existing:actual,weight,
      count:1+Math.floor(unit(seed,date+'count')*intensity)});
  }
  const days=[];
  for(const [key,group] of Object.entries(perYear)) {
    const year=Number(key),dates=candidates.filter(c=>c.year===year);
    const desired=Math.round(dates.length*group.targetDensity/100);
    const toAdd=Math.max(0,desired-group.observedActive);
    const empty=dates.filter(c=>c.existing===0);
    empty.sort((a,b)=>b.weight-a.weight||a.date.localeCompare(b.date));
    for(const item of empty.slice(0,toAdd)) {
      // Suppress weekend candidates completely when weekends=0 and mode=workweek.
      if(mode==='workweek'&&weekends===0&&new Date(item.date+'T00:00:00Z').getUTCDay()%6===0)continue;
      days.push({date:item.date,count:item.count,kind:'synthetic-practice'});
      group.selectedDays++;group.newCommits+=item.count;
    }
  }
  days.sort((a,b)=>a.date.localeCompare(b.date));
  const commits=days.reduce((n,d)=>n+d.count,0);
  if(commits>MAX_COMMITS)throw Error('The plan exceeds 2500 commits. Narrow the range or lower density/intensity.');
  const settings={from:new Date(from).toISOString().slice(0,10),to:new Date(requestedTo).toISOString().slice(0,10),
    density,growth,weekends,intensity,seed,mode,role,
    existingHistory:history?'supplied-verified-counts':'none-provided'};
  const plan={format:'gh-aura-synthetic-calendar-v1',settings,days,
    summary:{selectedDays:days.length,syntheticCommits:commits,perYear},
    limitations:[
      'Synthetic practice timeline; not a record of historical professional work.',
      'GitHub may not attribute contributions: verified author email, account age, default branch and private contribution visibility matter.',
      'The plan does not modify the contribution calendar until a separate explicitly approved Git push.',
      'Existing-history mode only preserves observed GitHub day counts; it cannot verify private work not visible to the chosen token.',
    ]};
  plan.fingerprint=calendarDigest(plan);
  return plan;
}
export function loadCalendarPlan(path) {
  if(!path)throw Error('Provide --review FILE from calendar plan.');
  const stat=statSync(path);
  if(!stat.isFile()||stat.size>maxFile)throw Error('Calendar review file must be a regular JSON file under 2 MiB.');
  let doc;try{doc=JSON.parse(readFileSync(path,'utf8'));}catch{throw Error('Invalid calendar plan JSON.');}
  if(doc?.format!=='gh-aura-synthetic-calendar-v1'||!Array.isArray(doc.days)||!doc.settings||
      !/^[a-f0-9]{64}$/.test(doc.fingerprint||'')||calendarDigest(doc)!==doc.fingerprint)
    throw Error('Calendar review fingerprint or format mismatch; regenerate the plan.');
  if(doc.days.length>MAX_DAYS)throw Error('Calendar plan has too many dates.');
  let prev='',commits=0;
  for(const item of doc.days){
    if(typeof item.date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(item.date)||item.date<=prev||
       !Number.isInteger(item.count)||item.count<1||item.count>6||item.kind!=='synthetic-practice')
      throw Error('Invalid, duplicate or unordered calendar entries.');
    if(dateUTC(item.date,'from')<dateUTC(doc.settings.from,'from')||
       dateUTC(item.date,'from')>dateUTC(doc.settings.to,'to'))
      throw Error('Entry outside approved calendar range.');
    prev=item.date;commits+=item.count;
  }
  if(commits>MAX_COMMITS||commits!==doc.summary?.syntheticCommits||doc.days.length!==doc.summary?.selectedDays)
    throw Error('Calendar plan summary mismatch.');
  return doc;
}
export function runCalendarPlan(options) {
  const h=historyFile(options.existing);
  const plan=planCalendar(options,h);
  if(options.output)writeFileSync(options.output,JSON.stringify(plan,null,2)+'\n',
    {flag:options.force?'w':'wx',mode:0o600});
  else process.stdout.write(JSON.stringify(plan,null,2)+'\n');
  return plan;
}

import { validateCalendarPlan } from './calendar.mjs';

export function previewCalendar(input,{year,svg=false}={}){
  const plan=validateCalendarPlan(input),first=Number(plan.settings.from.slice(0,4)),last=Number(plan.settings.to.slice(0,4));
  if(year===undefined&&first!==last)throw Error('Choose one --year YYYY to preview a multi-year plan.');
  year=year===undefined?first:Number(year);
  if(!Number.isInteger(year)||year<first||year>last)throw Error('Preview year is outside the reviewed range.');
  const additions=new Map(plan.days.map(d=>[d.date,d.count])),days=[];
  for(let ms=Date.UTC(year,0,1);ms<Date.UTC(year+1,0,1);ms+=86400000){
    const date=new Date(ms).toISOString().slice(0,10),added=additions.get(date)||0;
    const before=plan.settings.initialCounts?.[date]??(Object.hasOwn(plan.settings.expectedCounts||{},date)?plan.settings.expectedCounts[date]-added:null);
    days.push({date,before,added,projected:before===null?null:before+added,inRange:date>=plan.settings.from&&date<=plan.settings.to});
  }
  const result={format:'gh-aura-calendar-preview-v1',fingerprint:plan.fingerprint,year,timezone:'UTC',days,
    summary:{knownBaselineDays:days.filter(d=>d.before!==null).length,unknownBaselineDays:days.filter(d=>d.before===null).length,
      newCommits:days.reduce((n,d)=>n+d.added,0)},
    caveat:'Projected synthetic additions, not observed professional history. Unknown counts are not zero; GitHub colors and attribution may differ.'};
  if(svg)result.svg=calendarSVG(result);
  return result;
}
function calendarSVG(report){
  const offset=new Date(Date.UTC(report.year,0,1)).getUTCDay(),step=13,colors=['#ebedf0','#ace7b0','#64c879','#31964c','#176834'];
  const largest=Math.max(1,...report.days.flatMap(d=>[d.before??0,d.projected??0]));
  const color=n=>n===null?'url(#unknown)':colors[n===0?0:Math.min(4,1+Math.floor(n/largest*3))];
  const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="760" height="340" viewBox="0 0 760 340" role="img" aria-labelledby="title desc">',
    '<title id="title">'+report.year+' calendar plan: before and projected</title>',
    '<desc id="desc">UTC dates; hatched cells have unknown counts. The projection contains labeled synthetic additions and does not predict exact GitHub colors.</desc>',
    '<defs><pattern id="unknown" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#f8f8f8"/><path d="M0 4L4 0" stroke="#c3c8c5" stroke-width="1"/></pattern></defs>',
    '<rect width="760" height="340" fill="#fff"/><g fill="#202820" font-family="sans-serif"><text x="24" y="25" font-size="17">'+report.year+' · Synthetic calendar plan · UTC</text>'];
  for(const [panel,key,label] of [[0,'before','Before: supplied baseline'],[1,'projected','After: projected counts']]){
    const top=65+panel*125;parts.push('<text x="24" y="'+(top-15)+'" font-size="13">'+label+'</text>');
    report.days.forEach((day,index)=>{
      const column=Math.floor((index+offset)/7),row=(index+offset)%7,value=day[key];
      parts.push('<rect x="'+(24+column*step)+'" y="'+(top+row*step)+'" width="10" height="10" rx="1" fill="'+color(value)+'"><title>'+day.date+': '+(value===null?'unknown':value)+'; +'+day.added+' planned</title></rect>');
    });
  }
  parts.push('<text x="24" y="302" font-size="12">+'+report.summary.newCommits+' planned commits · '+report.summary.unknownBaselineDays+' days with unknown baseline</text>',
    '<text x="24" y="323" font-size="11">Illustrative colors. GitHub decides attribution and shades; generated practice is not professional history.</text></g></svg>');
  return parts.join('');
}

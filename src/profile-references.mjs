/** Bounded static reference extraction. Source strings are data, never commands. */
export function extractProfileReferences(markdown){
  if(typeof markdown!=='string'||Buffer.byteLength(markdown)>256*1024)throw Error('README references require Markdown under 256 KiB.');
  let fence=null;
  const uncommented=markdown.replace(/<!--[\s\S]*?(?:-->|$)/g,''),lower=uncommented.toLowerCase(),opening=/<(pre|code|script|style)\b[^>]*>/gi;
  let stripped='',offset=0;
  for(let m;(m=opening.exec(uncommented));){
    stripped+=uncommented.slice(offset,m.index);
    const close=lower.indexOf('</'+m[1].toLowerCase(),opening.lastIndex),end=close<0?-1:lower.indexOf('>',close);
    offset=end<0?uncommented.length:end+1;opening.lastIndex=offset;
    if(offset===uncommented.length)break;
  }
  stripped+=uncommented.slice(offset);
  const visible=stripped
    .split('\n').map(line=>{
      const m=/^\s{0,3}(`{3,}|~{3,})/.exec(line);
      if(fence){if(m&&m[1][0]===fence[0]&&m[1].length>=fence.length)fence=null;return '';}
      if(m){fence=m[1];return '';}
      return line;
    }).join('\n').replace(/`+[^`\n]*`+/g,'');
  const definitions=new Map(),refs=[];
  const add=(kind,url,alt='')=>{if(url&&refs.length<256)refs.push({kind,url:url.replace(/&amp;/g,'&').replace(/\\([()])/g,'$1'),...(kind==='image'?{alt}:{})});};
  const destination=(text,start)=>{
    let i=start;while(/[ \t]/.test(text[i]||'')&&i<text.length)i++;
    if(text[i]==='<'){const end=text.indexOf('>',i+1);return end<0?null:{url:text.slice(i+1,end),end:end+1};}
    let depth=0,url='';
    for(;i<text.length;i++){
      const c=text[i];
      if(c==='\\'&&i+1<text.length){url+=text.slice(i,i+2);i++;continue;}
      if(c==='('){if(++depth>16)return null;}
      if(c===')'){if(!depth)break;depth--;}
      if(/\s/.test(c)&&!depth)break;
      url+=c;
    }
    return url?{url,end:i}:null;
  };
  const lines=visible.split('\n');
  for(const line of lines){const m=/^\s{0,3}\[([^\]]+)\]:\s*/.exec(line);if(m){const d=destination(line,m[0].length);if(d)definitions.set(m[1].trim().toLowerCase(),d.url);}}
  const body=lines.filter(l=>!/^\s{0,3}\[[^\]]+\]:/.test(l)).join('\n');
  const ranges=[];
  for(let start=0;start<body.length;start++){
    if(body[start]!=='['||body[start-1]==='\\')continue;
    let end=start+1,depth=1;
    for(;end<body.length&&end-start<4096;end++){
      if(body[end]==='\\'){end++;continue;}
      if(body[end]==='['&&++depth>16)break;
      if(body[end]===']'&&--depth===0)break;
    }
    if(depth||body[end]!==']')continue;
    const label=body.slice(start+1,end);let url,last=end+1;
    if(body[last]==='('){const d=destination(body,last+1);if(!d)continue;url=d.url;last=d.end+1;}
    else if(body[last]==='['){const close=body.indexOf(']',last+1);if(close<0)continue;url=definitions.get((body.slice(last+1,close)||label).trim().toLowerCase());last=close+1;}
    else url=definitions.get(label.trim().toLowerCase());
    add(body[start-1]==='!'?'image':'link',url,label);if(url)ranges.push([start,last]);
  }
  for(const m of body.matchAll(/<(a|img|source)\b([^>]*)>/gi)){
    const attrs=Object.fromEntries([...m[2].matchAll(/\b(href|src|alt|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(x=>[x[1].toLowerCase(),x[2]??x[3]]));
    if(m[1].toLowerCase()==='a')add('link',attrs.href);else{
      add('image',attrs.src,attrs.alt||'');
      for(const candidate of (attrs.srcset||'').split(','))add('image',candidate.trim().split(/\s/)[0],attrs.alt||'');
    }
  }
  for(const m of body.matchAll(/<(https:\/\/[^<>\s]+)>/g))add('link',m[1]);
  const plainBody=body.replace(/<[^>]*>/g,m=>' '.repeat(m.length));
  for(const m of plainBody.matchAll(/https:\/\/[^\s<>"']+/g)){
    if(ranges.some(([start,end])=>m.index>=start&&m.index<end))continue;
    let url=m[0].replace(/[.,;!?]+$/,'');
    while(url.endsWith(')')&&(url.match(/\)/g)||[]).length>(url.match(/\(/g)||[]).length)url=url.slice(0,-1);
    add('link',url);
  }
  const unique=new Map();
  for(const ref of refs){const key=ref.kind+'|'+ref.url;if(!unique.has(key))unique.set(key,ref);}
  return [...unique.values()];
}

// Developer-only PUBLIC GitHub profile smoke rendering in 4 modes.
// No GH token, no screenshots persisted, no editorial rankings.
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const MODES=Object.freeze([
  {id:'desktopLight',width:1200,height:920,mobile:false,dark:false},
  {id:'desktopDark',width:1200,height:920,mobile:false,dark:true},
  {id:'mobileLight',width:390,height:844,mobile:true,dark:false},
  {id:'mobileDark',width:390,height:844,mobile:true,dark:true},
]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const isLogin=x=>typeof x==='string'&&/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(x);
const safeError=e=>String(e?.message||e||'unknown').slice(0,100).replace(/https?:\/\/\S+/g,'[URL]');
class CDP{
  constructor(ws){this.ws=ws;this.seq=0;this.pending=new Map();}
  static async connect(uri){
    const ws=new WebSocket(uri),c=new CDP(ws);
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(Error('DevTools connect timeout')),8000);
      ws.addEventListener('open',()=>{clearTimeout(t);resolve();},{once:true});
      ws.addEventListener('error',()=>{clearTimeout(t);reject(Error('DevTools connect failed'));},{once:true});
    });
    ws.addEventListener('message',e=>{
      let v;try{v=JSON.parse(e.data);}catch{return;}
      const x=c.pending.get(v.id);if(!x)return;
      clearTimeout(x.t);c.pending.delete(v.id);
      if(v.error)x.reject(Error('CDP '+v.error.code+' '+String(v.error.message).slice(0,100)));
      else x.resolve(v.result||{});
    });
    return c;
  }
  send(method,params={},sessionId,ms=14000){
    if(this.ws.readyState!==1)throw Error('DevTools disconnected');
    const id=++this.seq;
    return new Promise((resolve,reject)=>{
      const t=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},ms);
      this.pending.set(id,{resolve,reject,t});
      this.ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
    });
  }
  close(){
    for(const x of this.pending.values()){clearTimeout(x.t);x.reject(Error('CDP close'));}
    this.pending.clear();try{this.ws.close();}catch{}
  }
}
async function chrome(){
  const temp=mkdtempSync(join(tmpdir(),'gh-aura-browser-'));
  const proc=spawn(process.env.GH_AURA_CHROME||'chromium',[
    '--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
    '--no-first-run','--no-default-browser-check','--disable-extensions',
    '--disable-background-networking','--disable-sync','--disable-notifications',
    '--remote-debugging-port=0','--user-data-dir='+temp,'about:blank',
  ],{stdio:['ignore','ignore','pipe']});
  try{
    const uri=await new Promise((resolve,reject)=>{
      let buf='',ended=false;const timer=setTimeout(()=>{if(!ended){ended=true;reject(Error('No Chrome debugger; stderr: '+buf.slice(-360).replace(/\\s+/g,' ')))}} ,45000);
      proc.on('error',e=>{if(!ended){ended=true;clearTimeout(timer);reject(e);}});
      proc.on('exit',()=>{if(!ended){ended=true;clearTimeout(timer);reject(Error('Chrome exited'));}});
      proc.stderr.on('data',chunk=>{
        if(ended)return;
        buf=(buf+chunk.toString()).slice(-5000);
        const m=buf.match(/DevTools listening on (ws:\/\/[^\s/]+\/devtools\/browser\/[^\s]+)/);
        if(m){ended=true;clearTimeout(timer);resolve(m[1]);}
      });
    });
    return {temp,proc,cdp:await CDP.connect(uri)};
  }catch(e){proc.kill('SIGKILL');rmSync(temp,{recursive:true,force:true});throw e;}
}
const expression="(()=>{\nconst root=document.documentElement,body=document.body;\nif(!root||!body)return null;\nconst imgs=[...document.querySelectorAll('img')].filter(x=>{\nconst r=x.getBoundingClientRect();\nreturn r.width>2&&r.height>2&&r.bottom>0&&r.top<innerWidth&&r.left<innerWidth&&r.right>0&&r.top<innerHeight;});\nconst docWidth=Math.max(root.scrollWidth,body.scrollWidth);\nreturn {\n title:String(document.title||'').slice(0,130),\n viewportWidth:innerWidth,docWidth,overflowX:docWidth>innerWidth+5,\n bodyBackground:String(getComputedStyle(body).backgroundColor||'').slice(0,80),\n colorScheme:String(getComputedStyle(root).colorScheme||'').slice(0,50),\n avatarOnPage:!!document.querySelector('img.avatar-user,img.avatar'),\n readmeVisible:!!document.querySelector('article.markdown-body'),\n pinsOnPage:!!document.querySelector('ol.pinned-item-list,div.pinned-item-list-item'),\n visibleImages:imgs.length,brokenVisibleImages:imgs.filter(x=>x.complete&&x.naturalWidth===0).length,\n achievementsHeading:[...document.querySelectorAll('a[href*=\"tab=achievements\"]')].some(x=>x.textContent.trim()==='Achievements'),\n contributionsFragment:!!document.querySelector('include-fragment[src*=\"contributions\"]')\n}})()";
async function inspect(cdp,sid){
  const v=await cdp.send('Runtime.evaluate',{expression,returnByValue:true},sid);
  if(v.exceptionDetails)throw Error('DOM inspect failed');
  return v.result?.value||null;
}
async function page(cdp){
  const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
  await cdp.send('Page.enable',{},sessionId);
  await cdp.send('Runtime.enable',{},sessionId);
  return {targetId,sessionId};
}
async function render(cdp,p,mode){
  const id=p.sessionId;
  await cdp.send('Emulation.setDeviceMetricsOverride',{
    width:mode.width,height:mode.height,screenWidth:mode.width,screenHeight:mode.height,
    deviceScaleFactor:1,mobile:mode.mobile},id);
  await cdp.send('Emulation.setEmulatedMedia',{
    features:[{name:'prefers-color-scheme',value:mode.dark?'dark':'light'}]},id);
  await wait(170);
  const metrics=await inspect(cdp,id);
  if(!metrics||metrics.viewportWidth<300)throw Error('Invalid viewport');
  const {data}=await cdp.send('Page.captureScreenshot',{
    format:'jpeg',quality:55,captureBeyondViewport:false,fromSurface:true},id,15000);
  if(typeof data!=='string'||data.length<1200)throw Error('Missing screenshot');
  const bytes=Buffer.from(data,'base64');
  if(bytes.length<1024||bytes.length>5*1024*1024)throw Error('Screenshot oversized');
  return {captured:true,width:mode.width,height:mode.height,
    screenshotBytes:bytes.length,screenshotSha256:createHash('sha256').update(bytes).digest('hex'),
    ...metrics};
}
export async function runVisualSmoke(logins,{throttleMs=350}={}){
  if(!Array.isArray(logins)||logins.length<1||logins.length>50||logins.some(x=>!isLogin(x)))
    throw Error('Use 1-50 real public usernames');
  const browser=await chrome(),profiles=[];
  try{
    for(const login of logins){
      const row={login,profileUrl:'https://github.com/'+login,checkedAt:new Date().toISOString(),
        status:'not-rendered',modes:{},editoriallyReviewed:false,categoryApproved:false};
      let p;
      try{
        p=await page(browser.cdp);
        await browser.cdp.send('Page.navigate',{url:'https://github.com/'+encodeURIComponent(login)},p.sessionId);
        let cur;
        for(let t=0;t<22;t++){
          await wait(280);
          try{cur=await inspect(browser.cdp,p.sessionId);}catch{}
          if(cur?.title?.includes('GitHub')&&cur.avatarOnPage)break;
        }
        if(!cur?.title?.includes('GitHub')||!cur.avatarOnPage){
          row.status='unavailable';row.reason='No GitHub user profile DOM';
        }else{
          for(const mode of MODES){
            try{row.modes[mode.id]=await render(browser.cdp,p,mode);}
            catch(e){row.modes[mode.id]={captured:false,error:safeError(e)};}
          }
          const n=MODES.filter(x=>row.modes[x.id]?.captured).length;
          row.status=n===4?'all-four-modes-captured':n?'partially-captured':'capture-failed';
        }
      }catch(e){row.status='failed';row.reason=safeError(e);}
      finally{if(p?.targetId)try{await browser.cdp.send('Target.closeTarget',{targetId:p.targetId},undefined,3500);}catch{}}
      profiles.push(row);
      await wait(throttleMs);
    }
  }finally{
    browser.cdp.close();browser.proc.kill('SIGKILL');
    // Chrome may still be writing its ephemeral profile while the OS terminates it.
    // Cleanup must never discard a successfully completed public research batch.
    try{rmSync(browser.temp,{recursive:true,force:true,maxRetries:6,retryDelay:150});}catch{}
  }
  return {schema:'gh-aura-four-view-render-smoke-v1',
    observedAt:new Date().toISOString(),source:'PUBLIC GitHub pages in Chromium, no credentials',
    modes:MODES,checked:profiles.length,
    complete4:profiles.filter(x=>x.status==='all-four-modes-captured').length,
    partial:profiles.filter(x=>x.status==='partially-captured').length,
    failed:profiles.filter(x=>!['all-four-modes-captured','partially-captured'].includes(x.status)).length,
    editorialReviews:0,categoryWinners:0,profiles,
    disclaimer:'Screenshot generation, viewport geometry and asset loads are automated checks only. They do not certify contrast, image rights, design quality, authorship, privacy, GitHub badge eligibility, hiring outcomes or best-in-category selection.'};
}
function args(argv){
  const o={input:null,output:null,start:null,limit:50};
  for(let i=0;i<argv.length;i+=2){
    if(!(argv[i] in {'--input':1,'--output':1,'--start':1,'--limit':1})||argv[i+1]===undefined)
      throw Error('Invalid CLI arguments');
    o[{'--input':'input','--output':'output','--start':'start','--limit':'limit'}[argv[i]]]=argv[i+1];
  }
  o.start=Number(o.start);o.limit=Number(o.limit);
  if(!o.input?.endsWith('.json')||!o.output?.endsWith('.json')||
    !Number.isInteger(o.start)||o.start<0||o.start>550||
    !Number.isInteger(o.limit)||o.limit<1||o.limit>50)
    throw Error('Use --input batch.json --start N --limit 1..50 --output new.json');
  return o;
}
async function main(argv){
  const o=args(argv);
  if(statSync(o.input).size>1024*1024)throw Error('Batch exceeds 1MiB');
  const batch=JSON.parse(readFileSync(o.input,'utf8'));
  if(batch.schema!=='gh-aura-holistic-api-observation-batch-v1'||
    batch.start!==o.start||batch.profiles?.length<o.limit)throw Error('Invalid public research batch');
  const study=await runVisualSmoke(batch.profiles.slice(0,o.limit).map(x=>x.login));
  study.start=o.start;
  writeFileSync(resolve(o.output),JSON.stringify(study)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({start:o.start,checked:study.checked,complete4:study.complete4,
    partial:study.partial,failed:study.failed,editorialReviews:0})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e=>{process.stderr.write('GH Aura four-view smoke: '+safeError(e)+'\n');process.exitCode=1;});

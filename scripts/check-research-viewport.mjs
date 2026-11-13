// Optional real-browser regression; local fixture only, no GitHub or screenshots.
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname,join,resolve } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { RESEARCH_CHECKPOINT,correctVisualCollector,collectorExpression } from './research-corrections.mjs';

const browser=process.env.GH_AURA_CHROME;
if(!browser)throw Error('Set GH_AURA_CHROME to a locally installed Chromium/Chrome/Edge executable. No browser is downloaded.');
const root=fileURLToPath(new URL('../',import.meta.url));
const archived=spawnSync('git',['show',RESEARCH_CHECKPOINT+':scripts/visual-profile-smoke.mjs'],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:200000});
if(archived.status!==0)throw Error('Research checkpoint is missing; follow research/README.md to recover it.');
const fixed=correctVisualCollector(archived.stdout),directory=mkdtempSync(join(tmpdir(),'gh-aura-viewport-fixture-'));
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
try{
  const fixture=join(directory,'fixture.html');
  const frame=(id,source)=>{
    const document='<!doctype html><html><head><title>GitHub fixture</title></head><body><img class="avatar" style="position:absolute;left:10px;top:100px;width:20px;height:20px" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><img style="position:absolute;left:10px;top:600px;width:20px;height:20px" src="data:image/png;base64,broken"><script>addEventListener("load",()=>{parent.observations.'+id+'='+collectorExpression(source)+';if(parent.observations.original&&parent.observations.corrected)parent.document.getElementById("result").textContent=JSON.stringify(parent.observations);});</script></body></html>';
    return '<iframe style="width:390px;height:844px;border:0" srcdoc="'+escape(document)+'"></iframe>';
  };
  writeFileSync(fixture,'<!doctype html><html><body><pre id="result"></pre><script>window.observations={};</script>'+frame('original',archived.stdout)+frame('corrected',fixed.source)+'</body></html>');
  const result=spawnSync(browser,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions',
    '--disable-background-networking','--disable-sync','--user-data-dir='+join(directory,'browser'),'--dump-dom','--virtual-time-budget=2000',pathToFileURL(fixture).href],
    {encoding:'utf8',windowsHide:true,timeout:45000,maxBuffer:1024*1024});
  if(result.status!==0||result.error)throw Error('Local browser fixture failed: '+(result.error?.message||'exit '+result.status));
  const encoded=/<pre id="result">([^<]+)<\/pre>/.exec(result.stdout)?.[1];
  if(!encoded)throw Error('Browser fixture did not return its observations.');
  const observations=JSON.parse(encoded.replaceAll('&quot;','"').replaceAll('&amp;','&'));
  assert.equal(observations.original.viewportWidth,390);assert.equal(observations.corrected.viewportWidth,390);
  assert.equal(observations.original.visibleImages,1);assert.equal(observations.original.brokenVisibleImages,0);
  assert.equal(observations.corrected.visibleImages,2);assert.equal(observations.corrected.brokenVisibleImages,1);
  process.stdout.write(JSON.stringify({format:'gh-aura-viewport-regression-v1',viewport:{width:390,height:844},browser:'Local Chromium engine, fresh temporary profile',
    original:{visibleImages:1,brokenVisibleImages:0},corrected:{visibleImages:2,brokenVisibleImages:1},correction:fixed.correction,
    githubRequests:0,screenshotsStored:0},null,2)+'\n');
}finally{
  if(dirname(resolve(directory))!==resolve(tmpdir()))throw Error('Unexpected browser fixture scratch location.');
  rmSync(directory,{recursive:true,force:true,maxRetries:8,retryDelay:150});
}

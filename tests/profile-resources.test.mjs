import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAddress,probePublicResource,publicURL } from '../src/public-https.mjs';
import { checkProfileResources } from '../src/profile-resources.mjs';

const resolve=async()=>[{address:'93.184.216.34',family:4}];
test('private, loopback, reserved, mapped and encoded network destinations never reach the request transport',async()=>{
  for(const address of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','2001:db8::1','2001:0000:1::1','2002:7f00::1'])assert.equal(publicAddress(address),false,address);
  assert.equal(publicAddress('2606:4700:4700::1111'),true);
  for(const url of ['https://127.1/','https://2130706433/','https://[::1]/','http://example.org/','https://example.org:8443/','https://name:password@example.org/'])assert.throws(()=>publicURL(url),/public HTTPS/);
  let sent=0;await assert.rejects(probePublicResource('https://public.example.org/',{resolve:async()=>[{address:'10.0.0.1',family:4}],request:async()=>{sent++;}}),/non-public/);assert.equal(sent,0);
});
test('each redirect is revalidated and only the resolved public address is passed to an anonymous transport',async()=>{
  const calls=[];
  await assert.rejects(probePublicResource('https://public.example.org/',{resolve,request:async(url,options)=>{
    calls.push({url:url.href,options});assert.equal(options.address,'93.184.216.34');assert.equal(options.token,undefined);assert.equal(options.headers,undefined);
    return {status:302,headers:{location:'https://169.254.169.254/latest'}};
  }}),/public HTTPS/);assert.equal(calls.length,1);
});
test('HEAD fallback, unavailable images and planned relative assets retain metadata only',async()=>{
  const methods=[];
  const report=await checkProfileResources('![Hero](assets/hero.svg)\n![Broken](https://public.example.org/broken.png)\n[Docs](https://public.example.org/docs)',{
    baseUrl:'https://raw.githubusercontent.com/example/example/main/README.md',assets:[{path:'assets/hero.svg',content:'<svg/>',encoding:'utf-8',rights:'user-owned'}],resolve,
    request:async(url,options)=>{methods.push(options.method);if(url.pathname==='/broken.png')return {status:404,headers:{}};return {status:options.method==='HEAD'?405:200,headers:{'content-type':'text/html'}};}
  });
  assert.equal(report.networkRequests,3);assert.equal(report.results.find(r=>r.url.endsWith('hero.svg')).state,'provided-in-plan');
  assert.equal(report.results.find(r=>r.url.endsWith('broken.png')).state,'unavailable');assert.deepEqual(methods,['HEAD','HEAD','GET']);
  assert.equal(report.state,'needs-review');assert.ok(report.results.every(r=>!('body' in r)));
});
test('relative references without repository context stay unresolved and network inspection is bounded',async()=>{
  let sent=0;
  const report=await checkProfileResources('![Relative](assets/missing.svg)\n'+Array.from({length:40},(_,i)=>'[Link](https://public.example.org/'+i+')').join('\n'),{
    limit:3,resolve,request:async()=>{sent++;return {status:200,headers:{}};}
  });
  assert.equal(report.truncated,true);assert.equal(report.results[0].state,'unresolved-relative');assert.equal(sent,2);
});
test('an image endpoint returning HTML is not reported as an image that loaded correctly',async()=>{
  const report=await checkProfileResources('![Chart](https://public.example.org/chart.svg)',{resolve,request:async()=>({status:200,headers:{'content-type':'text/html'}})});
  assert.equal(report.results[0].state,'unexpected-image-type');assert.equal(report.state,'needs-review');
});
test('DNS completing after a deadline cannot start a delayed outbound request',async()=>{
  let release,sent=0;const pending=new Promise(resolve=>{release=resolve;});
  await assert.rejects(probePublicResource('https://public.example.org/',{timeout:30,resolve:()=>pending,request:async()=>{sent++;return {status:200,headers:{}};}}),/timed out/);
  release([{address:'93.184.216.34',family:4}]);await new Promise(resolve=>setImmediate(resolve));assert.equal(sent,0);
});

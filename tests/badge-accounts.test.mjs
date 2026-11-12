import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectBadgeAccounts } from '../src/badge-accounts.mjs';

const repo='example/gh-aura-workspace';
const base='/repos/'+repo;
const marker='# GH Aura Private\nGH-AURA-PRIVATE-WORKSPACE-V1\n';
const response=(data,status=200)=>Response.json(data,{status});
function api(options={}){
  const requests=[];
  const fetch=async(url,settings={})=>{
    const path=url.replace('https://api.github.com','');
    const method=settings.method||'GET';
    const token=settings.headers?.Authorization?.replace('Bearer ','');
    requests.push({path,method,token});
    const primary=token==='principal-test-secret';
    if(!primary&&token!=='secondary-test-secret')
      throw Error('unexpected credential');
    const name=primary?'example':options.sameAccount?'example':'partner';
    if(path==='/user')return response({login:name});
    if(path===base)return !primary&&options.noAccess?response({},404):response({
      full_name:repo,private:options.publicRepo?false:true,
      fork:false,archived:false,default_branch:'main'
    });
    if(path===base+'/contents/README.md?ref=main'){
      const body=!primary&&options.unmarked?'# unrelated repo':marker;
      return response({encoding:'base64',type:'file',size:Buffer.byteLength(body),
        content:Buffer.from(body).toString('base64')});
    }
    throw Error('Unexpected API GET '+path);
  };
  return {fetch,requests};
}
test('two distinct authorized tokens read only the exact same private marked workspace',async()=>{
  const a=api();
  const report=await inspectBadgeAccounts({repo,
    token:'principal-test-secret',collaboratorToken:'secondary-test-secret',
    fetch:a.fetch});
  assert.equal(report.primary.login,'example');
  assert.equal(report.collaborator.login,'partner');
  assert.equal(report.private,true);
  assert.equal(report.writesPerformed,0);
  assert.match(report.status,/awards-unverified/);
  assert.match(report.note,/does not verify write permissions/);
  assert.equal(a.requests.length,6);
  assert.ok(a.requests.every(x=>x.method==='GET'));
  assert.equal(a.requests.filter(x=>x.token==='principal-test-secret').length,3);
  assert.equal(a.requests.filter(x=>x.token==='secondary-test-secret').length,3);
  assert.ok(!JSON.stringify(report).includes('test-secret'));
});
test('two accounts are required, not duplicate credentials or the same GitHub identity',async()=>{
  const a=api({sameAccount:true});
  for(const opts of [
    {token:'principal-test-secret',collaboratorToken:''},
    {token:'principal-test-secret',collaboratorToken:'principal-test-secret'}
  ])await assert.rejects(inspectBadgeAccounts({repo,fetch:a.fetch,...opts}),/GH_AURA_COLLAB_TOKEN|different/);
  await assert.rejects(inspectBadgeAccounts({repo,
    token:'principal-test-secret',collaboratorToken:'secondary-test-secret',fetch:a.fetch}),/same account/);
  assert.ok(a.requests.every(x=>x.method==='GET'));
});
test('secondary missing permissions and public/unmarked workspaces fail closed before any writes',async()=>{
  for(const options of [{noAccess:true},{publicRepo:true},{unmarked:true}]){
    const a=api(options);
    await assert.rejects(inspectBadgeAccounts({repo,
      token:'principal-test-secret',collaboratorToken:'secondary-test-secret',
      fetch:a.fetch}),/cannot read|non-private|marked GH Aura README/);
    assert.ok(a.requests.every(x=>x.method==='GET'));
  }
});
test('wrong owner does not access private repositories with secondary credentials',async()=>{
  const a=api();
  await assert.rejects(inspectBadgeAccounts({repo:'other/private',
    token:'principal-test-secret',collaboratorToken:'secondary-test-secret',
    fetch:a.fetch}),/must own/);
  assert.ok(a.requests.every(x=>x.path==='/user'));
});

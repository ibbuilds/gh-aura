import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { handleMcpMessage } from '../src/mcp-server.mjs';

const CLI=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const MODERN={ 'io.modelcontextprotocol/protocolVersion':'2026-07-28',
  'io.modelcontextprotocol/clientCapabilities':{},
  'io.modelcontextprotocol/clientInfo':{name:'gh-aura-test',version:'1'}};
const req=(id,method,params={})=>({jsonrpc:'2.0',id,method,
  params:{...params,_meta:MODERN}});
const legacy=(id,method,params={})=>({jsonrpc:'2.0',id,method,params});

test('MCP modern stateless discovery, resources and prompts follow the 2026 protocol',async()=>{
  const discover=await handleMcpMessage(req(1,'server/discover'));
  assert.equal(discover.id,1);
  assert.equal(discover.result.resultType,'complete');
  assert.deepEqual(discover.result.supportedVersions,['2026-07-28']);
  assert.ok(discover.result.capabilities.tools);
  assert.equal(discover.result._meta['io.modelcontextprotocol/serverInfo'].name,'gh-aura');
  const list=await handleMcpMessage(req(2,'tools/list'));
  assert.ok(list.result.tools.some(x=>x.name==='gh_aura_profile_validate'));
  assert.equal(list.result.resultType,'complete');
  assert.ok(list.result.tools.every(x=>x.annotations.readOnlyHint));
  const resourceList=await handleMcpMessage(req(3,'resources/list'));
  assert.equal(resourceList.result.resources.length,5);
  const resource=await handleMcpMessage(req(4,'resources/read',{
    uri:'gh-aura://sources/catalog'}));
  assert.match(resource.result.contents[0].text,/github-profile/);
  const techniques=await handleMcpMessage(req(17,'resources/read',{
    uri:'gh-aura://techniques/catalog'}));
  assert.match(techniques.result.contents[0].text,/code-portrait/);
  const biography=await handleMcpMessage(req(18,'resources/read',{
    uri:'gh-aura://guide/biography'}));
  assert.match(biography.result.contents[0].text,/original/);
  assert.equal(biography.result.contents[0].mimeType,'text/markdown');
  const promptList=await handleMcpMessage(req(5,'prompts/list'));
  assert.equal(promptList.result.prompts.length,4);
  const prompt=await handleMcpMessage(req(6,'prompts/get',{
    name:'create_professional_profile',arguments:{role:'backend',direction:'technical'}}));
  assert.match(prompt.result.messages[0].content.text,/backend/);
  assert.doesNotMatch(JSON.stringify(prompt),/gh-aura apply --approve [a-f\d]{64}/);
});
test('MCP tool calls are bounded and never expose a publish or shell command',async()=>{
  const data=await handleMcpMessage(req(7,'tools/call',{
    name:'gh_aura_profile_plan',arguments:{direction:'minimal',goal:'backend'}}));
  assert.equal(data.result.isError,false);
  const spec=JSON.parse(data.result.content[0].text);
  assert.equal(spec.direction,'minimal');
  const validation=await handleMcpMessage(req(8,'tools/call',{
    name:'gh_aura_profile_validate',arguments:{markdown:'# Example\n\nSoftware engineer.\n',spec}}));
  assert.equal(validation.result.isError,false);
  const result=JSON.parse(validation.result.content[0].text);
  assert.equal(result.format,'gh-aura-draft-validation-v1');
  const attempted=await handleMcpMessage(req(9,'tools/call',{
    name:'gh_aura_apply',arguments:{confirm:'0'.repeat(64)}}));
  assert.equal(attempted.error.code,-32602);
  assert.equal((await handleMcpMessage(req(10,'resources/read',{uri:'file:///etc/passwd'}))).error.code,-32602);
  const source=await handleMcpMessage(req(11,'tools/call',{name:'gh_aura_sources_search',
    arguments:{query:'markdown',direction:'barebones'}}));
  assert.ok(JSON.parse(source.result.content[0].text).sources.length>0);
});
test('MCP validates protocol versions and legacy handshake without confusing result shapes',async()=>{
  const unsupported=await handleMcpMessage({
    jsonrpc:'2.0',id:12,method:'tools/list',params:{_meta:{
      'io.modelcontextprotocol/protocolVersion':'1999-12-31'}}});
  assert.equal(unsupported.error.code,-32022);
  const missingCapabilities=await handleMcpMessage({
    jsonrpc:'2.0',id:13,method:'tools/list',params:{_meta:{
      'io.modelcontextprotocol/protocolVersion':'2026-07-28'}}});
  assert.equal(missingCapabilities.error.code,-32602);
  const init=await handleMcpMessage(legacy(14,'initialize',{
    protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}));
  assert.equal(init.result.protocolVersion,'2025-11-25');
  const list=await handleMcpMessage(legacy(15,'tools/list'));
  assert.ok(list.result.tools.length>=12);
  assert.equal(Object.hasOwn(list.result,'resultType'),false);
  assert.equal(await handleMcpMessage({jsonrpc:'2.0',
    method:'notifications/initialized',params:{}}),null);
});
test('stdio process emits only newline-delimited valid JSON-RPC and survives mixed requests',()=>{
  const inputs=[
    req(1,'server/discover'),
    req(2,'tools/list'),
    req(3,'tools/call',{name:'gh_aura_sources_get',arguments:{id:'github-profile'}}),
    legacy(4,'initialize',{protocolVersion:'2025-11-25',capabilities:{},
      clientInfo:{name:'client',version:'1'}}),
    legacy(5,'resources/list'),
    req(6,'tools/call',{name:'gh_aura_profile_diff',
      arguments:{before:'# Old',after:'# New'}}),
  ];
  const proc=spawnSync(process.execPath,[CLI,'mcp'],{
    input:inputs.map(v=>JSON.stringify(v)).join('\n')+'\n',
    encoding:'utf8',timeout:15000,maxBuffer:512*1024,
    env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
  });
  assert.equal(proc.status,0,proc.stderr);
  const messages=proc.stdout.trim().split('\n').map(x=>JSON.parse(x));
  assert.deepEqual(messages.map(x=>x.id),[1,2,3,4,5,6]);
  assert.equal(messages[0].result.supportedVersions[0],'2026-07-28');
  assert.equal(messages[3].result.protocolVersion,'2025-11-25');
  assert.ok(messages[5].result.content[0].text.includes('--- existing profile'));
  assert.doesNotMatch(proc.stdout,/GH_TOKEN|SECRET_TOKEN|--approve/);
});

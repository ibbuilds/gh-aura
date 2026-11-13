import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,rmSync,readFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { makeProfileSpec,validateProfileDraft } from '../src/agent-profile.mjs';
import { makeWholeProfileSpec } from '../src/profile-plan.mjs';
import { renderProfile } from '../src/render.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { nativeProfileDraft } from '../src/profile-context.mjs';
import { extractProfileReferences } from '../src/profile-references.mjs';
import { configForTest,snapshotForTest } from './fixtures.mjs';

test('native rendering and AI context share selected order, disabled sections, language and source opt-in',()=>{
  const config=configForTest(),snapshot=snapshotForTest(),original=structuredClone(config);
  const composition=makeProfileSpec({direction:'expressive',language:'es',featured:['example/quiet-scripting','example/backend-toolkit'],maxProjects:2,
    sections:{stats:false,technologies:true},links:[{label:'Contacto',url:'https://example.org/contact'}]});
  const spec=makeWholeProfileSpec({composition});
  const markdown=renderProfile(snapshot,config,undefined,spec),brief=editorialBrief(snapshot,config,{profileSpec:spec});
  assert.ok(markdown.indexOf('quiet-scripting')<markdown.indexOf('backend-toolkit'));assert.match(markdown,/Proyectos destacados/);
  assert.doesNotMatch(markdown,/shields\.io|Resumen de repositorios p[uú]blicos/);assert.match(markdown,/example\.org\/contact/);
  assert.doesNotMatch(markdown,/https:\/\/example\.dev/);
  assert.deepEqual(brief.preferences.featured,composition.featured);assert.equal(brief.editorial.language,'es');assert.deepEqual(config,original);
  assert.ok(!validateProfileDraft(markdown,spec,{username:'example'}).findings.some(x=>x.severity==='error'));
});
test('selected evidence cannot be satisfied by code, comments, inline code or a differently owned short-name project',()=>{
  const spec=makeProfileSpec({featured:['tools'],links:[{label:'Contact',url:'https://example.org/contact'}]});
  const draft='# Example\n\n<!-- https://github.com/example/tools -->\n`https://example.org/contact`\n\n```md\n[Tools](https://github.com/example/tools)\n```\n\n[Other](https://github.com/other/tools)';
  const report=validateProfileDraft(draft,spec,{username:'example'});
  assert.ok(report.findings.some(x=>x.id==='selected-project-missing'));assert.ok(report.findings.some(x=>x.id==='selected-link-missing'));
  const unclosed=validateProfileDraft('# Example\n\n```\nhttps://github.com/example/tools\nhttps://example.org/contact',spec,{username:'example'});
  assert.ok(unclosed.findings.some(x=>x.id==='selected-project-missing'));
  assert.throws(()=>validateProfileDraft('# Example',{format:'unsupported-whole-version',composition:spec}),/Unsupported whole-profile/);
});
test('reference extraction handles linked badges, reference links, balanced URLs and responsive HTML images',()=>{
  const refs=extractProfileReferences('[![Tests](https://img.example.org/a.svg)](https://github.com/example/tools)\n[Contact][contact]\n[contact]: <https://example.org/contact>\n[Paper](https://example.org/a_(b))\n<picture><source srcset="https://img.example.org/light.png 1x, https://img.example.org/dark.png 2x"><img src="assets/hero.svg" alt="Owned diagram"></picture>');
  assert.ok(refs.some(r=>r.kind==='link'&&r.url==='https://github.com/example/tools'));
  assert.ok(refs.some(r=>r.kind==='image'&&r.url==='https://img.example.org/a.svg'));
  assert.ok(refs.some(r=>r.url==='https://example.org/contact'));assert.ok(refs.some(r=>r.url==='https://example.org/a_(b)'));
  assert.ok(refs.some(r=>r.url==='https://img.example.org/dark.png'));assert.ok(refs.every(r=>!r.url.endsWith('contact>')));
});
test('native draft reads explicit external projects without writing or loading an unrelated profile README',async()=>{
  const paths=[],external={name:'work',full_name:'organization/work',private:false,description:'A queue library',language:'Go',size:10};
  const fetch=async(url,init={})=>{
    assert.equal(init.method||'GET','GET');const path=new URL(url).pathname;paths.push(path);
    if(path==='/users/example')return Response.json({login:'example',type:'User',public_repos:0});
    if(path==='/users/example/repos')return Response.json([]);
    if(path==='/repos/organization/work')return Response.json(external);
    throw Error('Unexpected draft endpoint '+path);
  };
  const result=await nativeProfileDraft('example',{composition:makeProfileSpec({featured:['organization/work'],maxProjects:1})},{fetch,token:''});
  assert.match(result.markdown,/organization\/work/);assert.equal(result.usage.networkRequests,3);assert.ok(!paths.some(p=>p.startsWith('/repos/example/')));
  const before=paths.length;
  const omitted=await nativeProfileDraft('example',{composition:makeProfileSpec({featured:['organization/not-needed'],maxProjects:0})},{fetch,token:''});
  assert.doesNotMatch(omitted.markdown,/organization\/not-needed/);assert.equal(paths.length-before,2);
});
test('CLI draft validation accepts the shared spec and reports missing choices without network',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-spec-check-'));
  try{
    const spec=join(dir,'profile.json'),draft=join(dir,'draft.md');
    writeFileSync(spec,JSON.stringify(makeWholeProfileSpec({composition:makeProfileSpec({featured:['example/tools']})})));
    writeFileSync(draft,'# Example\n\nNo selected work linked yet.\n');
    const child=spawnSync(process.execPath,['src/cli.mjs','check','--spec',spec,'--file',draft,'--strict','--json'],{encoding:'utf8',windowsHide:true,env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
    assert.equal(child.status,1);assert.ok(JSON.parse(child.stdout).findings.some(x=>x.id==='selected-project-missing'));
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('the standalone readme command consumes the same full spec through its actual CLI handler',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-native-cli-'));
  try{
    const file=join(dir,'profile.json'),snapshot=snapshotForTest();
    writeFileSync(file,JSON.stringify(makeWholeProfileSpec({composition:makeProfileSpec({language:'es',featured:['example/quiet-scripting'],maxProjects:1,sections:{technologies:false,stats:false},links:[]})})));
    const preload='const snapshot='+JSON.stringify(snapshot)+';globalThis.fetch=async(url)=>{const path=new URL(url).pathname;if(path==="/users/example")return Response.json(snapshot.user);if(path==="/users/example/repos")return Response.json(snapshot.repos);throw Error("Unexpected request "+path);};';
    const child=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),'src/cli.mjs','readme','example','--spec',file],{encoding:'utf8',windowsHide:true,env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''}});
    assert.equal(child.status,0,child.stderr);assert.match(child.stdout,/quiet-scripting/);assert.doesNotMatch(child.stdout,/backend-toolkit|example\.dev|shields/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('original examples repair the illustrative before state and keep local evidence/asset references valid',()=>{
  const root=new URL('../examples/',import.meta.url),spec=makeProfileSpec({featured:['ibbuilds/gh-aura'],maxProjects:1});
  const before=validateProfileDraft(readFileSync(new URL('before.md',root),'utf8'),spec);
  assert.ok(before.findings.some(x=>x.id==='placeholders'));assert.ok(before.findings.some(x=>x.id==='selected-project-missing'));
  for(const name of ['learning.md','technical.md','project-led.md','research.md','visual.md']){
    const file=new URL(name,root),markdown=readFileSync(file,'utf8'),report=validateProfileDraft(markdown,spec);
    assert.ok(!report.findings.some(x=>x.severity==='error'),name);
    for(const ref of extractProfileReferences(markdown).filter(r=>!/^\w+:|^#/.test(r.url)))assert.ok(existsSync(new URL(ref.url,file)),name+' missing '+ref.url);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_SOURCES, listProfileSources, findProfileSources, getProfileSource } from '../src/profile-sources.mjs';
import { makeProfileSpec, validateProfileSpec, refineProfileSpec,
  validateProfileDraft,previewProfileDiff } from '../src/agent-profile.mjs';
import { AGENT_TOOL_DEFINITIONS,agentCapabilities,runAgentTool } from '../src/agent-tools.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';

test('source library is small, unique, attributed, static and privacy-labeled',()=>{
  const data=listProfileSources();
  assert.equal(data.version,'2026-11-12.v1');
  assert.equal(data.count,PROFILE_SOURCES.length);
  assert.ok(data.count>=10&&data.count<=25);
  assert.equal(new Set(data.sources.map(s=>s.id)).size,data.count);
  for(const source of data.sources){
    assert.match(source.id,/^[a-z0-9-]+$/);
    assert.match(source.url,/^https:\/\/[^\s]+$/);
    assert.ok(source.title&&source.category&&source.trust&&source.license);
    assert.ok(source.use&&source.limitations&&source.maintenance&&source.checkedAt);
    assert.equal(typeof source.externalRequests,'boolean');
    assert.equal(getProfileSource(source.id).url,source.url);
  }
  assert.throws(()=>getProfileSource('../secret'),/Unknown source/);
});

test('recommendations prefer official Markdown and require opt-in for external images',()=>{
  const safe=findProfileSources({direction:'barebones'});
  assert.equal(safe.includeExternal,false);
  assert.ok(safe.sources.some(x=>x.id==='github-markdown'));
  assert.ok(safe.sources.every(x=>x.trust!=='third-party'));
  const visual=findProfileSources({query:'icon',direction:'expressive',includeExternal:true});
  assert.ok(visual.sources.some(x=>x.id==='simple-icons'));
  assert.ok(visual.sources.some(x=>x.id==='skill-icons'));
  assert.throws(()=>findProfileSources({limit:0}),/limit/);
  assert.throws(()=>findProfileSources({direction:'glitch'}),/direction/);
});

test('profile spec is independently editable and never injects static README content',()=>{
  const spec=makeProfileSpec({direction:'technical',goal:'backend engineer',
    sections:{stats:false,projects:true},maxProjects:2,
    links:[{label:'Portfolio',url:'https://example.dev'}]});
  assert.equal(spec.format,'gh-aura-profile-spec-v1');
  assert.equal(spec.direction,'technical');
  assert.equal(spec.goal,'backend engineer');
  assert.equal(spec.sections.projects,true);
  assert.equal(spec.sections.stats,false);
  assert.equal(spec.maxProjects,2);
  assert.equal(spec.links[0].url,'https://example.dev');
  assert.equal(spec.includeExternal,false);
  assert.ok(spec.sourceIds.every(id=>getProfileSource(id).trust!=='third-party'));
  assert.doesNotMatch(JSON.stringify(spec),/Dear Hiring Manager|<img /);
  const changed=refineProfileSpec(spec,{direction:'barebones',maxWords:90,
    sections:{projects:false,technologies:false}});
  assert.equal(changed.maxWords,90);
  assert.equal(changed.sections.projects,false);
  assert.equal(changed.sections.links,spec.sections.links);
  assert.deepEqual(changed.links,spec.links);
  assert.equal(changed.direction,'barebones');
  assert.equal(spec.direction,'technical','refinement must not mutate earlier spec');
  assert.throws(()=>refineProfileSpec(spec,{token:'SECRET'}),/approved/);
  assert.throws(()=>refineProfileSpec(spec,{links:[{label:'bad',url:'javascript:alert(1)'}]}),/HTTPS URL/);
  assert.throws(()=>refineProfileSpec(spec,{maxWords:10}),/word budget/);
  assert.throws(()=>validateProfileSpec({...spec,sourceIds:['shields']}),/external source/);
  assert.throws(()=>makeProfileSpec({goal:'\u0007SECRET'}),/plain text/);
  assert.equal(makeProfileSpec({},DEFAULT_CONFIG).direction,'minimal');
});

test('draft validation is heuristic and read-only preview never mints a publish approval',()=>{
  const spec=makeProfileSpec({maxWords:100});
  const report=validateProfileDraft('# Example\n\nI write useful software.\n',spec);
  assert.equal(report.format,'gh-aura-draft-validation-v1');
  assert.match(report.note,/not prove originality/);
  const diff=previewProfileDiff('# Old\n','# New\n');
  assert.equal(diff.changed,true);
  assert.match(diff.diff,/\+\# New/);
  assert.doesNotMatch(JSON.stringify(diff),/Approval code:|--approve [a-f\d]{64}/);
  assert.throws(()=>validateProfileDraft('x'.repeat(300000),spec),/256 KiB/);
  assert.throws(()=>previewProfileDiff('# A\u0000\n','# B\n'),/control characters/);
});

test('all agent tools have bounded schemas, are read-only, and cover four product areas',async()=>{
  const caps=agentCapabilities();
  assert.equal(caps.writesExposed,false);
  assert.equal(caps.aiProviderRequired,false);
  const names=AGENT_TOOL_DEFINITIONS.map(x=>x.name);
  assert.equal(names.length,new Set(names).size);
  assert.ok(names.length>=12);
  for(const tool of AGENT_TOOL_DEFINITIONS){
    assert.equal(tool.annotations.readOnlyHint,true);
    assert.equal(tool.inputSchema.additionalProperties,false);
    assert.ok(tool.description.length>20);
  }
  for(const prefix of ['profile','sources','pins','activity','badges'])
    assert.ok(names.some(n=>n.includes(prefix)),prefix);
  assert.ok(!names.some(n=>/apply|publish|delete|exec|shell|token/.test(n)));
  const catalog=await runAgentTool('gh_aura_badges_catalog',{});
  assert.ok(catalog.entries.some(x=>x.id==='pull-shark'));
  const planned=await runAgentTool('gh_aura_profile_plan',{direction:'barebones'});
  assert.equal(planned.direction,'barebones');
  const updated=await runAgentTool('gh_aura_profile_refine',{
    spec:planned,changes:{maxWords:90}});
  assert.equal(updated.maxWords,90);
  await assert.rejects(runAgentTool('gh_aura_publish',{markdown:'# Attack'}),/unauthorized/);
  await assert.rejects(runAgentTool('gh_aura_sources_search',{command:'rm -rf .'}),/Unexpected/);
});

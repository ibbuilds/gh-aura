import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CUSTOM_SOURCE_FORMAT,readCustomProfileSources} from '../src/profile-custom-sources.mjs';
import {listProfileSources,findProfileSources,getProfileSource} from '../src/profile-sources.mjs';
import {PROFILE_TECHNIQUES,recommendProfileTechniques} from '../src/profile-techniques.mjs';
import {makeProfileSpec,refineProfileSpec,validateProfileSpec} from '../src/agent-profile.mjs';
import {makeBiographyGuide,normalizeBiography,biographyEvidence} from '../src/profile-biography.mjs';
import {runAgentTool,agentCapabilities} from '../src/agent-tools.mjs';
import {editorialBrief} from '../src/brief.mjs';
import {writingPrompt} from '../src/editorial.mjs';
import {configForTest,snapshotForTest} from './fixtures.mjs';

const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const run=(args,cwd,vars={})=>spawnSync(process.execPath,[cli,...args],{
  cwd,encoding:'utf8',timeout:15000,
  env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:'',...vars},
});

test('curated registry covers native layouts and optional visuals without copying profiles',()=>{
  const sources=listProfileSources();
  assert.ok(sources.count>=29);
  assert.equal(sources.customCount,0);
  assert.equal(sources.count,new Set(sources.sources.map(x=>x.id)).size);
  for(const x of sources.sources){
    assert.match(x.url,/^https:\/\//);
    assert.ok(x.title&&x.use&&x.license&&x.limitations&&x.maintenance);
    assert.ok(['github-official','third-party','public-standard','local-research'].includes(x.trust));
  }
  const bio=findProfileSources({query:'biografía sobria',direction:'minimal'});
  assert.ok(bio.sources.some(x=>x.id==='github-profile-bio'));
  assert.ok(bio.sources.every(x=>x.trust!=='third-party'));
  const logos=findProfileSources({query:'iconos',direction:'expressive',includeExternal:true});
  assert.ok(logos.sources.some(x=>x.id==='simple-icons'||x.id==='devicon'));
  const diagrams=findProfileSources({query:'diagramas',direction:'technical'});
  assert.ok(diagrams.sources.some(x=>x.id==='github-diagrams'));
  assert.throws(()=>findProfileSources({query:'x'.repeat(401)}),/400/);
});

test('composition techniques are original building blocks and natural-language searchable',()=>{
  assert.ok(PROFILE_TECHNIQUES.length>=20);
  assert.equal(new Set(PROFILE_TECHNIQUES.map(x=>x.id)).size,PROFILE_TECHNIQUES.length);
  const retro=recommendProfileTechniques({query:'terminal retro',direction:'expressive'});
  assert.ok(retro.techniques.some(x=>x.id==='code-portrait'||x.id==='ascii-art'));
  const tarot=recommendProfileTechniques({query:'tarot',direction:'expressive'});
  assert.ok(tarot.techniques.some(x=>x.id==='one-hero-image'));
  const sober=recommendProfileTechniques({query:'ultraminimalista',direction:'barebones'});
  assert.ok(sober.techniques.some(x=>x.id==='identity'||x.id==='project-list'));
  assert.ok(sober.techniques.every(x=>x.thirdParty===false));
  const stats=recommendProfileTechniques({query:'estadísticas',includeExternal:true});
  assert.ok(stats.techniques.some(x=>x.id==='stats-card'));
  assert.throws(()=>recommendProfileTechniques({limit:26}),/limit/);
  for(const item of PROFILE_TECHNIQUES){
    assert.ok(item.fit&&item.constraints&&item.accessibility);
    for(const id of item.sourceIds)assert.ok(getProfileSource(id));
  }
});

test('user-customized source catalogs are bounded, untrusted, opt-in and never fetched',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-user-sources-'));
  try{
    const file=join(dir,'sources.json');
    const custom={format:CUSTOM_SOURCE_FORMAT,sources:[{
      id:'my-portfolio',title:'My original visual reference',
      url:'https://example.org/reference',category:'design',
      tags:['pixel','retro','hero'],license:'Owner confirms rights',
      use:'Study permitted color and layout ideas, not prose.',
    }]};
    writeFileSync(file,JSON.stringify(custom));
    const read=readCustomProfileSources(file);
    assert.equal(read.length,1);
    assert.equal(read[0].id,'custom-my-portfolio');
    assert.equal(read[0].trust,'user-supplied');
    assert.equal(read[0].externalRequests,true);
    assert.equal(listProfileSources({sourceFile:file}).customCount,1);
    assert.equal(findProfileSources({query:'pixel',sourceFile:file,includeExternal:false})
      .sources.some(x=>x.id==='custom-my-portfolio'),false);
    const optin=findProfileSources({query:'pixel',sourceFile:file,includeExternal:true});
    assert.ok(optin.sources.some(x=>x.id==='custom-my-portfolio'));
    assert.equal(getProfileSource('custom-my-portfolio',{sourceFile:file}).license,'Owner confirms rights');
    const previous=process.env.GH_AURA_SOURCES_FILE;
    process.env.GH_AURA_SOURCES_FILE=file;
    try{
      assert.throws(()=>validateProfileSpec({...makeProfileSpec({}),
        sourceIds:['custom-my-portfolio']}),/external source/);
    }finally{
      if(previous===undefined)delete process.env.GH_AURA_SOURCES_FILE;
      else process.env.GH_AURA_SOURCES_FILE=previous;
    }
    const command=run(['sources','recommend','--query','retro','--external',
      '--catalog',file,'--json'],dir);
    assert.equal(command.status,0,command.stderr);
    assert.ok(JSON.parse(command.stdout).sources.some(x=>x.id==='custom-my-portfolio'));
    writeFileSync(file,JSON.stringify({...custom,sources:[{
      ...custom.sources[0],url:'file:///etc/passwd'}]}));
    assert.throws(()=>readCustomProfileSources(file),/safe HTTPS/);
    writeFileSync(file,JSON.stringify({...custom,sources:[
      custom.sources[0],custom.sources[0]]}));
    assert.throws(()=>readCustomProfileSources(file),/repeated/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('biography spec preserves genuine voice, perspective and user-supplied provenance',()=>{
  const initial=makeProfileSpec({direction:'technical',goal:'backend engineering',
    visualBrief:'Code-like intro with one licensed illustration and real work proof.',
    mediaReferences:[{url:'https://example.org/owned-art.png',alt:'A hand-drawn original avatar',
      rights:'user-owned'}],
    biography:{voice:'editorial',perspective:'third-person',focus:'research',
      maxWords:65,toneNotes:'Calm, concrete and short.',avoid:['world-class','ninja'],
      claims:[{statement:'I wrote the project CLI.',proofUrl:'https://github.com/owner/tool'}]},
  });
  assert.equal(initial.biography.voice,'editorial');
  assert.equal(initial.biography.perspective,'third-person');
  assert.equal(initial.mediaReferences[0].rights,'user-owned');
  const refined=refineProfileSpec(initial,{direction:'barebones',maxWords:125,
    biography:{focus:'engineering',toneNotes:'Even shorter.'},
    visualBrief:'Text only; remove the illustration after approval.',
    mediaReferences:[]});
  assert.equal(refined.biography.voice,'editorial');
  assert.equal(refined.biography.focus,'engineering');
  assert.equal(refined.biography.claims[0].provenance,'user-supplied-not-independently-verified');
  assert.equal(refined.mediaReferences.length,0);
  assert.equal(initial.mediaReferences.length,1);
  const guide=makeBiographyGuide(refined.biography,{
    publicProfile:{name:'Example',bio:'Develops developer tools',blog:'https://example.org'},
    showcaseEvidence:[{name:'owner/tool',description:'An open-source CLI',
      url:'https://github.com/owner/tool'}],observedAt:'2026-11-12'
  });
  assert.equal(guide.format,'gh-aura-bio-guide-v1');
  assert.ok(guide.observations.projects.some(x=>x.repository==='owner/tool'));
  assert.ok(guide.rules.some(x=>x.includes('No invented')));
  assert.ok(guide.biography.claims.every(x=>x.provenance.includes('not-independently')));
  assert.throws(()=>normalizeBiography({voice:'glamorous'}),/voice/);
  assert.throws(()=>refineProfileSpec(initial,{mediaReferences:[{
    url:'javascript:alert(1)',alt:'X',rights:'user-owned'}]}),/HTTPS/);
  assert.throws(()=>normalizeBiography({claims:[{statement:'Senior',proofUrl:'ftp://bad'}]}),/HTTPS/);
});

test('portable brief and agent tools expose biography + design, not copied prose or publish access',async()=>{
  const cfg=configForTest();
  cfg.editorial.direction='technical';
  cfg.editorial.targetRole='backend engineer';
  const brief=editorialBrief(snapshotForTest(),cfg);
  assert.equal(brief.profileSpec.format,'gh-aura-profile-spec-v1');
  assert.equal(brief.profileSpec.biography.voice,'technical');
  assert.ok(brief.techniqueSuggestions.length>0);
  assert.ok(brief.biographyGuide.questions.length>0);
  const prompt=writingPrompt(brief);
  assert.match(prompt,/biographyGuide and profileSpec.biography/);
  assert.match(prompt,/techniqueSuggestions are optional/);
  const spec=await runAgentTool('gh_aura_profile_plan',{
    direction:'expressive',visualBrief:'One original blue graphic',
    biography:{voice:'approachable',focus:'products',maxWords:70},
  });
  assert.equal(spec.biography.voice,'approachable');
  const guide=await runAgentTool('gh_aura_biography_guide',{spec});
  assert.equal(guide.biography.focus,'products');
  const visual=await runAgentTool('gh_aura_design_recommend',{
    query:'terminal retro y bio',direction:'expressive'});
  assert.ok(visual.techniques.some(t=>t.id==='code-portrait'));
  assert.ok(visual.sources.every(x=>x.trust!=='third-party'));
  const ext=await runAgentTool('gh_aura_design_recommend',{
    query:'tarjetas de estadísticas',direction:'expressive',includeExternal:true});
  assert.ok(ext.techniques.some(t=>t.thirdParty));
  const caps=agentCapabilities();
  assert.ok(caps.tools.some(t=>t.name==='gh_aura_biography_guide'));
  assert.ok(caps.tools.some(t=>t.name==='gh_aura_design_recommend'));
  assert.equal(caps.writesExposed,false);
  await assert.rejects(runAgentTool('gh_aura_sources_search',{sourceFile:'/etc/passwd'}),
    /Unexpected/);
});

test('offline CLI guides support original biographies and Spanish composition search',()=>{
  const cwd=mkdtempSync(join(tmpdir(),'gh-aura-bio-cli-'));
  try{
    const bio=run(['agent','bio','--voice','editorial','--focus','research',
      '--bio-words','68','--json'],cwd);
    assert.equal(bio.status,0,bio.stderr);
    const guide=JSON.parse(bio.stdout);
    assert.equal(guide.biography.maxWords,68);
    assert.equal(guide.biography.voice,'editorial');
    const design=run(['sources','design','--query','biografía sobria con código',
      '--direction','technical','--json'],cwd);
    assert.equal(design.status,0,design.stderr);
    assert.ok(JSON.parse(design.stdout).techniques.length>0);
    const bad=run(['agent','bio','--voice','fake-senior'],cwd);
    assert.notEqual(bad.status,0);
    assert.match(bad.stderr,/--voice/);
  }finally{rmSync(cwd,{recursive:true,force:true});}
});

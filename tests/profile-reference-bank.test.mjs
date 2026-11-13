import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const references=JSON.parse(readFileSync(new URL('../research/profile-design-references.json',import.meta.url),'utf8'));

test('profile reference bank retains exactly the eight user-supplied accounts and pending approval',()=>{
  assert.equal(references.schema,'gh-aura-professional-profile-references-v1');
  const expected=['fzn0x','SamuelSchlesinger','yetone','serenakeyitan','mattabate','morluto','poteto','WenyuChiou'];
  const supplied=references.entries.filter(x=>x.origin==='user-supplied-reference').map(x=>x.id);
  assert.deepEqual(supplied,expected);
  assert.equal(references.entries.length,100);
  assert.equal(new Set(references.entries.map(x=>x.id.toLowerCase())).size,100);
  assert.ok(references.entries.every(x=>x.reviewStatus==='pending-user-editorial-approval'));
  assert.ok(references.entries.every(x=>x.assetsCopied===false));
});

test('reference records contain stable public GitHub URLs, editorial patterns and cautions',()=>{
  const directions=new Set(['barebones','minimal','technical','expressive']);
  const uses=new Set(['core','selective','edge-case']);
  for(const x of references.entries){
    assert.match(x.id,/^[a-z\d-]+$/i);
    assert.equal(x.profileUrl,'https://github.com/'+x.id);
    assert.ok(x.readmeUrl.toLowerCase().startsWith((x.profileUrl+'/'+x.id+'/blob/').toLowerCase()));
    assert.ok(x.readmeUrl.endsWith('/README.md'));
    assert.equal(x.verifiedAt,'2026-11-12');
    assert.ok(directions.has(x.designDirection));
    assert.ok(uses.has(x.suggestedUse));
    assert.ok(x.favorablePatterns.length>=1);
    assert.ok(x.avoidCopying.length>=1);
    assert.ok(x.originalWorkRequired);
  }
  assert.ok(references.policy.requireOwnerApprovalForEndorsement);
  assert.match(references.policy.trendingCaveat,/not.*verified monthly ranked/);
  assert.equal(references.publication,'repository-research-only; no GitHub Pages');
});

test('the 100-profile study is verified and diverse but has zero auto-approved examples',()=>{
  assert.equal(references.survey.completed,100);
  assert.equal(references.survey.targetTotal,100);
  assert.equal(references.survey.autoApprovedCount,0);
  assert.equal(references.survey.directReadmeChecks,88);
  assert.equal(references.survey.priorVerifiedProfileChecks,12);
  assert.deepEqual(references.survey.originCounts,{
    'user-supplied-reference':8,'external-curated-research':4,
    'independent-verified-research':88,
  });
  assert.deepEqual(references.survey.designDirectionCounts,{
    expressive:43,technical:26,minimal:24,barebones:7,
  });
  assert.ok(references.entries.some(x=>x.designDirection==='barebones'));
  assert.ok(references.entries.some(x=>x.designDirection==='technical'));
  assert.ok(references.entries.some(x=>x.designDirection==='expressive'));
  assert.equal(references.entries.filter(x=>x.origin==='independent-verified-research').length,88);
  assert.ok(references.survey.trendingConstraint.includes('not accessible'));
  assert.ok(references.survey.qualityConstraint.includes('editorial approval'));
});

test('all 88 new references have directly checked unique public profile README blob hashes',()=>{
  const fresh=references.entries.filter(x=>x.origin==='independent-verified-research');
  assert.equal(fresh.length,88);
  assert.equal(new Set(fresh.map(x=>x.readmeObservation.blobSha)).size,88);
  for(const x of fresh){
    assert.match(x.readmeObservation.blobSha,/^[0-9a-f]{40}$/i);
    assert.equal(x.readmeObservation.observationType,'direct-public-profile-readme');
    assert.ok(x.readmeObservation.characters>=20);
    assert.ok(x.readmeObservation.approximateWords>=0);
    assert.ok(x.readmeObservation.images>=0);
    assert.ok(x.readmeObservation.links>=0);
    assert.ok(x.discoverySource.length>10);
    assert.doesNotMatch(JSON.stringify(x),/gh_aura_apply|approvalCode|authToken/i);
  }
});

test('a readable, indexed study links exactly 100 reviewed GitHub profile READMEs',()=>{
  const body=readFileSync(new URL('../research/PROFILE_REFERENCES.md',import.meta.url),'utf8');
  const source=body.match(/\| \[README\]\(https:\/\/github\.com\//g)||[];
  assert.equal(source.length,100);
  assert.match(body,/GitHub Profile README|100 perfiles/);
  assert.match(body,/pendientes de aprobación/);
  assert.match(body,/no un ranking/i);
  assert.match(body,/no se creó GitHub Pages/i);
});

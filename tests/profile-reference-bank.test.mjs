import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const references=JSON.parse(readFileSync(new URL('../research/profile-design-references.json',import.meta.url),'utf8'));

test('profile reference bank retains exactly the eight user-supplied accounts and pending approval',()=>{
  assert.equal(references.schema,'gh-aura-professional-profile-references-v1');
  const expected=['fzn0x','SamuelSchlesinger','yetone','serenakeyitan','mattabate','morluto','poteto','WenyuChiou'];
  const supplied=references.entries.filter(x=>x.origin==='user-supplied-reference').map(x=>x.id);
  assert.deepEqual(supplied,expected);
  assert.equal(references.entries.length,12);
  assert.equal(new Set(references.entries.map(x=>x.id.toLowerCase())).size,12);
  assert.ok(references.entries.every(x=>x.reviewStatus==='pending-user-editorial-approval'));
  assert.ok(references.entries.every(x=>x.assetsCopied===false));
});

test('reference records contain stable public GitHub URLs, editorial patterns and cautions',()=>{
  const directions=new Set(['barebones','minimal','technical','expressive']);
  const uses=new Set(['core','selective','edge-case']);
  for(const x of references.entries){
    assert.match(x.id,/^[a-z\d-]+$/i);
    assert.equal(x.profileUrl,'https://github.com/'+x.id);
    assert.ok(x.readmeUrl.startsWith(x.profileUrl+'/'+x.id+'/blob/'));
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

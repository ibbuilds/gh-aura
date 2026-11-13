import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHolisticReviewQueue} from '../scripts/prepare-holistic-editorial-review.mjs';
import {assessCategorySelection} from '../scripts/select-holistic-exemplars.mjs';
import {validateHolisticReview,PROFILE_FACETS} from '../src/holistic-profile-taxonomy.mjs';
const data=path=>JSON.parse(readFileSync(new URL('../research/'+path,import.meta.url),'utf8'));
test('all reviewable accounts are input-compatible without silently granting holistic approvals',()=>{
  const triage=data('holistic-category-triage.json');
  const generated=createHolisticReviewQueue(triage);
  const stored=data('holistic-editorial-review-template.json');
  assert.deepEqual(stored,generated);
  assert.equal(generated.availableForReview,561);
  assert.equal(generated.unavailable.length,39);
  assert.equal(generated.targetComplete,500);
  assert.equal(new Set(generated.reviews.map(x=>x.login.toLowerCase())).size,561);
  assert.ok(generated.reviews.every(x=>x.primaryStyle===null&&
    x.decision===null&&x.reviewer===null&&x.reviewedAt===null));
  for(const r of generated.reviews){
    assert.deepEqual(Object.keys(r.facetStates),PROFILE_FACETS);
    assert.ok(PROFILE_FACETS.every(k=>r.facetStates[k]==='not-observed'));
    assert.equal(validateHolisticReview(r).readiness.complete,false);
    assert.equal(r.visualChecks.mobileLight,false);
    assert.equal(r.visualChecks.desktopDark,false);
  }
});
test('500-profile winner gate refuses unreviewed candidate queue regardless of API coverage',()=>{
  const manual=data('holistic-editorial-review-template.json');
  const result=assessCategorySelection(manual.reviews);
  assert.equal(result.status,'blocked-incomplete-holistic-research');
  assert.equal(result.completed,0);
  assert.equal(result.target,500);
  assert.ok(result.conditions.length>0);
});
test('no original user reference is discarded or preapproved',()=>{
  const triage=data('holistic-category-triage.json');
  const source=data('profile-design-references.json');
  const wanted=source.entries.filter(x=>x.origin==='user-supplied-reference').map(x=>x.id.toLowerCase());
  const reviews=data('holistic-editorial-review-template.json').reviews;
  for(const id of wanted){
    const r=reviews.find(x=>x.login.toLowerCase()===id);
    assert.ok(r,id);
    assert.equal(r.decision,null);
    const ref=triage.accounts.find(x=>x.login.toLowerCase()===id);
    assert.ok(ref.userSupplied);
  }
});
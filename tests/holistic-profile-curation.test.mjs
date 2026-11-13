import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeHolisticBatches,manualReviewQueue} from '../scripts/merge-holistic-batches.mjs';
import {assessCategorySelection} from '../scripts/select-holistic-exemplars.mjs';
import {PROFILE_FACETS,groupReviewedProfiles} from '../src/holistic-profile-taxonomy.mjs';
const roster={schema:'gh-aura-holistic-profile-candidates-v1',candidates:[
  {login:'first'},{login:'second'},{login:'third'}]};
const observed=(login)=>({login,availability:'graphql-public-metadata',
  observedAt:'2026-11-12T12:00:00Z',complete:false,achievements:{state:'not-observed'}});
test('merge enforces account order and preserves unknown/unreviewed facets',()=>{
  const merged=mergeHolisticBatches(roster,[
    {schema:'gh-aura-holistic-api-observation-batch-v1',start:0,requested:2,
      profiles:[observed('first'),observed('second')]}]);
  assert.equal(merged.covered,2);
  assert.equal(merged.missingCount,1);
  assert.equal(merged.fullyVisuallyReviewed,0);
  assert.ok(merged.status.includes('API METADATA ONLY'));
  const queue=manualReviewQueue(merged);
  assert.equal(queue.reviews.length,2);
  assert.equal(queue.reviews[0].primaryStyle,null);
  assert.equal(queue.reviews[0].facetStates.achievements,'not-observed');
  assert.equal(queue.reviews[0].visualChecks.mobileDark,false);
  const categorized=groupReviewedProfiles(queue.reviews);
  assert.equal(categorized.pending.length,2);
  for(const array of Object.values(categorized.groups))assert.equal(array.length,0);
});
test('merge rejects duplicate, mismatched and falsely completed reports',()=>{
  const a={schema:'gh-aura-holistic-api-observation-batch-v1',start:0,requested:1,
    profiles:[observed('first')]};
  assert.throws(()=>mergeHolisticBatches(roster,[a,a]),/repeated/);
  assert.throws(()=>mergeHolisticBatches(roster,[{...a,
    profiles:[observed('other')]}]),/mismatch/);
  assert.throws(()=>mergeHolisticBatches(roster,[{...a,
    profiles:[{...observed('first'),complete:true}]}]),/completed visual/);
  assert.throws(()=>mergeHolisticBatches(roster,[{...a,
    profiles:[{...observed('first'),token:'not-allowed'}]}]),/sensitive/);
});
test('category winners cannot exist before 500 real completed reviews',()=>{
  const incomplete={login:'first',primaryStyle:null,secondaryStyles:[],purposes:[],
    decision:null,facetStates:{avatar:'not-observed'}};
  const result=assessCategorySelection([incomplete]);
  assert.equal(result.status,'blocked-incomplete-holistic-research');
  assert.equal(result.completed,0);
  assert.equal(result.target,500);
  const full={login:'first',primaryStyle:'minimal-text',secondaryStyles:[],
    purposes:['open-source'],decision:'approved',editorialRank:1,
    reviewer:'independent-reviewer',reviewedAt:'2026-11-12',evidenceNotes:'Directly checked all public facets.',
    facetStates:Object.fromEntries(PROFILE_FACETS.map(f=>[f,'observed'])),
    visualChecks:{desktopLight:true,desktopDark:true,mobileLight:true,mobileDark:true}};
  const stillBlocked=assessCategorySelection([full]);
  assert.equal(stillBlocked.completed,1);
  assert.equal(stillBlocked.status,'blocked-incomplete-holistic-research');
  const blockedOtherStyles=assessCategorySelection([full],{target:1,minSamplesPerStyle:0});
  assert.equal(blockedOtherStyles.status,'blocked-category-without-approved-exemplar');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestReviewStyles,summarizeObservations} from '../scripts/summarize-holistic-observations.mjs';

const roster={schema:'gh-aura-holistic-profile-candidates-v1',candidates:[
  {login:'tech',profileUrl:'https://github.com/tech'},
  {login:'visual',profileUrl:'https://github.com/visual'},
  {login:'missing',profileUrl:'https://github.com/missing'},
]};

test('summary distinguishes 100% observed public GraphQL data from zero completed visual reviews',()=>{
  const batch={schema:'gh-aura-holistic-api-observation-batch-v1',
    start:0,requested:3,profiles:[
      {login:'tech',complete:false,availability:'graphql-public-metadata',observedAt:'2026-11-12',
        pinnedRepositories:{count:4,items:[{url:'https://github.com/tech/lib'}]},
        profileReadme:{state:'observed',approxWords:210,headings:4,imageCount:0},
        avatar:{state:'url-observed-visual-unreviewed'},
        biography:{present:true},contributionCalendar:{state:'github-visible-to-query-caller'}},
      {login:'visual',complete:false,availability:'graphql-public-metadata',observedAt:'2026-11-12',
        pinnedRepositories:{count:0,items:[]},
        profileReadme:{state:'observed',approxWords:60,headings:1,imageCount:8,remoteStatsImages:3}},
      {login:'missing',complete:false,availability:'not-returned-by-github',observedAt:'2026-11-12'},
    ]};
  const {summary,queue}=summarizeObservations(roster,[batch]);
  assert.equal(summary.inputs.receivedProfiles,3);
  assert.equal(summary.counts.publiclyReturned,2);
  assert.equal(summary.counts.userNotReturned,1);
  assert.equal(summary.counts.rootReadmesObserved,2);
  assert.equal(summary.counts.visuallyReviewed,0);
  assert.equal(summary.counts.categoryWinners,0);
  assert.equal(queue.entries.length,3);
  assert.ok(queue.entries.every(x=>x.primaryStyle===null&&x.needsHumanReview));
  assert.ok(queue.entries.every(x=>x.editorialDecision===null&&x.reviewedAchievements===false));
  assert.ok(queue.entries[0].hypotheses.some(x=>x.style==='project-showcase'));
  assert.ok(queue.entries[0].hypotheses.some(x=>x.style==='technical-editorial'));
  assert.ok(queue.entries[1].hypotheses.some(x=>x.style==='visual-illustrated'));
  assert.ok(queue.entries[1].hypotheses.some(x=>x.style==='data-dashboard'));
  assert.ok(!queue.entries[2].hypotheses.length);
});
test('hints are hypotheses, not profile-wide category determinations',()=>{
  assert.deepEqual(suggestReviewStyles({availability:'not-returned-by-github'}),[]);
  const hints=suggestReviewStyles({availability:'graphql-public-metadata',
    pinnedRepositories:{count:3},profileReadme:{state:'not-observed-at-root'}});
  assert.ok(hints.some(x=>x.style==='native-no-readme'));
  assert.ok(hints.every(x=>x.certainty==='structural-hypothesis-only'));
  assert.throws(()=>summarizeObservations(roster,[{
    schema:'gh-aura-holistic-api-observation-batch-v1',start:0,requested:1,
    profiles:[{login:'WRONG',complete:false,observedAt:'2026-11-12'}]}]),/order/);
});

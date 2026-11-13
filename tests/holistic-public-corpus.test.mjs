import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeObservations} from '../scripts/summarize-holistic-observations.mjs';

const research=(file)=>JSON.parse(readFileSync(new URL('../research/'+file,import.meta.url),'utf8'));

test('the 600 candidate study has authenticated public evidence without claiming 600 full reviews',()=>{
  const roster=research('profile-candidates-600.json');
  const starts=Array.from({length:12},(_,i)=>50*i);
  const batches=starts.map(s=>research('graphql-observations/batch-'+String(s).padStart(3,'0')+'.json'));
  assert.equal(roster.candidates.length,600);
  const {summary,queue}=summarizeObservations(roster,batches);
  assert.equal(summary.inputs.receivedProfiles,600);
  assert.equal(summary.counts.publiclyReturned,561);
  assert.equal(summary.counts.userNotReturned,39);
  assert.equal(summary.counts.rootReadmesObserved,402);
  assert.equal(summary.counts.profilesWithPinnedItems,469);
  assert.equal(summary.counts.visibleContributionCalendars,561);
  assert.equal(summary.counts.visuallyReviewed,0);
  assert.equal(summary.counts.achievementsManuallyChecked,0);
  assert.equal(summary.counts.categoryWinners,0);
  assert.equal(queue.entries.length,600);
  assert.ok(queue.entries.every(x=>x.primaryStyle===null&&x.editorialDecision===null&&
    x.avatarVisuallyReviewed===false&&x.reviewedAchievements===false&&
    x.needsHumanReview===true));
  const stored=research('holistic-public-observations-summary.json');
  assert.equal(stored.counts.available,summary.counts.publiclyReturned);
  assert.equal(stored.counts.readmes,summary.counts.rootReadmesObserved);
  assert.equal(stored.counts.withPinned,summary.counts.profilesWithPinnedItems);
  assert.equal(stored.counts.wholeProfilesReviewed,0);
  const prior=research('profile-design-references.json');
  for(const old of prior.entries.filter(x=>x.origin==='user-supplied-reference')){
    assert.ok(queue.entries.some(x=>x.login.toLowerCase()===old.id.toLowerCase()),old.id);
  }
});
test('fetched public GraphQL profile research never persists biographies or private project content',()=>{
  const starts=Array.from({length:12},(_,i)=>50*i);
  for(const s of starts){
    const batch=research('graphql-observations/batch-'+String(s).padStart(3,'0')+'.json');
    assert.equal(batch.profiles.length,50);
    assert.ok(batch.profiles.every(x=>x.complete===false));
    for(const p of batch.profiles){
      assert.ok(!Object.hasOwn(p,'bio'));
      assert.ok(!Object.hasOwn(p,'email'));
      assert.ok(!Object.hasOwn(p,'token'));
      assert.ok(!Object.hasOwn(p,'rawReadme'));
      for(const pin of p.pinnedRepositories?.items||[]){
        assert.match(pin.url,/^https:\/\/github\.com\//);
        assert.ok(!Object.hasOwn(pin,'isPrivate'));
      }
      if(p.availability==='graphql-public-metadata'){
        assert.equal(p.achievements.state,'not-observed');
        assert.ok(p.visualChecks.desktopLight===false&&p.visualChecks.mobileDark===false);
      }
    }
  }
});
test('dated Trending Developers snapshots are source-indexed candidates, never professional quality rankings',()=>{
  const d=research('trending-developers-snapshot.json');
  assert.equal(d.periods.length,3);
  assert.equal(d.uniqueDeveloperCandidates,66);
  const names=new Set();
  for(const p of d.periods){
    assert.equal(p.profiles.length,25);
    assert.match(p.source,/https:\/\/github\.com\/trending\/developers\?since=/);
    assert.match(p.acquiredAt,/^2026-/);
    p.profiles.forEach((x,i)=>{
      assert.equal(x.rank,i+1);
      assert.match(x.profileUrl,/^https:\/\/github\.com\//);
      names.add(x.login.toLowerCase());
    });
  }
  assert.equal(names.size,66);
  assert.match(d.caution,/not profile professionalism/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { ACHIEVEMENTS, achievementReport } from '../src/achievements.mjs';
import { ACHIEVEMENT_MATRIX, PRIVATE_AUTOMATABLE_IDS,
  achievementMatrixSummary, PULL_SHARK_TIERS } from '../src/achievement-matrix.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { snapshotForTest } from './fixtures.mjs';

const config = () => structuredClone(DEFAULT_CONFIG);

test('registry distinguishes collectible achievements, historical and paid/program badges', () => {
  const byId = new Map(ACHIEVEMENTS.map((item) => [item.id, item]));
  assert.equal(byId.size, ACHIEVEMENTS.length);
  for (const id of ['pull-shark', 'starstruck', 'pair-extraordinaire', 'quickdraw',
    'yolo', 'galaxy-brain', 'public-sponsor']) {
    assert.equal(byId.get(id)?.kind, 'achievement');
  }
  assert.equal(byId.get('arctic-code-vault')?.kind, 'historical');
  assert.equal(byId.get('mars-2020')?.eligibility, 'unavailable-historical');
  assert.equal(byId.get('pro')?.requiresPayment, true);
  assert.equal(byId.get('campus-expert')?.kind, 'program');
  assert.equal(byId.get('open-sourcerer')?.kind, 'experimental');
  assert.ok(ACHIEVEMENTS.every((item) => item.source.startsWith('https://')));
  assert.ok(ACHIEVEMENTS.every((item) => item.sourceReviewedAt === '2026-11-12'));
});

test('free plan remains offline and never claims awarded status', async () => {
  const report = await achievementReport(null, config(), { plan: true, scope: 'free' });
  assert.equal(report.user, null);
  assert.equal(report.readOnly, true);
  assert.ok(report.catalog.length >= 6);
  assert.ok(report.catalog.every((item) => item.kind === 'achievement' && !item.requiresPayment));
  assert.ok(report.plan.every((item) => item.canGrantAutomatically === false));
  assert.ok(report.plan.every((item) => item.source));
  assert.ok(report.catalog.every((item) => item.status === 'opportunity-unverified'));
});

test('private-oriented plan never treats private eligibility as guaranteed', async () => {
  const report = await achievementReport(null, config(), { plan: true, scope: 'free', private: true });
  assert.ok(report.catalog.length > 0);
  assert.ok(report.catalog.every((item) => !['requires-public-discovery', 'not-applicable'].includes(item.privateEligibility)));
  assert.match(report.guidance, /not guaranteed/i);
  assert.ok(report.plan.every((item) => item.canGrantAutomatically === false));
});

test('single badge filtering avoids unrelated public API searches', async () => {
  let calls = 0;
  const report = await achievementReport(snapshotForTest(), config(), {
    badge: 'starstruck', token: '', fetch: async () => { calls++; throw Error('Unexpected search'); },
  });
  assert.equal(report.catalog.length, 1);
  assert.equal(report.catalog[0].id, 'starstruck');
  assert.equal(calls, 0);
});

test('merged pull request observations are not misrepresented as earned badges', async () => {
  const report = await achievementReport(snapshotForTest(), config(), {
    badge: 'pull-shark', token: '', fetch: async () =>
      Response.json({ total_count: 27, incomplete_results: false, items: [] }),
  });
  assert.equal(report.catalog[0].status, 'opportunity-unverified');
  assert.equal(report.catalog[0].evidence.observedPublicMergedPRs, 27);
  assert.match(report.catalog[0].evidence.note, /Not an award/i);
});

test('offline CLI supports plan, scope and targeted badge', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', 'achievements', '--plan', '--scope', 'free', '--badge', 'pull-shark', '--json'],
    { encoding: 'utf8', timeout: 10000, env: { ...process.env, GH_TOKEN: '', GITHUB_TOKEN: '' } });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.catalog.length, 1);
  assert.equal(parsed.plan.length, 1);
  assert.equal(parsed.plan[0].id, 'pull-shark');
  assert.equal(parsed.plan[0].canGrantAutomatically, false);
  assert.equal(parsed.scope, 'free');
});

test('invalid filters are rejected locally with no network calls', async () => {
  await assert.rejects(achievementReport(null, config(), { scope: 'everything' }), /--scope/);
  await assert.rejects(achievementReport(null, config(), { badge: 'made-up-badge' }), /Unknown achievement/);
});

test('matrix catalog covers all current, historical, disabled, staff-only and highlight classes',()=>{
  const summary=achievementMatrixSummary();
  assert.deepEqual(summary.categoryCounts,{
    active:7,historical:2,disabled:2,internal:3,highlight:5
  });
  assert.equal(summary.total,19);
  assert.deepEqual(PRIVATE_AUTOMATABLE_IDS,['pull-shark','yolo','quickdraw']);
  assert.deepEqual(ACHIEVEMENTS.filter(x=>x.conditionalAutomation).map(x=>x.id),['pair-extraordinaire','galaxy-brain']);
  assert.deepEqual(PULL_SHARK_TIERS,{base:2,bronze:16,silver:128,gold:1024});
  assert.equal(new Set(ACHIEVEMENT_MATRIX.map(x=>x.id)).size,19);
  assert.ok(ACHIEVEMENT_MATRIX.every(item=>item.sourceUrls.length>0&&
    item.sourceUrls.every(source=>source.startsWith('https://'))));
  assert.ok(ACHIEVEMENT_MATRIX.filter(x=>!x.automatable)
    .every(x=>x.route!=='private-owned-sandbox'&&x.reason.length>10));
  assert.ok(ACHIEVEMENTS.every(item=>
    ACHIEVEMENT_MATRIX.some(entry=>entry.id===item.id)));
});
test('no third-party, historical, paid or internal badge can be automatically attempted',async()=>{
  const report=await achievementReport(null,config(),{scope:'all',plan:true});
  assert.equal(report.matrix.total,19);
  const accepted=report.catalog.filter(x=>x.automatableInPrivateWorkspace).map(x=>x.id);
  assert.deepEqual(accepted.sort(),['pull-shark','quickdraw','yolo']);
  assert.ok(report.plan.every(x=>x.canGrantAutomatically===false));
  for(const item of report.plan){
    if(!accepted.includes(item.id)){
      assert.equal(item.canAttemptInOnePrivateWorkspace,false);
      assert.ok(item.exclusionReason);
    }
  }
});

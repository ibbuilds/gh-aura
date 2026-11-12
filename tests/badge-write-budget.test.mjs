import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { reserveBadgeWrite, BADGE_WRITE_HOURLY_BUDGET, BADGE_WRITE_WINDOW_MS } from '../src/badge-write-budget.mjs';

function withTemp(fn){
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-write-budget-'));
  try{return fn(dir);}
  finally{rmSync(dir,{recursive:true,force:true});}
}

test('hourly reservation persists, expires and is scoped per authenticated account',()=>withTemp(dir=>{
  const now=Date.UTC(2026,10,12,10,0,0);
  const a=reserveBadgeWrite('example',{directory:dir,now,maxWrites:2});
  assert.equal(a.remaining,1);
  const b=reserveBadgeWrite('EXAMPLE',{directory:dir,now:now+1,maxWrites:2});
  assert.equal(b.remaining,0);
  assert.equal(b.localOnly,true);
  assert.throws(()=>reserveBadgeWrite('example',{directory:dir,now:now+2,maxWrites:2}),/budget exhausted/);
  const other=reserveBadgeWrite('another',{directory:dir,now:now+2,maxWrites:2});
  assert.equal(other.remaining,1);
  const recovered=reserveBadgeWrite('example',{
    directory:dir,now:now+BADGE_WRITE_WINDOW_MS,maxWrites:2
  });
  assert.equal(recovered.remaining,0,'one prior reservation remains inside the rolling hour');
  const after=reserveBadgeWrite('example',{
    directory:dir,now:now+BADGE_WRITE_WINDOW_MS+1,maxWrites:2
  });
  assert.equal(after.remaining,0);
}));

test('ledger contains no credentials and uses a hashed account key',()=>withTemp(dir=>{
  const now=Date.UTC(2026,10,12,10,0,0);
  reserveBadgeWrite('example',{directory:dir,now,maxWrites:2});
  const files=readdirSync(dir);
  assert.equal(files.length,1);
  const raw=readFileSync(join(dir,files[0]),'utf8');
  const data=JSON.parse(raw);
  assert.equal(data.format,'gh-aura-write-budget-v1');
  assert.deepEqual(data.timestamps,[now]);
  assert.ok(!raw.includes('example'));
  assert.ok(!files[0].includes('example'));
}));

test('fail-closed on lock collisions, corrupt state, invalid owners and quota overrides',()=>withTemp(dir=>{
  const now=Date.UTC(2026,10,12,10,0,0);
  assert.throws(()=>reserveBadgeWrite('../victim',{directory:dir,now}),/verified GitHub owner/);
  assert.throws(()=>reserveBadgeWrite('example',{
    directory:dir,now,maxWrites:BADGE_WRITE_HOURLY_BUDGET+1
  }),/hourly write budget/);
  reserveBadgeWrite('example',{directory:dir,now});
  const [file]=readdirSync(dir);
  const lock=join(dir,file.replace(/\.json$/u,'.lock'));
  mkdirSync(lock,{mode:0o700});
  assert.throws(()=>reserveBadgeWrite('example',{directory:dir,now:now+1}),/concurrent runs/);
  rmSync(lock,{recursive:true});
  const otherNow=now-BADGE_WRITE_WINDOW_MS;
  assert.throws(()=>reserveBadgeWrite('example',{directory:dir,now:otherNow}),/Invalid or inconsistent/);
  const statePath=join(dir,file);
  writeFileSync(statePath,'not json');
  assert.throws(()=>reserveBadgeWrite('example',{directory:dir,now:now+1}),/Cannot verify local/);
}));

test('paired Quickdraw reservations are atomic and never partially consume the final slot',()=>withTemp(dir=>{
  const now=Date.UTC(2026,10,12,10,0,0);
  const first=reserveBadgeWrite('example',{directory:dir,now,maxWrites:3,count:2});
  assert.equal(first.remaining,1);
  const [file]=readdirSync(dir);
  const snapshot=readFileSync(join(dir,file),'utf8');
  assert.throws(()=>reserveBadgeWrite('example',{
    directory:dir,now:now+1,maxWrites:3,count:2
  }),/budget exhausted/);
  assert.equal(readFileSync(join(dir,file),'utf8'),snapshot,'failed pair must not reserve a partial slot');
  assert.equal(reserveBadgeWrite('example',{
    directory:dir,now:now+2,maxWrites:3,count:1
  }).remaining,0);
  assert.throws(()=>reserveBadgeWrite('example',{
    directory:dir,now:now+3,maxWrites:3,count:0
  }),/number of remote writes/);
}));

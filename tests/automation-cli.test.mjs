import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const run=(argv,dir)=>{
  return spawnSync(process.execPath,[cli,...argv],{
    cwd:dir,encoding:'utf8',timeout:10000,
    env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
  });
};
test('GH Aura activity plan and badge-run plan are entirely offline CLI entrypoints',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-offline-automation-'));
  try{
    const calendarFile=join(root,'calendar.json');
    const badgeFile=join(root,'badges.json');
    let r=run(['activity','plan','2022','--density','60','--seed','7','--output',calendarFile],root);
    assert.equal(r.status,0,r.stderr);
    const calendar=JSON.parse(readFileSync(calendarFile,'utf8'));
    assert.equal(calendar.format,'gh-aura-synthetic-calendar-v1');
    assert.ok(calendar.days.length>0);
    assert.equal(calendar.settings.density,60);
    r=run(['badges','auto','--repo','example/aura-private','--pulls','2','--output',badgeFile],root);
    assert.equal(r.status,0,r.stderr);
    const badges=JSON.parse(readFileSync(badgeFile,'utf8'));
    assert.equal(badges.format,'gh-aura-private-badges-v2');
    assert.equal(badges.private,true);
    assert.equal(badges.pulls,2);
    const init=run(['init','example'],root);
    assert.equal(init.status,0,init.stderr);
    const defaultBadge=join(root,'default-badges.json');
    r=run(['badges','auto','--pulls','1','--output',defaultBadge],root);
    assert.equal(r.status,0,r.stderr);
    assert.equal(JSON.parse(readFileSync(defaultBadge,'utf8')).repo,'example/gh-aura-workspace');
    const reject=run(['activity','apply','--review',calendarFile,
      '--repo','example/private-timeline','--author-name','Example User',
      '--author-email','someone@example.com','--confirm',calendar.fingerprint],root);
    assert.notEqual(reject.status,0);
    assert.match(reject.stderr,/GH_TOKEN|GITHUB_TOKEN/);
    const noToken=run(['badges','auto','apply','--review',badgeFile,
      '--confirm',badges.fingerprint],root);
    assert.notEqual(noToken.status,0);
    assert.match(noToken.stderr,/GH_TOKEN|GITHUB_TOKEN/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('GH Aura activity refuses an unapproved push before reading a plan',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-reject-'));
  try{
    const x=run(['activity','apply','--repo','example/private-repo'],root);
    assert.notEqual(x.status,0);
    assert.match(x.stderr,/requires --review/);
    const y=run(['badges','auto','apply'],root);
    assert.notEqual(y.status,0);
    assert.match(y.stderr,/requires --review/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('private badge status does not attempt a network read without a token',()=>{
  const dir=mkdtempSync(join(tmpdir(),'aura-read-only-status-'));
  try{
    const status=run(['badges','auto','status','--repo','example/gh-aura-workspace'],dir);
    assert.notEqual(status.status,0);
    assert.match(status.stderr,/GH_TOKEN|GITHUB_TOKEN/);
    const invalid=run(['badges','auto','status','--pulls','2'],dir);
    assert.notEqual(invalid.status,0);
    assert.match(invalid.stderr,/accepts only optional --repo/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('badges auto next validates tier and runs read-only before authentication',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-next-offline-rejections-'));
  try{
    const noToken=run(['badges','auto','next','--repo','example/aura-private',
      '--tier','bronze'],root);
    assert.notEqual(noToken.status,0);
    assert.match(noToken.stderr,/GH_TOKEN|GITHUB_TOKEN/);
    const missingTier=run(['badges','auto','next','--repo','example/aura-private'],root);
    assert.notEqual(missingTier.status,0);
    assert.match(missingTier.stderr,/requires exactly one of/);
    const disallowed=run(['badges','auto','next','--repo','example/aura-private',
      '--tier','bronze','--start','16'],root);
    assert.notEqual(disallowed.status,0);
    assert.match(disallowed.stderr,/requires exactly one of/);
    const invalidCount=run(['badges','auto','next','--repo','example/aura-private',
      '--tier','bronze','--pulls','0'],root);
    assert.notEqual(invalidCount.status,0);
    assert.match(invalidCount.stderr,/--pulls.*1\.\.16/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('max-level goal is accepted only by read-only next and cannot be applied unreviewed',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-max-goal-'));
  try{
    const goal=run(['badges','auto','next','--repo','example/gh-aura-workspace',
      '--goal','max'],root);
    assert.notEqual(goal.status,0);
    assert.match(goal.stderr,/GH_TOKEN|GITHUB_TOKEN/);
    const conflicting=run(['badges','auto','next','--repo','example/gh-aura-workspace',
      '--goal','max','--tier','gold'],root);
    assert.notEqual(conflicting.status,0);
    assert.match(conflicting.stderr,/requires exactly one of/);
    const invalid=run(['badges','auto','next','--repo','example/gh-aura-workspace',
      '--goal','platinium'],root);
    assert.notEqual(invalid.status,0);
    assert.match(invalid.stderr,/requires exactly one of/);
    const plan=run(['badges','auto','plan','--repo','example/gh-aura-workspace',
      '--goal','max'],root);
    assert.notEqual(plan.status,0);
    assert.match(plan.stderr,/--goal is reserved/);
    const status=run(['badges','auto','status','--repo','example/gh-aura-workspace',
      '--goal','max'],root);
    assert.notEqual(status.status,0);
    assert.match(status.stderr,/accepts only optional/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('atomic Git strategy is opt-in, SHA-bound and rejected on unreviewed apply',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-bulk-cli-'));
  try{
    const file=join(root,'atomic.json');
    const proposed=run(['badges','auto','--repo','example/private-workspace',
      '--strategy','git-batch','--tier','base','--output',file],root);
    assert.equal(proposed.status,0,proposed.stderr);
    const p=JSON.parse(readFileSync(file,'utf8'));
    assert.equal(p.format,'gh-aura-private-badges-v3');
    assert.equal(p.strategy,'git-batch');
    assert.equal(p.pulls,2);
    const invalid=run(['badges','auto','--repo','example/private-workspace',
      '--strategy','magic'],root);
    assert.notEqual(invalid.status,0);
    assert.match(invalid.stderr,/--strategy must/);
    const unapproved=run(['badges','auto','apply','--review',file,
      '--confirm','0'.repeat(64)],root);
    assert.notEqual(unapproved.status,0);
    assert.match(unapproved.stderr,/GH_TOKEN|GITHUB_TOKEN|confirm/);
    const status=run(['badges','auto','status',
      '--repo','example/private-workspace','--strategy','git-batch'],root);
    assert.notEqual(status.status,0);
    assert.match(status.stderr,/status accepts only/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

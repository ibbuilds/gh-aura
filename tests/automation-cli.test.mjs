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
test('Calendar Studio plan and badge-run plan are entirely offline CLI entrypoints',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-offline-automation-'));
  try{
    const calendarFile=join(root,'calendar.json');
    const badgeFile=join(root,'badges.json');
    let r=run(['calendar','plan','2022','--density','60','--seed','7','--output',calendarFile],root);
    assert.equal(r.status,0,r.stderr);
    const calendar=JSON.parse(readFileSync(calendarFile,'utf8'));
    assert.equal(calendar.format,'gh-aura-synthetic-calendar-v1');
    assert.ok(calendar.days.length>0);
    assert.equal(calendar.settings.density,60);
    r=run(['badges','auto','--repo','example/aura-private','--pulls','2','--output',badgeFile],root);
    assert.equal(r.status,0,r.stderr);
    const badges=JSON.parse(readFileSync(badgeFile,'utf8'));
    assert.equal(badges.format,'gh-aura-private-badges-v1');
    assert.equal(badges.private,true);
    assert.equal(badges.pulls,2);
    const reject=run(['calendar','apply','--review',calendarFile,
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
test('Calendar Studio refuses an unapproved push before reading a plan',()=>{
  const root=mkdtempSync(join(tmpdir(),'aura-reject-'));
  try{
    const x=run(['calendar','apply','--repo','example/private-repo'],root);
    assert.notEqual(x.status,0);
    assert.match(x.stderr,/requires --review/);
    const y=run(['badges','auto','apply'],root);
    assert.notEqual(y.status,0);
    assert.match(y.stderr,/requires --review/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

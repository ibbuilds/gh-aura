import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, hostname } from 'node:os';
import { spawnSync } from 'node:child_process';
import { makeWholeProfileSpec, refineWholeProfileSpec, prepareProfilePlan, previewWholeProfilePlan,
  executeProfilePlan, validateProfilePlan, digest, approvedPlanFromHost } from '../src/profile-plan.mjs';

const sha = value => createHash('sha1').update('blob ' + Buffer.byteLength(value) + '\0').update(value).digest('hex');
function fixture({ missing = false } = {}) {
  const old = '# Existing\n';
  const s = { user: { login: 'example', type: 'User', bio: 'Old bio', name: 'Example', blog: '', company: '', location: '', hireable: false },
    repo: missing ? null : { id: 42, private: false, full_name: 'example/example', default_branch: 'main' },
    blobs: new Map([[sha(old), old]]), trees: new Map([['2'.repeat(40), { 'README.md': sha(old) }]]),
    commits: new Map([['1'.repeat(40), { tree: { sha: '2'.repeat(40) } }]]), branches: new Map([['main', '1'.repeat(40)]]),
    writes: [], pulls: [], failAccount: false, loseAccountResponse: false, loseRefResponse: false, authenticated: 'example' };
  const response = (data, status = 200) => Response.json(data, { status });
  const fetch = async (address, init = {}) => {
    const u = new URL(address); assert.equal(u.origin, 'https://api.github.com');
    const p = decodeURIComponent(u.pathname), method = init.method || 'GET', body = init.body ? JSON.parse(init.body) : null;
    const base = '/repos/example/example';
    if (method !== 'GET') s.writes.push({ path: p, method, body });
    if (p === '/users/example') return response(s.user);
    if (p === '/user') {
      if (method === 'PATCH') {
        if (s.failAccount) return response({}, 403);
        Object.assign(s.user, body);
        if (s.loseAccountResponse) { s.loseAccountResponse = false; throw Error('lost response'); }
      }
      return response({ ...s.user, login: s.authenticated });
    }
    if (p === '/user/repos' && method === 'POST') { s.repo = { id: 42, full_name: 'example/example', private: false, default_branch: 'main' }; return response(s.repo); }
    if (p === base) return s.repo ? response(s.repo) : response({}, 404);
    if (p.startsWith(base + '/contents/')) {
      if(method==='PUT'){
        const content=Buffer.from(body.content,'base64'),oid=sha(content),tree={ 'README.md':oid },treeSha=sha(JSON.stringify(tree)),commitSha=sha('initial'+treeSha);
        s.blobs.set(oid,content);s.trees.set(treeSha,tree);s.commits.set(commitSha,{tree:{sha:treeSha}});s.branches.set(body.branch,commitSha);
        return response({content:{sha:oid},commit:{sha:commitSha}});
      }
      const branch = u.searchParams.get('ref') || 'main', head = s.branches.get(branch);
      const tree = s.trees.get(s.commits.get(head)?.tree.sha), path = p.slice((base + '/contents/').length), oid = tree?.[path];
      if (!oid) return response({}, 404);
      return response({ path, type: 'file', sha: oid, encoding: 'base64', content: Buffer.from(s.blobs.get(oid)).toString('base64') });
    }
    if (p.startsWith(base + '/git/ref/heads/')) {
      const branch = p.slice((base + '/git/ref/heads/').length), oid = s.branches.get(branch);
      return oid ? response({ object: { sha: oid } }) : response({}, 404);
    }
    if (p === base + '/git/blobs') { const content = Buffer.from(body.content, body.encoding === 'utf-8' ? 'utf8' : 'base64'); const oid = sha(content); s.blobs.set(oid, content); return response({ sha: oid }); }
    if (p === base + '/git/trees') { const tree = { ...s.trees.get(body.base_tree) }; for (const entry of body.tree) tree[entry.path] = entry.sha; const oid = sha(JSON.stringify(tree)); s.trees.set(oid, tree); return response({ sha: oid }); }
    if (p === base + '/git/commits') { const oid = sha(JSON.stringify(body)); s.commits.set(oid, { tree: { sha: body.tree }, parents: body.parents }); return response({ sha: oid }); }
    if (p.startsWith(base + '/git/commits/')) return response(s.commits.get(p.slice((base + '/git/commits/').length)));
    if (p === base + '/git/refs') { const branch = body.ref.slice('refs/heads/'.length); if (s.branches.has(branch)) return response({}, 422); s.branches.set(branch, body.sha); return response({ object: { sha: body.sha } }); }
    if (p.startsWith(base + '/git/refs/heads/')) {
      const branch = p.slice((base + '/git/refs/heads/').length);
      assert.equal(body.force, false);
      if (s.commits.get(body.sha)?.parents?.[0] !== s.branches.get(branch)) return response({}, 422);
      s.branches.set(branch, body.sha);
      if (s.loseRefResponse) { s.loseRefResponse = false; throw Error('lost ref response'); }
      return response({ object: { sha: body.sha } });
    }
    if (p.startsWith(base + '/compare/')) {
      const branch = p.split('...')[1], tree = s.trees.get(s.commits.get(s.branches.get(branch)).tree.sha);
      return response({ files: Object.keys(tree).filter(path => tree[path] !== s.trees.get('2'.repeat(40))[path]).map(filename => ({ filename, status: filename === 'README.md' ? 'modified' : 'added' })) });
    }
    if (p === base + '/pulls') {
      if (method === 'POST') { const pr = { number: s.pulls.length + 1, html_url: 'https://github.com/example/example/pull/' + (s.pulls.length + 1) }; s.pulls.push(pr); return response(pr); }
      return response(s.pulls);
    }
    throw Error('Unexpected fixture endpoint ' + method + ' ' + p);
  };
  return { state: s, api: { fetch, token: 'fixture-only', sleep: async () => {} } };
}
const withState = async fn => { const dir = mkdtempSync(join(tmpdir(), 'aura-profile-plan-')); try { await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); } };
const draft = '# Example\n\nI build tools.\n';

test('whole-profile intent keeps sidebar bio, README voice, pins and refinements distinct', () => {
  const spec = makeWholeProfileSpec({ account: { bio: 'Backend tools' }, pins: ['example/tools'] });
  const changed = refineWholeProfileSpec(spec, { account: { blog: 'https://example.org' }, readme: false });
  assert.equal(changed.account.bio, 'Backend tools'); assert.equal(changed.composition.biography.maxWords, 70);
  assert.deepEqual(changed.pins, ['example/tools']); assert.equal(changed.readme, false); assert.equal(spec.readme, true);
  assert.throws(() => makeWholeProfileSpec({ account: { bio: 'x'.repeat(161) } }), /account.bio/);
  assert.throws(() => makeWholeProfileSpec({ account: { email: 'private@example.org' } }), /account/);
  assert.throws(() => makeWholeProfileSpec({ account: { blog: 'javascript:alert(1)' } }), /blog/);
});
test('planning and preview are read-only and bind exact contents, account fields and asset rights', async () => {
  const f = fixture(); const spec = makeWholeProfileSpec({ account: { bio: 'New bio' }, assets: [{ path: 'assets/diagram.svg', content: '<svg/>', encoding: 'utf-8', alt: 'Architecture', rights: 'user-owned' }] });
  const plan = await prepareProfilePlan('example', spec, draft, f.api);
  assert.equal(f.state.writes.length, 0); assert.equal(plan.files.length, 2); assert.equal(plan.files[1].rights, 'user-owned');
  assert.match(previewWholeProfilePlan(plan).files[0].diff, /Existing/);
  assert.throws(() => validateProfilePlan({ ...plan, username: 'other' }), /fingerprint/);
  const bad = structuredClone(plan); bad.files[0].content += 'changed'; const { fingerprint, ...rest } = bad; bad.fingerprint = digest(rest);
  assert.throws(() => validateProfilePlan(bad), /content changed/);
});
test('atomic README and asset publication preserves the old tree and updates only requested account fields', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', { account: { bio: 'New bio' }, assets: [{ path: 'assets/diagram.svg', content: '<svg/>', encoding: 'utf-8', alt: 'Architecture', rights: 'user-owned' }] }, draft, { ...f.api, delivery: 'commit' });
  const result = await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(result.state, 'verified'); assert.equal(f.state.user.bio, 'New bio'); assert.equal(f.state.user.name, 'Example');
  const tree = f.state.trees.get(f.state.commits.get(f.state.branches.get('main')).tree.sha);
  assert.equal(tree['README.md'], sha(draft)); assert.equal(tree['assets/diagram.svg'], sha('<svg/>'));
  const count = f.state.writes.length; await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(f.state.writes.length, count, 'replay must reconcile without another remote mutation');
}));
test('PR delivery does not merge and reports the remaining owner action', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', {}, draft, f.api);
  const result = await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(f.state.branches.get('main'), '1'.repeat(40)); assert.equal(f.state.pulls.length, 1);
  assert.equal(result.state, 'needs-user-action'); assert.match(result.operations.files.pullRequest, /pull\/1$/);
  await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }); assert.equal(f.state.pulls.length, 1);
}));
test('a closed review is not reopened by replaying its old approval', () => withState(async stateDir => {
  const f=fixture(),plan=await prepareProfilePlan('example',{},draft,f.api);
  await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});
  f.state.pulls[0].state='closed';const count=f.state.writes.length;
  const result=await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});
  assert.equal(result.operations.files.publication,'closed-without-merge');assert.equal(f.state.pulls.length,1);assert.equal(f.state.writes.length,count);
}));
test('a merged review is verified from the default branch without another write', () => withState(async stateDir => {
  const f=fixture(),plan=await prepareProfilePlan('example',{},draft,f.api);
  await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});
  const branch='gh-aura/profile-'+plan.fingerprint.slice(0,24);f.state.branches.set('main',f.state.branches.get(branch));
  f.state.pulls[0].state='closed';f.state.pulls[0].merged_at=new Date().toISOString();const count=f.state.writes.length;
  const result=await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});
  assert.equal(result.state,'verified');assert.equal(result.operations.files.publication,'default-branch-matches');assert.equal(f.state.writes.length,count);
}));
test('a dead local execution lock is recovered; a live process lock blocks all effects', () => withState(async stateDir => {
  const f=fixture(),plan=await prepareProfilePlan('example',{readme:false,account:{bio:'New'}},undefined,f.api);
  const path=join(stateDir,plan.fingerprint+'.json.lock');
  writeFileSync(path,JSON.stringify({pid:process.pid,hostname:hostname(),fingerprint:plan.fingerprint}));
  await assert.rejects(executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir}),/locked/);assert.equal(f.state.writes.length,0);
  const child=spawnSync(process.execPath,['-e',''],{windowsHide:true});
  assert.equal(child.status,0);
  writeFileSync(path,JSON.stringify({pid:child.pid,hostname:hostname(),fingerprint:plan.fingerprint}));
  const result=await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});assert.equal(result.state,'verified');
}));
test('wrong owner, absent approval and concurrent branch movement cause zero writes', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', { account: { bio: 'New' } }, draft, f.api);
  await assert.rejects(executeProfilePlan(plan, '0'.repeat(64), { ...f.api, stateDir }), /approval/);
  f.state.authenticated = 'other'; await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /does not own/);
  f.state.authenticated = 'example'; f.state.branches.set('main', '9'.repeat(40));
  await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /branch changed/);
  assert.equal(f.state.writes.length, 0);
}));
test('a lost account response is reconciled by reading and never duplicated', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', { readme: false, account: { bio: 'New' } }, undefined, f.api);
  f.state.loseAccountResponse = true;
  await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /unknown|Network/);
  const result = await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(result.state, 'verified'); assert.equal(f.state.writes.length, 1);
}));
test('an unconfirmed failed account write is not blindly retried', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', { readme: false, account: { bio: 'New' } }, undefined, f.api);
  f.state.failAccount = true;
  await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /denied/);
  await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /uncertain/);
  assert.equal(f.state.writes.length, 1);
}));
test('a lost final Git ref response is reconciled without another publication', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', {}, draft, { ...f.api, delivery: 'commit' });
  f.state.loseRefResponse = true; await assert.rejects(executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir }), /unknown|Network/);
  const count = f.state.writes.length; const result = await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(result.state, 'verified'); assert.equal(f.state.writes.length, count);
}));
test('creating a profile repository is an explicit part of the reviewed plan', () => withState(async stateDir => {
  const f = fixture({ missing: true }); const plan = await prepareProfilePlan('example', {}, draft, { ...f.api, delivery: 'commit' });
  assert.equal(plan.createRepository, true); await executeProfilePlan(plan, plan.fingerprint, { ...f.api, stateDir });
  assert.equal(f.state.writes.filter(x => x.path === '/user/repos').length, 1);
  assert.equal(f.state.repo.private, false);
}));
test('a newly created profile PR can be verified after merge and source-branch deletion',()=>withState(async stateDir=>{
  const f=fixture({missing:true}),plan=await prepareProfilePlan('example',{},draft,f.api);
  const first=await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});assert.equal(first.state,'needs-user-action');
  const branch='gh-aura/profile-'+plan.fingerprint.slice(0,24);
  f.state.branches.set('main',f.state.branches.get(branch));f.state.branches.delete(branch);
  Object.assign(f.state.pulls[0],{state:'closed',merged_at:new Date().toISOString()});
  const count=f.state.writes.length,result=await executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir});
  assert.equal(result.state,'verified');assert.equal(f.state.writes.length,count);
}));
test('a forged journal cannot expand an absent-repository grant into an existing repository write', () => withState(async stateDir => {
  const f=fixture({missing:true}),plan=await prepareProfilePlan('example',{},draft,{...f.api,delivery:'commit'});
  f.state.repo={id:42,private:false,full_name:'example/example',default_branch:'main'};
  writeFileSync(join(stateDir,plan.fingerprint+'.json'),JSON.stringify({format:'gh-aura-profile-execution-v1',fingerprint:plan.fingerprint,
    operations:{create:{state:'verified',id:42,head:'1'.repeat(40),branch:'main'}}}));
  await assert.rejects(executeProfilePlan(plan,plan.fingerprint,{...f.api,stateDir}),/appeared after planning/);assert.equal(f.state.writes.length,0);
}));
test('malformed pins are rejected before a valid account change can run', () => withState(async stateDir => {
  const f=fixture(),plan=await prepareProfilePlan('example',{readme:false,account:{bio:'New'}},undefined,f.api);
  const bad={...plan,pins:null};const {fingerprint,...body}=bad;bad.fingerprint=digest(body);
  await assert.rejects(executeProfilePlan(bad,bad.fingerprint,{...f.api,stateDir}),/components/);assert.equal(f.state.writes.length,0);
}));
test('an account-only plan does not inspect an unrelated private profile repository', async()=>{
  const f=fixture();f.state.repo.private=true;
  const plan=await prepareProfilePlan('example',{readme:false,account:{bio:'New'}},undefined,f.api);
  assert.equal(plan.repository.inspected,false);assert.equal(plan.files.length,0);
});
test('asset traversal and active SVGs are rejected before inspection or publication', () => {
  const asset = { path: 'assets/a.svg', content: '<svg/>', encoding: 'utf-8', alt: 'A', rights: 'user-owned' };
  assert.throws(() => makeWholeProfileSpec({ assets: [{ ...asset, path: 'assets/../README.md' }] }), /paths/);
  assert.throws(() => makeWholeProfileSpec({ assets: [{ ...asset, content: '<svg onload="run()"/>' }] }), /Active/);
  assert.throws(() => makeWholeProfileSpec({ assets: [{ ...asset, rights: 'unverified' }] }), /rights/);
});
test('the execution grant is pinned by host configuration, not chosen by model arguments', () => withState(async stateDir => {
  const f = fixture(); const plan = await prepareProfilePlan('example', {}, draft, f.api), file = join(stateDir, 'plan.json');
  writeFileSync(file, JSON.stringify(plan));
  assert.throws(() => approvedPlanFromHost({}), /not configured/);
  assert.equal(approvedPlanFromHost({ GH_AURA_APPROVED_PLAN: file, GH_AURA_APPROVED_FINGERPRINT: plan.fingerprint }).username, 'example');
  const changed = JSON.parse(readFileSync(file)); changed.account.after = { bio: 'Unauthorized' }; changed.account.before = { bio: 'Old bio' };
  const { fingerprint, ...body } = changed; changed.fingerprint = digest(body); writeFileSync(file, JSON.stringify(changed));
  assert.throws(() => approvedPlanFromHost({ GH_AURA_APPROVED_PLAN: file, GH_AURA_APPROVED_FINGERPRINT: plan.fingerprint }), /changed/);
}));

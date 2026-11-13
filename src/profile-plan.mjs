import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync, mkdirSync, openSync, closeSync, unlinkSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, hostname } from 'node:os';
import { getJSON, requestJSON, decodeReadme, validateLogin, tokenFor } from './github.mjs';
import { makeProfileSpec, validateProfileSpec,refineProfileSpec,validateProfileDraft } from './agent-profile.mjs';
import { plain, httpsUrl } from './text.mjs';
import { diffText } from './diff.mjs';
import { prepareWorkspaceActions,validateWorkspaceActions,preflightWorkspaceActions,executeWorkspaceActions } from './workspace-actions.mjs';
import { inspectCurrentPins } from './profile-projects.mjs';
import { checkProfileResources } from './profile-resources.mjs';

export const WHOLE_PROFILE_FORMAT = 'gh-aura-whole-profile-v1';
export const PROFILE_PLAN_FORMAT = 'gh-aura-profile-change-plan-v1';
const fields = { name: 100, bio: 160, blog: 500, company: 100, location: 100 };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = (x, limit, label) => {
  if (typeof x !== 'string' || [...x].length > limit || plain(x) !== x)
    throw Error('Invalid ' + label + '.');
  return x;
};
const only = (x, keys, label) => {
  if (!object(x) || Object.keys(x).some(k => !keys.includes(k))) throw Error('Invalid ' + label + ' fields.');
};
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') throw Error('Unsupported plan value.');
  return JSON.stringify(value);
}
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
const blobSha = bytes => createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
const same = (a, b) => canonical(a) === canonical(b);
const normalAccount = (user, key) => key === 'hireable' ? user[key] === true : user[key] || '';
export function validateAccount(input = {}) {
  only(input, [...Object.keys(fields), 'hireable'], 'account');
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'hireable') {
      if (typeof value !== 'boolean') throw Error('hireable must be boolean.');
      out[key] = value;
    } else {
      out[key] = text(value, fields[key], 'account.' + key);
      if (/[\r\n]/.test(value) || key === 'blog' && value && !httpsUrl(value)) throw Error('Invalid account.' + key + '.');
    }
  }
  return out;
}
const repository = x => {
  if (typeof x !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\/[a-z\d_.-]{1,100}$/i.test(x)) throw Error('Expected OWNER/REPO.');
  validateLogin(x.split('/')[0]);
  return x;
};
export function makeWholeProfileSpec(input = {}, config) {
  only(input, ['format', 'composition', 'account', 'readme', 'pins', 'assets', 'activity', 'badges'], 'whole profile');
  if (input.format && input.format !== WHOLE_PROFILE_FORMAT) throw Error('Unsupported whole-profile version.');
  const composition = input.composition ? validateProfileSpec(input.composition) : makeProfileSpec({}, config);
  const readme = input.readme ?? true;
  if (typeof readme !== 'boolean') throw Error('readme must be boolean.');
  const pins = input.pins ?? [];
  if (!Array.isArray(pins) || pins.length > 6 || new Set(pins.map(x => String(x).toLowerCase())).size !== pins.length)
    throw Error('Choose up to six distinct pins.');
  pins.forEach(repository);
  const assets = input.assets ?? [];
  if (!Array.isArray(assets) || assets.length > 8) throw Error('At most eight assets are supported.');
  const paths = new Set();
  for (const asset of assets) {
    only(asset, ['path', 'content', 'encoding', 'alt', 'rights'], 'asset');
    if (!/^assets\/[a-z\d][a-z\d_.-]{0,95}\.(?:svg|png|jpe?g|gif|webp)$/i.test(asset.path || '') || asset.path.includes('..') || paths.has(asset.path.toLowerCase()))
      throw Error('Assets need distinct safe paths under assets/.');
    paths.add(asset.path.toLowerCase());
    text(asset.alt, 200, 'asset alternative text');
    if (!asset.alt.trim() || !['user-owned', 'permitted-license'].includes(asset.rights)) throw Error('Asset rights and alternative text are required.');
    if (!['utf-8', 'base64'].includes(asset.encoding) || typeof asset.content !== 'string') throw Error('Invalid asset encoding/content.');
    if (asset.encoding === 'base64' && (!/^(?:[a-z\d+/]{4})*(?:[a-z\d+/]{2}==|[a-z\d+/]{3}=)?$/i.test(asset.content))) throw Error('Malformed asset base64.');
    const bytes = Buffer.from(asset.content, asset.encoding === 'utf-8' ? 'utf8' : 'base64');
    if (!bytes.length || bytes.length > 256 * 1024) throw Error('An asset must be 1 byte to 256 KiB.');
    if (/\.svg$/i.test(asset.path) && /<script\b|\bon\w+\s*=|javascript:/i.test(bytes.toString('utf8'))) throw Error('Active SVG content is not supported.');
  }
  // These are separately reviewed legacy plans; no supplied claim is an award.
  for (const key of ['activity', 'badges']) if (input[key] != null && !object(input[key])) throw Error('Invalid ' + key + ' intent.');
  const result = { format: WHOLE_PROFILE_FORMAT, composition, account: validateAccount(input.account), readme,
    pins: [...pins], assets: structuredClone(assets), activity: input.activity ?? null, badges: input.badges ?? null };
  if (Buffer.byteLength(JSON.stringify(result)) > 2 * 1024 * 1024) throw Error('Whole profile exceeds 2 MiB.');
  return result;
}
export function refineWholeProfileSpec(spec, changes) {
  const current = makeWholeProfileSpec(spec);
  only(changes, ['composition', 'account', 'readme', 'pins', 'assets', 'activity', 'badges'], 'refinement');
  return makeWholeProfileSpec({ ...current, ...changes,
    composition:changes.composition===undefined?current.composition:refineProfileSpec(current.composition,changes.composition),
    account: { ...current.account, ...changes.account } });
}
export function readProfileJSON(file, max = 3 * 1024 * 1024) {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > max) throw Error('Expected a bounded regular JSON file.');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file)));
}
const apiOptions = options => ({ ...options, cache: undefined, publicRead: false });
const baseFor = login => '/repos/' + encodeURIComponent(login) + '/' + encodeURIComponent(login);
async function profileHead(login,branch,api){
  const base=baseFor(login);let ref;
  try{ref=await getJSON(base+'/git/ref/heads/'+branch.split('/').map(encodeURIComponent).join('/'),api);}
  catch(error){if(error.status!==409)throw error;}
  if(/^[a-f\d]{40}$/i.test(ref?.object?.sha||''))return ref.object.sha;
  if(ref)throw Error('Cannot inspect the default branch revision.');
  // A missing default branch alone does not mean the repository is empty.
  const branches=await getJSON(base+'/branches?per_page=1',api),tags=await getJSON(base+'/tags?per_page=1',api);
  if(!Array.isArray(branches)||!Array.isArray(tags)||branches.length||tags.length)throw Error('Profile repository has other history or its empty state is unknown.');
  return null;
}
const needsInitialization=plan=>plan.files.length>0&&(plan.createRepository||plan.repository.empty===true);
export async function inspectWholeProfile(username, options = {}) {
  const login = validateLogin(username), api = apiOptions(options);
  const user = options.publicUser||await getJSON('/users/' + encodeURIComponent(login), api);
  if (!user || user.type && user.type !== 'User' || user.login?.toLowerCase() !== login.toLowerCase()) throw Error('Personal account not found.');
  if(options.includeRepository===false)return {format:'gh-aura-profile-snapshot-v1',username:user.login,observedAt:new Date().toISOString(),
    account:Object.fromEntries([...Object.keys(fields),'hireable'].map(k=>[k,normalAccount(user,k)])),
    repository:{exists:false,inspected:false,id:null,branch:'main',head:null},readme:{state:'not-observed',sha:null,content:''},pins:{state:'not-observed'}};
  const repo = await getJSON(baseFor(login), api);
  if (repo && (repo.private !== false || repo.full_name?.toLowerCase() !== (login + '/' + login).toLowerCase())) throw Error('Profile repository must be the public USER/USER repository.');
  const branch = repo?.default_branch || 'main';
  const head=repo?await profileHead(login,branch,api):null;
  const readme = head ? await getJSON(baseFor(login) + '/contents/README.md?ref=' + encodeURIComponent(branch), api) : null;
  if (readme && (readme.type !== 'file' || readme.path !== 'README.md' || !/^[a-f\d]{40}$/i.test(readme.sha || ''))) throw Error('Invalid profile README response.');
  return { format: 'gh-aura-profile-snapshot-v1', username: user.login, observedAt: new Date().toISOString(),
    account: Object.fromEntries([...Object.keys(fields), 'hireable'].map(k => [k, normalAccount(user, k)])),
    repository: { exists: !!repo, inspected:true, id: repo?.id ?? null, branch, head,...(repo&&!head?{empty:true}:{}) },
    readme: { state: readme ? 'observed' : 'absent', sha: readme?.sha ?? null, content: readme ? decodeReadme(readme, 256 * 1024) : '' },
    pins: { state: 'not-observed', instructions: 'Verify the current pinned items on GitHub before changing the selection.' } };
}
export async function prepareProfilePlan(username, spec, markdown, options = {}) {
  const intent = makeWholeProfileSpec(spec);
  if(options.resources&&(!intent.readme||markdown===undefined))throw Error('Resource verification requires a requested README draft.');
  const workspaceActions=await prepareWorkspaceActions(validateLogin(username),intent,options),snapshot = await inspectWholeProfile(username, {...options,
    includeRepository:(intent.readme&&markdown!==undefined)||intent.assets.length>0});
  const delivery = options.delivery || 'pr';
  if (!['pr', 'commit'].includes(delivery)) throw Error('Delivery must be pr or commit.');
  const files = [];
  if (intent.readme && markdown !== undefined) {
    text(markdown, 256 * 1024, 'README');
    if (!markdown.trim() || markdown.split('\n').length > 600) throw Error('README must be nonempty and at most 600 lines.');
    const validation=validateProfileDraft(markdown,intent.composition,{username:snapshot.username});
    if(validation.findings.some(x=>x.severity==='error'))throw Error('Draft does not satisfy the reviewed intent: '+validation.findings.filter(x=>x.severity==='error').map(x=>x.id).join(', ')+'. Run check --spec before planning.');
    if (plain(snapshot.readme.content) !== snapshot.readme.content) throw Error('Existing README contains terminal control characters.');
    if (markdown !== snapshot.readme.content) files.push({ path: 'README.md', encoding: 'utf-8', content: markdown, previous: snapshot.readme.content, before: snapshot.readme.sha,
      after: blobSha(Buffer.from(markdown)) });
  }
  for (const asset of intent.assets) {
    const remote = snapshot.repository.head ? await getJSON(baseFor(snapshot.username) + '/contents/' + asset.path + '?ref=' + encodeURIComponent(snapshot.repository.branch), apiOptions(options)) : null;
    if (remote && (remote.type !== 'file' || remote.path !== asset.path || !/^[a-f\d]{40}$/i.test(remote.sha || ''))) throw Error('Invalid asset state.');
    const after = blobSha(Buffer.from(asset.content, asset.encoding === 'utf-8' ? 'utf8' : 'base64'));
    if (after !== remote?.sha) files.push({ path: asset.path, encoding: asset.encoding, content: asset.content, alt: asset.alt, rights: asset.rights, before: remote?.sha ?? null, after });
  }
  const account = Object.fromEntries(Object.entries(intent.account).filter(([k, v]) => !same(snapshot.account[k], v)));
  const beforeAccount = Object.fromEntries(Object.keys(account).map(k => [k, snapshot.account[k]]));
  const plan = { format: PROFILE_PLAN_FORMAT, username: snapshot.username, createdAt: new Date().toISOString(), delivery,
    composition:intent.composition,
    repository: snapshot.repository, account: { before: beforeAccount, after: account }, files,
    pins: intent.pins, activity: workspaceActions.activity, badges: workspaceActions.badges,
    createRepository: files.length > 0 && !snapshot.repository.exists,
    initialReadme:files.length>0&&(!snapshot.repository.exists||snapshot.repository.empty)?'# '+snapshot.username+'\n':null,
    permissions: [...(files.length ? ['contents:write', ...(delivery === 'pr' ? ['pull_requests:write'] : [])] : []), ...(Object.keys(account).length ? ['profile:write'] : []),...(workspaceActions.activity||workspaceActions.badges?['private-workspace:write']:[])],
    syntheticOperationsAreProfessionalEvidence: false };
  if(options.resources&&intent.readme&&markdown!==undefined)plan.resourceCheck=await checkProfileResources(markdown,{...options,
    baseUrl:profileResourceBase(snapshot.username,snapshot.repository),assets:intent.assets});
  return { ...plan, fingerprint: digest(plan) };
}
export function profileResourceBase(username,repo){
  validateLogin(username);
  return 'https://raw.githubusercontent.com/'+username+'/'+username+'/'+(repo.head||encodeURIComponent(repo.branch||'main'))+'/README.md';
}
export function validateProfilePlan(input) {
  if (!object(input) || input.format !== PROFILE_PLAN_FORMAT) throw Error('Unsupported profile plan.');
  const { fingerprint, ...plan } = input;
  if (!/^[a-f\d]{64}$/.test(fingerprint || '') || digest(plan) !== fingerprint) throw Error('Profile plan fingerprint mismatch.');
  validateLogin(plan.username);
  only(plan, ['format', 'username', 'createdAt', 'delivery', 'composition','resourceCheck','repository', 'account', 'files', 'pins', 'activity', 'badges', 'createRepository', 'initialReadme', 'permissions', 'syntheticOperationsAreProfessionalEvidence'], 'plan');
  if (!['pr', 'commit'].includes(plan.delivery) || !Number.isFinite(Date.parse(plan.createdAt)) || !object(plan.repository) || typeof plan.repository.branch !== 'string' ||
      !/^[a-z\d_./-]+$/i.test(plan.repository.branch) || plan.repository.branch.includes('..') || typeof plan.repository.exists !== 'boolean') throw Error('Invalid profile plan target.');
  if(plan.repository.empty!==undefined&&plan.repository.empty!==true)throw Error('Invalid empty profile state.');
  if(plan.repository.empty&&(!plan.repository.exists||plan.repository.head!==null||!Number.isSafeInteger(plan.repository.id)||plan.repository.id<1))throw Error('Invalid empty profile identity.');
  if (plan.repository.exists && !plan.repository.empty && !/^[a-f\d]{40}$/i.test(plan.repository.head || '')) throw Error('Invalid profile base revision.');
  only(plan.account,['before','after'],'account comparison');
  if(!object(plan.account.before)||!object(plan.account.after)||!Array.isArray(plan.pins)||!Array.isArray(plan.permissions)||plan.permissions.some(x=>!['contents:write','pull_requests:write','profile:write','private-workspace:write'].includes(x)))throw Error('Invalid plan components.');
  validateAccount(plan.account.before); validateAccount(plan.account.after);
  if (!same(Object.keys(plan.account.before).sort(), Object.keys(plan.account.after).sort())) throw Error('Account comparison is incomplete.');
  if (!Array.isArray(plan.files) || plan.files.length > 9 || typeof plan.createRepository !== 'boolean' || plan.createRepository !== (!plan.repository.exists && plan.files.length > 0)) throw Error('Invalid profile files/create plan.');
  if(plan.repository.empty&&plan.files.some(file=>file.before!==null))throw Error('An empty profile cannot have previous file revisions.');
  if(plan.files.length&&plan.repository.inspected===false||plan.initialReadme!==(needsInitialization(plan)?'# '+plan.username+'\n':null))throw Error('Repository creation baseline is not reviewed.');
  const paths = new Set();
  for (const file of plan.files) {
    only(file, ['path', 'encoding', 'content', 'previous', 'alt', 'rights', 'before', 'after'], 'file operation');
    if (paths.has(file.path)) throw Error('Duplicate planned file.');
    paths.add(file.path);
    if (file.path === 'README.md') {
      if (file.encoding !== 'utf-8' || !text(file.content, 256 * 1024, 'README').trim() || file.content.split('\n').length > 600) throw Error('Invalid README operation.');
      text(file.previous, 256 * 1024, 'previous README');
      if (file.before && blobSha(Buffer.from(file.previous)) !== file.before || !file.before && file.previous !== '') throw Error('README comparison changed.');
    } else makeWholeProfileSpec({ readme: false, assets: [{ path: file.path, encoding: file.encoding, content: file.content, alt: file.alt, rights: file.rights }] });
    if (file.before !== null && !/^[a-f\d]{40}$/i.test(file.before || '')) throw Error('Invalid expected file revision.');
    if (blobSha(Buffer.from(file.content, file.encoding === 'utf-8' ? 'utf8' : 'base64')) !== file.after) throw Error('Planned file content changed.');
  }
  makeWholeProfileSpec({ readme: false, pins: plan.pins, activity: plan.activity, badges: plan.badges });
  if(plan.composition){
    validateProfileSpec(plan.composition);
    const readme=plan.files.find(f=>f.path==='README.md');
    if(readme&&validateProfileDraft(readme.content,plan.composition,{username:plan.username}).findings.some(f=>f.severity==='error'))throw Error('Planned README violates its composition requirements.');
  }
  if(plan.resourceCheck&&plan.resourceCheck.format!=='gh-aura-resource-check-v1')throw Error('Invalid planned resource report.');
  validateWorkspaceActions(plan.username,plan);
  if (Buffer.byteLength(JSON.stringify(input)) > 3 * 1024 * 1024) throw Error('Profile plan exceeds 3 MiB.');
  return input;
}
export function previewWholeProfilePlan(input) {
  const plan = validateProfilePlan(input);
  return { format: 'gh-aura-profile-plan-preview-v1', username: plan.username, fingerprint: plan.fingerprint,
    createRepository: plan.createRepository, initializeRepository:needsInitialization(plan), initialReadme:plan.initialReadme, delivery: plan.delivery, account: plan.account,
    files: plan.files.map(f => ({ path: f.path, before: f.before, after: f.after, bytes: Buffer.byteLength(f.content, f.encoding === 'utf-8' ? 'utf8' : 'base64'),
      ...(f.path === 'README.md' ? { diff: diffText(f.previous, f.content) } : { alt: f.alt, rights: f.rights }) })), pins: plan.pins,
    activity: plan.activity, badges: plan.badges,composition:plan.composition,resourceCheck:plan.resourceCheck, permissions: plan.permissions, writesPerformed: 0,
    next: 'The owner/host must independently authorize this exact fingerprint before execution.' };
}
export function saveProfilePlan(file, plan) {
  validateProfilePlan(plan);
  writeFileSync(file, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
export function approvedPlanFromHost(env = process.env) {
  if (!env.GH_AURA_APPROVED_PLAN || !/^[a-f\d]{64}$/.test(env.GH_AURA_APPROVED_FINGERPRINT || '')) throw Error('Owner/host execution grant is not configured.');
  const plan = validateProfilePlan(readProfileJSON(env.GH_AURA_APPROVED_PLAN));
  if (plan.fingerprint !== env.GH_AURA_APPROVED_FINGERPRINT) throw Error('Host-approved plan changed. Request a new owner authorization.');
  return plan;
}
export function profileExecutionStatus(plan,options={}){
  validateProfilePlan(plan);
  const path=join(options.stateDir||process.env.GH_AURA_PROFILE_STATE_DIR||join(homedir(),'.gh-aura','profile-executions'),plan.fingerprint+'.json');
  if(!existsSync(path))return {fingerprint:plan.fingerprint,state:'not-started'};
  const state=readProfileJSON(path);
  if(state.format!=='gh-aura-profile-execution-v1'||state.fingerprint!==plan.fingerprint)throw Error('Invalid execution journal.');
  return {fingerprint:plan.fingerprint,state:state.state||'incomplete',operations:state.operations,
    trust:'Local status is advisory. Applying a reviewed plan verifies actual GitHub state before reporting completion.'};
}
function acquireExecutionLock(lock,fingerprint,scope=fingerprint){
  const recovery=lock+'.recovery';
  const locked=()=>Object.assign(new Error('Profile execution is locked. Inspect '+lock+' and its recorded PID before resuming.'),{code:'PROFILE_LOCKED'});
  if(existsSync(recovery))throw locked();
  let fd;
  try{fd=openSync(lock,'wx',0o600);}
  catch(error){
    if(error.code!=='EEXIST')throw error;
    let guard;
    try{guard=openSync(recovery,'wx',0o600);}catch{throw locked();}
    try{
      const previous=readProfileJSON(lock,2048);
      if((previous.scope||previous.fingerprint)!==scope||previous.hostname!==hostname()||!Number.isInteger(previous.pid)||previous.pid<1)throw locked();
      let dead=false;
      try{process.kill(previous.pid,0);}catch(e){if(e.code==='ESRCH')dead=true;}
      if(!dead)throw locked();
      unlinkSync(lock);
      fd=openSync(lock,'wx',0o600);
    }finally{closeSync(guard);unlinkSync(recovery);}
  }
  try{writeFileSync(fd,JSON.stringify({pid:process.pid,hostname:hostname(),scope,fingerprint,createdAt:new Date().toISOString()}));}
  catch(error){closeSync(fd);unlinkSync(lock);throw error;}
  return fd;
}
function writeExecutionState(stateFile,state){
  const temporary=stateFile+'.'+randomUUID()+'.tmp';
  let fd=openSync(temporary,'wx',0o600);
  try{
    writeFileSync(fd,JSON.stringify(state)+'\n');closeSync(fd);fd=null;
    renameSync(temporary,stateFile);
  }finally{
    if(fd!==null)closeSync(fd);
    try{unlinkSync(temporary);}catch(error){if(error.code!=='ENOENT')throw error;}
  }
}
async function publishFiles(plan, repo, api, onResult) {
  const base = baseFor(plan.username), refPath = base + '/git/ref/heads/' + repo.branch.split('/').map(encodeURIComponent).join('/');
  const branch = 'gh-aura/profile-' + plan.fingerprint.slice(0, 24);
  const targetBranch = plan.delivery === 'pr' ? branch : repo.branch;
  const desired = async (checkedBranch = targetBranch) => {
    for (const file of plan.files) {
      const found = await getJSON(base + '/contents/' + file.path + '?ref=' + encodeURIComponent(checkedBranch), api);
      if (found?.sha !== file.after || found?.path !== file.path || found?.type !== 'file') return false;
    }
    return true;
  };
  if(await desired(repo.branch))return {state:'verified',branch:repo.branch,publication:'default-branch-matches',alreadyMatched:true};
  const existingBranch = plan.delivery === 'pr' ? await getJSON(base + '/git/ref/heads/' + branch, api) : null;
  if (!existingBranch || plan.delivery === 'commit') {
    if (await desired()) return { state: 'verified', branch: targetBranch, alreadyMatched: true };
    const ref = await getJSON(refPath, api);
    if (ref?.object?.sha !== repo.head) throw Error('Profile branch changed; prepare a new plan.');
    for (const file of plan.files) {
      const current = await getJSON(base + '/contents/' + file.path + '?ref=' + encodeURIComponent(repo.branch), api);
      const before=plan.initialReadme&&file.path==='README.md'?repo.seedSha:file.before;
      if ((current?.sha ?? null) !== before) throw Error('A planned file changed; prepare a new plan.');
    }
    const commit = await getJSON(base + '/git/commits/' + repo.head, api);
    if (!/^[a-f\d]{40}$/i.test(commit?.tree?.sha || '')) throw Error('Could not verify the base tree.');
    const tree = [];
    for (const file of plan.files) {
      const blob = await requestJSON(base + '/git/blobs', { ...api, method: 'POST', body: { content: file.content, encoding: file.encoding } });
      if (blob?.sha !== file.after) throw Error('GitHub did not confirm the planned blob.');
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const built = await requestJSON(base + '/git/trees', { ...api, method: 'POST', body: { base_tree: commit.tree.sha, tree } });
    if (!/^[a-f\d]{40}$/i.test(built?.sha || '')) throw Error('GitHub did not confirm the planned tree.');
    const created = await requestJSON(base + '/git/commits', { ...api, method: 'POST', body: { message: 'docs(profile): apply reviewed GH Aura plan', tree: built.sha, parents: [repo.head] } });
    if (!/^[a-f\d]{40}$/i.test(created?.sha || '')) throw Error('GitHub did not confirm the profile commit.');
    if (plan.delivery === 'pr') await requestJSON(base + '/git/refs', { ...api, method: 'POST', body: { ref: 'refs/heads/' + branch, sha: created.sha } });
    else await requestJSON(base + '/git/refs/heads/' + repo.branch.split('/').map(encodeURIComponent).join('/'), { ...api, method: 'PATCH', body: { sha: created.sha, force: false } });
    onResult({ branch: targetBranch, sha: created.sha });
    if (!await desired()) throw Error('Published file revisions could not be verified.');
  } else if (!await desired()) throw Error('Existing review branch differs; it was not overwritten.');
  if (plan.delivery === 'commit') return { state: 'verified', branch: targetBranch };
  const prs = await getJSON(base + '/pulls?' + new URLSearchParams({ state: 'all', head: plan.username + ':' + branch, base: repo.branch, per_page: '100' }), api);
  if (!Array.isArray(prs)) throw Error('Cannot reconcile existing profile PRs.');
  const closed=prs.find(x=>x.state==='closed');
  if(closed)return {state:'needs-user-action',branch,pullRequest:closed.html_url,
    publication:closed.merged_at?'merged-profile-changed':'closed-without-merge',
    next:'This review is terminal. Prepare and independently authorize a new plan; this approval will not reopen it.'};
  const comparison = await getJSON(base + '/compare/' + encodeURIComponent(repo.branch) + '...' + encodeURIComponent(branch), api);
  if (!Array.isArray(comparison?.files) || comparison.files.length !== plan.files.length || comparison.files.some(f => !plan.files.some(p => p.path === f.filename) || !['added', 'modified'].includes(f.status)))
    throw Error('Review branch contains unexpected changes.');
  const pr = prs[0] || await requestJSON(base + '/pulls', { ...api, method: 'POST', body: { title: 'docs(profile): reviewed GitHub profile', head: branch, base: repo.branch,
    body: 'Owner-authorized GH Aura plan ' + plan.fingerprint + '. Review the exact README/assets; this PR is not merged automatically.' } });
  if (!Number.isInteger(pr?.number) || !pr.html_url?.startsWith('https://github.com/' + plan.username + '/' + plan.username + '/pull/')) throw Error('GitHub did not confirm the profile PR.');
  return { state: 'verified', branch, pullRequest: pr.html_url, publication: 'unmerged-review-branch' };
}
async function reviewedSeed(plan,head,api){
  const base=baseFor(plan.username),commit=await getJSON(base+'/git/commits/'+head,api);
  if(!Array.isArray(commit?.parents)||commit.parents.length||!/^[a-f\d]{40}$/i.test(commit.tree?.sha||''))return null;
  const tree=await getJSON(base+'/git/trees/'+commit.tree.sha,api),seedSha=blobSha(Buffer.from(plan.initialReadme));
  if(tree?.truncated!==false||!Array.isArray(tree.tree)||tree.tree.length!==1)return null;
  const file=tree.tree[0];
  return file.path==='README.md'&&file.type==='blob'&&file.mode==='100644'&&file.sha===seedSha?
    {id:plan.repository.id,head,branch:plan.repository.branch,seedSha}:null;
}
async function initializeExistingProfile(plan,state,save,api){
  if(state.operations.initialize?.state==='unknown')throw Error('Profile initialization remains uncertain; inspect before retrying.');
  if(await profileHead(plan.username,plan.repository.branch,api))throw Error('Empty profile repository changed; prepare a new plan.');
  state.operations.initialize={state:'unknown'};save();
  // No SHA: this request can create the reviewed seed but cannot replace a file.
  const result=await requestJSON(baseFor(plan.username)+'/contents/README.md',{...api,method:'PUT',body:{
    message:'docs(profile): initialize reviewed empty profile repository',branch:plan.repository.branch,content:Buffer.from(plan.initialReadme).toString('base64')}});
  const head=await profileHead(plan.username,plan.repository.branch,api);
  const confirmed=head===result?.commit?.sha&&result?.content?.sha===blobSha(Buffer.from(plan.initialReadme))?await reviewedSeed(plan,head,api):null;
  if(!confirmed)throw Error('Profile initialization is uncertain or raced with another writer; inspect before retrying.');
  state.operations.initialize={state:'verified',...confirmed};save();return confirmed;
}
export async function executeProfilePlan(input, approval, options = {}) {
  const plan = validateProfilePlan(input);
  if (approval !== plan.fingerprint) throw Error('Exact owner approval is required.');
  if (!tokenFor(options)) throw Error('Profile execution requires a locally configured GitHub token.');
  const stateDir = options.stateDir || process.env.GH_AURA_PROFILE_STATE_DIR || join(homedir(), '.gh-aura', 'profile-executions');
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const stateFile = join(stateDir, plan.fingerprint + '.json'), lock = stateFile + '.lock';
  const ownerScope='owner:'+plan.username.toLowerCase(),ownerLock=join(stateDir,'owner-'+digest(ownerScope)+'.lock');
  const ownerFd=acquireExecutionLock(ownerLock,plan.fingerprint,ownerScope);
  let fd;
  try{fd=acquireExecutionLock(lock,plan.fingerprint);}catch(error){closeSync(ownerFd);unlinkSync(ownerLock);throw error;}
  let journalValid = false;
  let state = { format: 'gh-aura-profile-execution-v1', fingerprint: plan.fingerprint, operations: {} };
  const save = () => writeExecutionState(stateFile,state);
  let lastMutation = 0;
  const api = apiOptions({ ...options, fetch: async (url, init) => {
    if (init?.method && init.method !== 'GET') {
      const pause = Math.max(0, 1100 - (Date.now() - lastMutation));
      if (pause) await (options.sleep || (ms => new Promise(r => setTimeout(r, ms))))(pause);
      lastMutation = Date.now();
    }
    return (options.fetch || globalThis.fetch)(url, init);
  } });
  try {
    if (existsSync(stateFile)) state = readProfileJSON(stateFile);
    if (state.format!=='gh-aura-profile-execution-v1'||state.fingerprint !== plan.fingerprint || !object(state.operations)) throw Error('Execution journal is invalid.');
    journalValid = true;
    const who = await getJSON('/user', api);
    if (who?.login?.toLowerCase() !== plan.username.toLowerCase()) throw Error('Authenticated account does not own this profile plan.');
    for (const [key, before] of Object.entries(plan.account.before)) {
      const now = normalAccount(who, key);
      if (!same(now, before) && !same(now, plan.account.after[key])) throw Error('Account fields changed; prepare a new plan.');
    }
    const workspacePreflight=await preflightWorkspaceActions(plan,who,api);
    let repo = plan.files.length ? await getJSON(baseFor(plan.username), api) : null;
    if (repo && (repo.private !== false || repo.full_name?.toLowerCase() !== (plan.username + '/' + plan.username).toLowerCase())) throw Error('Profile destination is not the reviewed public repository.');
    if (plan.files.length && !plan.createRepository && (!repo || repo.id !== plan.repository.id || repo.default_branch !== plan.repository.branch)) throw Error('Profile repository identity/branch changed.');
    let emptyBase=null,emptyHead=null;
    if(plan.files.length&&plan.repository.empty){
      emptyHead=await profileHead(plan.username,plan.repository.branch,api);
      if(emptyHead)emptyBase=await reviewedSeed(plan,emptyHead,api);
      if(emptyBase){state.operations.initialize={state:'verified',...emptyBase};save();}
    }
    // The mutable journal is never authority to write into a repository which
    // appeared after review. Only a read-only reconciliation is permitted.
    let reconcileOnly=false;
    if(repo&&(plan.createRepository||plan.repository.empty&&emptyHead&&!emptyBase)){
      reconcileOnly=true;
      let defaultMatches=true;
      for(const file of plan.files){const found=await getJSON(baseFor(plan.username)+'/contents/'+file.path+'?ref='+encodeURIComponent(repo.default_branch),api);if(found?.sha!==file.after)defaultMatches=false;}
      const branch=defaultMatches?repo.default_branch:plan.delivery==='pr'?'gh-aura/profile-'+plan.fingerprint.slice(0,24):repo.default_branch;
      for(const file of plan.files){
        const found=await getJSON(baseFor(plan.username)+'/contents/'+file.path+'?ref='+encodeURIComponent(branch),api);
        if(found?.sha!==file.after)throw Error('Profile repository appeared after planning or its empty state changed; prepare a new plan.');
      }
      if(plan.delivery==='pr'&&!defaultMatches){
        const prs=await getJSON(baseFor(plan.username)+'/pulls?'+new URLSearchParams({state:'all',head:plan.username+':'+branch,base:repo.default_branch,per_page:'100'}),api);
        if(!Array.isArray(prs)||!prs.length)throw Error('Existing profile repository needs a new review before opening a PR.');
        state.operations.files={state:'needs-user-action',branch,pullRequest:prs[0].html_url,publication:prs[0].state==='closed'?'closed-review':'unmerged-review-branch'};
      }else state.operations.files={state:'verified',branch,publication:'default-branch-matches'};
    }
    if (plan.createRepository && !repo) {
      if (state.operations.create?.state === 'unknown') throw Error('Repository creation is uncertain; inspect before retrying.');
      state.operations.create = { state: 'unknown' }; save();
      repo = await requestJSON('/user/repos', { ...api, method: 'POST', body: { name: plan.username, private: false, auto_init: false, description: 'GitHub profile' } });
      if (!Number.isInteger(repo?.id) || repo.private !== false || repo.full_name?.toLowerCase() !== (plan.username + '/' + plan.username).toLowerCase()) throw Error('Repository creation was not confirmed.');
      const initial=await requestJSON(baseFor(plan.username)+'/contents/README.md',{...api,method:'PUT',body:{
        message:'docs(profile): initialize reviewed profile repository',branch:plan.repository.branch,content:Buffer.from(plan.initialReadme).toString('base64')}});
      if(initial?.content?.sha!==blobSha(Buffer.from(plan.initialReadme))||!/^[a-f\d]{40}$/i.test(initial?.commit?.sha||''))throw Error('New repository initialization was not confirmed.');
      state.operations.create = { state: 'verified', id: repo.id, head: initial.commit.sha, branch: plan.repository.branch,
        seedSha:initial.content.sha }; save();
    }
    if(plan.files.length&&plan.repository.empty&&!reconcileOnly&&!emptyBase)emptyBase=await initializeExistingProfile(plan,state,save,api);
    if (plan.files.length&&!reconcileOnly) {
      const base = plan.createRepository ? state.operations.create : emptyBase||plan.repository;
      // A previous uncertain write is reconciled by file/PR reads in publishFiles.
      // Visible mutations are never automatically retried after a network error.
      if (state.operations.files?.state === 'unknown') {
        const branch = plan.delivery === 'pr' ? 'gh-aura/profile-' + plan.fingerprint.slice(0, 24) : base.branch;
        for (const file of plan.files) {
          const found = await getJSON(baseFor(plan.username) + '/contents/' + file.path + '?ref=' + encodeURIComponent(branch), api);
          if (found?.sha !== file.after) throw Error('Publication remains uncertain; inspect before retrying.');
        }
      }
      state.operations.files = { state: 'unknown' }; save();
      state.operations.files = await publishFiles(plan, base, api, result => { state.operations.files = { state: 'unknown', ...result }; save(); }); save();
    }
    if (Object.keys(plan.account.after).length) {
      const current = await getJSON('/user', api);
      const matches = Object.entries(plan.account.after).every(([k, v]) => same(normalAccount(current, k), v));
      if (!matches) {
        if (state.operations.account?.state === 'unknown') throw Error('Account update remains uncertain; inspect before retrying.');
        for (const [k, v] of Object.entries(plan.account.before)) if (!same(normalAccount(current, k), v)) throw Error('Account changed during execution.');
        state.operations.account = { state: 'unknown' }; save();
        await requestJSON('/user', { ...api, method: 'PATCH', body: plan.account.after });
      }
      const after = await getJSON('/user', api);
      if (!Object.entries(plan.account.after).every(([k, v]) => same(normalAccount(after, k), v))) throw Error('Account update could not be verified.');
      state.operations.account = { state: 'verified', fields: Object.keys(plan.account.after) }; save();
    }
    if (plan.pins.length){
      let observed;try{observed=await inspectCurrentPins(plan.username,api);}catch{observed={state:'unknown'};}
      const matches=observed.state==='observed'&&same(observed.items.map(x=>x.name.toLowerCase()),plan.pins.map(x=>x.toLowerCase()));
      state.operations.pins = { state:matches?'verified':'needs-user-action', repositories: plan.pins,observation:observed,
        url: 'https://github.com/' + plan.username, instructions: 'Customize your pins, select these repositories in order, save, then verify on your public profile.' };
    }
    const workspaceResult=await executeWorkspaceActions(plan,state,save,{...api,workspacePreflight});
    delete state.error;
    state.state=state.operations.pins?.state==='needs-user-action'||state.operations.files?.state==='needs-user-action'||state.operations.files?.pullRequest||workspaceResult.pending?'needs-user-action':'verified';save();
    return { ...state, journal: stateFile };
  } catch (error) {
    state.error = plain(error.message).slice(0, 400);state.state='incomplete'; if(journalValid)save();
    throw Object.assign(new Error(state.error), { code: 'PROFILE_EXECUTION_INCOMPLETE', journal: stateFile });
  } finally {
    try{closeSync(fd);unlinkSync(lock);}finally{closeSync(ownerFd);unlinkSync(ownerLock);}
  }
}

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAX_BATCH=16;
const idOf=index=>{
  if(!Number.isInteger(index)||index<1||index>1024)
    throw Error('Badge batch exercise index must be 1..1024.');
  return String(index).padStart(4,'0');
};
export const badgeExerciseRef=index=>'refs/heads/gh-aura/badge-'+idOf(index);
const data=text=>'data '+Buffer.byteLength(text,'utf8')+'\n'+text+'\n';

/** Build separate, clearly labeled commits sharing one authenticated default-branch parent. */
export function fastImportBadgeBranches(baseSha,entries,authorSeconds) {
  if(!/^[a-f0-9]{40}$/i.test(baseSha||''))
    throw Error('Cannot stage PR branches without a verified Git SHA.');
  if(!Array.isArray(entries)||!entries.length||entries.length>MAX_BATCH)
    throw Error('Atomic badge staging requires 1..16 exercises.');
  if(!Number.isSafeInteger(authorSeconds)||authorSeconds<=0)
    throw Error('Invalid badge staging clock.');
  const used=new Set();
  let stream='';
  for(const entry of entries) {
    const index=entry?.index,ref=badgeExerciseRef(index);
    if(used.has(ref)||typeof entry.text!=='string'||!entry.text.includes('synthetic exercise')||
       Buffer.byteLength(entry.text,'utf8')>16*1024)
      throw Error('Duplicate, oversized or unmarked private exercise.');
    used.add(ref);
    const name=idOf(index);
    const author='GH Aura Synthetic Exercise <gh-aura-sandbox@invalid.example> '+
      authorSeconds+' +0000';
    stream+='commit '+ref+'\n';
    stream+='author '+author+'\ncommitter '+author+'\n';
    stream+=data('docs(sandbox): add generated exercise '+name);
    stream+='from '+baseSha+'\n';
    stream+='M 100644 inline docs/gh-aura/exercise-'+name+'.md\n';
    stream+=data(entry.text)+'\n';
  }
  return Buffer.from(stream,'utf8');
}

function git(args,opts={}) {
  const result=spawnSync('git',args,{
    cwd:opts.cwd,input:opts.input,env:opts.env||process.env,
    encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024,
    windowsHide:true,stdio:['pipe','pipe','pipe'],
  });
  if(result.error||result.status!==0)
    throw Error('Private workspace Git '+args[0]+
      ' failed; branches may exist remotely. Inspect the workspace before retrying. No force-update fallback.');
  return String(result.stdout).trim();
}
function parseRefs(output) {
  const refs=new Map();
  if(!output.trim())return refs;
  for(const line of output.trim().split(/\r?\n/u)){
    const parts=line.split(/\s+/u);
    if(parts.length!==2||!/^[a-f0-9]{40}$/i.test(parts[0])||
       !/^refs\/heads\/gh-aura\/badge-\d{4}$/.test(parts[1]))
      throw Error('Unexpected remote Git refs; refusing private workspace staging.');
    refs.set(parts[1],parts[0].toLowerCase());
  }
  return refs;
}

/**
 * One atomic create-only Git push for up to 16 reviewed private exercise refs.
 * No writes to the default branch, no force updates to existing branches, no
 * secrets in command arguments / config / output, and no mutation on a failed
 * parent-SHA or existing-branch preflight.
 * reservePush(count) is called before the remote push and is fail-closed.
 */
export async function stageBadgeBranches(opts={}) {
  const {baseSha,branch,repo,token,entries}=opts;
  if(!/^[a-f0-9]{40}$/i.test(baseSha||'')||
    typeof branch!=='string'||!/^[a-z\d][a-z\d._-]{0,79}$/i.test(branch)||
    branch.includes('..')||branch.endsWith('.lock')||
    typeof repo!=='string'||!/^[a-z\d][a-z\d-]{0,38}\/[a-z\d][a-z\d._-]{0,79}$/i.test(repo)||
    repo.includes('..')||repo.endsWith('.git')||
    typeof token!=='string'||!token)
    throw Error('Invalid owned private workspace staging identity.');
  const seconds=opts.nowSeconds??Math.floor(Date.now()/1000);
  const stream=fastImportBadgeBranches(baseSha,entries,seconds);
  const names=entries.map(e=>badgeExerciseRef(e.index));
  const remote=opts.testRemote||'https://github.com/'+repo+'.git';
  const dir=mkdtempSync(join(tmpdir(),'gh-aura-badges-bulk-'));
  const run=opts.gitRunner||git;
  const authorization='AUTHORIZATION: basic '+
    Buffer.from('x-access-token:'+token).toString('base64');
  const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',
    GIT_CONFIG_GLOBAL:join(dir,'empty-global-config'),
    GIT_CONFIG_COUNT:'2',
    GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0:authorization,
    GIT_CONFIG_KEY_1:'credential.helper',GIT_CONFIG_VALUE_1:''};
  const runGit=(args,input)=>run(args,{cwd:dir,env,input});
  try {
    runGit(['init','--quiet','--initial-branch=main']);
    runGit(['fetch','--quiet','--no-tags',remote,'refs/heads/'+branch]);
    if(runGit(['rev-parse','FETCH_HEAD']).toLowerCase()!==baseSha.toLowerCase())
      throw Error('Default branch changed during batch preparation. No push attempted.');
    const already=parseRefs(runGit(['ls-remote','--heads',remote,...names]));
    if(names.some(ref=>already.has(ref)))
      throw Error('An exercise branch already exists. Inspect the workspace; no branches were overwritten.');
    runGit(['fast-import','--quiet'],stream);
    const expected=new Map(names.map(ref=>[ref,
      runGit(['rev-parse',ref]).toLowerCase()]));
    if(typeof opts.reservePush!=='function')
      throw Error('Atomic branch push requires a write budget reservation.');
    // Conservatively account for every branch creation as a potential
    // content-writing unit. GitHub may count Git pushes differently.
    await opts.reservePush(names.length);
    // --atomic: no partial ref updates. Empty expected --force-with-lease
    // refuses any unexpected existing ref, even if the same branch could
    // otherwise be fast-forwarded. This NEVER overwrites an existing ref.
    runGit(['push','--atomic','--quiet',
      ...names.map(ref=>'--force-with-lease='+ref+':'),remote,
      ...names.map(ref=>ref+':'+ref)]);
    const confirmed=parseRefs(runGit(['ls-remote','--heads',remote,...names]));
    for(const ref of names)if(confirmed.get(ref)!==expected.get(ref))
      throw Error('Remote branch SHA could not be verified after atomic push; inspect GitHub before PR creation.');
    const shaByIndex=new Map(entries.map(entry=>[
      entry.index,expected.get(badgeExerciseRef(entry.index))
    ]));
    return {shaByIndex,gitPushes:1,prepared:entries.length,
      reservedRefUnits:entries.length,atomic:true};
  } finally {rmSync(dir,{recursive:true,force:true});}
}

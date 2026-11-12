import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  mkdirSync, rmdirSync, readFileSync, writeFileSync, renameSync,
  rmSync, existsSync, lstatSync,
} from 'node:fs';

// This is a *local* reservation ledger, NOT GitHub's authoritative quota.
// It deliberately leaves some room under GitHub's general 500 content-writes
// per hour limit. Other clients / machines / GitHub heuristics remain unknown.
export const BADGE_WRITE_HOURLY_BUDGET = 480;
export const BADGE_WRITE_WINDOW_MS = 60 * 60 * 1000;

function safeDirectory(path) {
  if(existsSync(path)) {
    const stat=lstatSync(path);
    if(!stat.isDirectory()||stat.isSymbolicLink())
      throw Error('GH Aura write budget storage must be a real directory, not a symlink.');
  } else mkdirSync(path,{recursive:true,mode:0o700});
}

/**
 * Reserve one remote mutative request BEFORE calling GitHub. A failed or
 * uncertain write remains reserved: retrying could create duplicate work.
 * A directory lock serializes different CLI instances sharing the same HOME.
 */
export function reserveBadgeWrite(owner,opts={}) {
  if(typeof owner!=='string'||!/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(owner))
    throw Error('Badge write budget requires a verified GitHub owner.');
  const now=opts.now??Date.now();
  if(!Number.isSafeInteger(now)||now<0)
    throw Error('Invalid badge write budget timestamp.');
  const maxWrites=opts.maxWrites??BADGE_WRITE_HOURLY_BUDGET;
  if(!Number.isInteger(maxWrites)||maxWrites<1||maxWrites>BADGE_WRITE_HOURLY_BUDGET)
    throw Error('Invalid hourly write budget.');
  const directory=opts.directory||join(homedir(),'.cache','gh-aura','badge-write-budget');
  safeDirectory(directory);
  const id=createHash('sha256').update(owner.toLowerCase()).digest('hex').slice(0,28);
  const file=join(directory,id+'.json');
  const lock=join(directory,id+'.lock');
  try {mkdirSync(lock,{mode:0o700});}
  catch(error) {
    if(error?.code==='EEXIST')
      throw Error('Another GH Aura badge run is reserving writes for this account. Avoid concurrent runs.');
    throw error;
  }
  try {
    let entries=[];
    if(existsSync(file)) {
      let data;
      try {data=JSON.parse(readFileSync(file,'utf8'));}
      catch {throw Error('Cannot verify local badge write budget. No GitHub write will be attempted.');}
      if(data?.format!=='gh-aura-write-budget-v1'||!Array.isArray(data.timestamps)||
        data.timestamps.length>10000||
        !data.timestamps.every(t=>Number.isSafeInteger(t)&&t>=0&&t<=now+300000))
        throw Error('Invalid or inconsistent local badge write budget. No GitHub write will be attempted.');
      entries=data.timestamps;
    }
    const since=now-BADGE_WRITE_WINDOW_MS;
    entries=entries.filter(t=>t>since);
    if(entries.length>=maxWrites) {
      const until=Math.max(1,Math.ceil((entries[0]+BADGE_WRITE_WINDOW_MS-now)/60000));
      throw Error('Local badge write safety budget exhausted ('+maxWrites+
        ' writes/hour). Retry the reviewed operation after at least '+until+
        ' minute(s). Other GitHub clients may consume additional quota.');
    }
    entries.push(now);
    const temp=join(directory,id+'.'+process.pid+'.'+randomUUID()+'.tmp');
    try {
      writeFileSync(temp,JSON.stringify({format:'gh-aura-write-budget-v1',
        timestamps:entries})+'\n',{flag:'wx',mode:0o600});
      renameSync(temp,file);
    } finally {rmSync(temp,{force:true});}
    return {remaining:maxWrites-entries.length,
      nextWindowAfter:entries[0]+BADGE_WRITE_WINDOW_MS,
      localOnly:true};
  } finally {rmdirSync(lock);}
}

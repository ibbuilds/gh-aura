import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requestJSON, getJSON, decodeReadme, tokenFor, validateLogin } from './github.mjs';
import { workspaceRepo, managedWorkspaceReadme, WORKSPACE_README } from './workspace.mjs';
import { loadCalendarPlan } from './calendar.mjs';
import { createHash } from 'node:crypto';

const LIMIT=2500;
export function calendarPracticeFiles(plan){
  return plan.days.flatMap(d=>Array.from({length:d.count},(_,i)=>{
    const date=d.date,index=(d.startIndex||1)+i,path='practice/'+date.slice(0,4)+'/'+date.slice(5,7)+'/'+date.slice(8)+'-'+index+'.md';
    const content='# Generated practice session\n\nDate label: '+date+'\nFocus: '+plan.settings.role+'\nSession: '+index+'\n\n'+
      'This is synthetic practice activity created by GH Aura. It is not independently verified historical software work.\n';
    return {date,index,path,content,sha:createHash('sha1').update('blob '+Buffer.byteLength(content)+'\0').update(content).digest('hex')};
  }));
}
function section(text){return 'data '+Buffer.byteLength(text,'utf8')+'\n'+text+'\n';}
export function validCalendarIdentity(name,email) {
  if(typeof name!=='string'||!name.trim()||name.length>80||/[\x00-\x1f<>]/.test(name))
    throw Error('--author-name must be printable text of 1-80 characters.');
  if(typeof email!=='string'||email.length>254||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||/[\x00-\x1f]/.test(email))
    throw Error('--author-email must be an actual email associated with your GitHub account.');
}
/**
 * Refuse attribution to an unrelated or unverified identity before remote writes.
 * Private email lists are never logged, cached or saved in review artifacts.
 */
export async function verifyAuthorEmail(email,identity,opts={}) {
  const login=validateLogin(identity?.login);
  const target=email.toLowerCase();
  const id=identity?.id;
  if(Number.isSafeInteger(id)&&id>0&&
     target===(id+'+'+login+'@users.noreply.github.com').toLowerCase())return;
  for(let page=1;page<=5;page++) {
    let emails;
    try {
      emails=await getJSON('/user/emails?per_page=100&page='+page,{
        ...opts,publicRead:false,cache:undefined,allowMissing:false
      });
    } catch(error) {
      if([401,403,404].includes(error?.status))
        throw Error('Cannot verify --author-email. Grant Email addresses (read) / user:email on the token, or use your ID-based GitHub noreply address.');
      throw error;
    }
    if(!Array.isArray(emails))throw Error('GitHub did not return a verifiable author email list.');
    if(emails.some(item=>item?.verified===true&&typeof item.email==='string'&&
       item.email.toLowerCase()===target))return;
    if(emails.length<100)break;
  }
  throw Error('--author-email is not verified for the authenticated GitHub account. No repository was created.');
}

export function fastImportCalendar(plan,authorName,authorEmail,options={}) {
  validCalendarIdentity(authorName,authorEmail);
  const branch=options.branch||'main';
  if(!/^[a-z\d][a-z\d._-]{0,79}$/i.test(branch) || branch.includes('..') || branch.endsWith('.lock'))
    throw Error('Unsupported private workspace default branch.');
  if(options.baseSha && !/^[a-f0-9]{40}$/i.test(options.baseSha))
    throw Error('Invalid workspace base commit.');
  const entries=calendarPracticeFiles(plan);
  if(entries.length>LIMIT||!entries.length)throw Error('Calendar plan must have between 1 and 2500 commits.');
  const name=authorName.trim();
  let payload='',n=0,previous=null;
  for(const entry of entries) {
    const date=entry.date;
    const seconds=Math.floor(Date.parse(date+'T12:00:00Z')/1000)+
      (entry.index*181);
    const tz=seconds+' +0000';
    const file=entry.path;
    const message='chore(practice): generated '+date+' session '+entry.index;
    const text=entry.content;
    n++;
    payload+='commit refs/heads/'+branch+'\nmark :'+n+'\nauthor '+name+' <'+authorEmail+'> '+tz+
      '\ncommitter '+name+' <'+authorEmail+'> '+tz+'\n'+section(message);
    if(previous!==null)payload+='from :'+previous+'\n';
    else if(options.baseSha)payload+='from '+options.baseSha+'\n';
    payload+='M 100644 inline '+file+'\n'+section(text);
    if(n===1 && options.initializeWorkspace)
      payload+='M 100644 inline README.md\n'+section(WORKSPACE_README);
    payload+='\n';
    previous=n;
  }
  return Buffer.from(payload,'utf8');
}
function git(args,opts={}) {
  const result=spawnSync('git',args,{
    cwd:opts.cwd,input:opts.input,env:opts.env||process.env,
    encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024,
    windowsHide:true,stdio:['pipe','pipe','pipe'],
  });
  if(result.error||result.status!==0){
    // Never echo credentials, GitHub token or Git remote URL from arbitrary subprocess output.
    throw Error('Git operation failed ('+args[0]+'). Repository state may be incomplete; inspect GitHub before retrying.');
  }
  return String(result.stdout).trim();
}
export async function applyCalendar(plan,opts={}) {
  if(!plan||plan.format!=='gh-aura-synthetic-calendar-v1'||!plan.fingerprint)
    throw Error('Invalid approved activity plan.');
  if(!/^[a-f0-9]{64}$/.test(opts.confirm||'')||opts.confirm!==plan.fingerprint)
    throw Error('Activity plan fingerprint mismatch. Review the JSON plan and pass --confirm FINGERPRINT.');
  validCalendarIdentity(opts.authorName,opts.authorEmail);
  const selected=workspaceRepo(opts.repo);
  const token=tokenFor(opts);
  if(!token)throw Error('A GH_TOKEN/GITHUB_TOKEN with private repository creation/Contents write permission is required.');
  const auth={...opts,publicRead:false,cache:undefined};
  const identity=await getJSON('/user',auth);
  const owner=validateLogin(identity?.login);
  const [givenOwner,name]=selected.split('/');
  if(givenOwner.toLowerCase()!==owner.toLowerCase())
    throw Error('Activity may only use a private repository owned by the authenticated account.');
  await verifyAuthorEmail(opts.authorEmail,identity,opts);
  const start=Date.parse(plan.settings.from+'T00:00:00Z');
  const joined=Date.parse(identity.created_at||'');
  if(!Number.isFinite(joined))
    throw Error('Could not verify the GitHub account creation date. No repository was created.');
  if(start<joined-86400000)
    throw Error('The selected dates precede this GitHub account. Choose an account-lifetime interval.');

  const base='/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(name);
  const remote='https://github.com/'+owner+'/'+name+'.git';
  const existing=await getJSON(base,auth);
  let targetBranch='main',remoteSha=null;
  if(existing) {
    if(existing.private!==true||existing.fork===true||existing.archived===true||
       existing.full_name?.toLowerCase()!==selected.toLowerCase()||
       typeof existing.default_branch!=='string')
      throw Error('Refusing non-owned, public, archived or forked workspace. No writes performed.');
    targetBranch=existing.default_branch;
    if(!/^[a-z\d][a-z\d._-]{0,79}$/i.test(targetBranch)||targetBranch.includes('..')||targetBranch.endsWith('.lock'))
      throw Error('Unsupported private workspace branch. No writes performed.');
    const readme=await getJSON(base+'/contents/README.md?ref='+encodeURIComponent(targetBranch),auth);
    if(!readme||readme.type!=='file'||!managedWorkspaceReadme(decodeReadme(readme)))
      throw Error('Existing repository lacks the GH Aura private workspace marker; refusing to modify it.');
    const ref=await getJSON(base+'/git/ref/heads/'+encodeURIComponent(targetBranch),auth);
    if(!/^[a-f0-9]{40}$/i.test(ref?.object?.sha||''))
      throw Error('Could not verify current private workspace revision.');
    remoteSha=ref.object.sha;
    const tree=await getJSON(base+'/git/trees/'+encodeURIComponent(targetBranch)+'?recursive=1',auth);
    if(!tree||tree.truncated!==false||!Array.isArray(tree.tree))
      throw Error('Cannot inspect the complete private workspace tree; no writes performed.');
    const paths=new Set(tree.tree.map(item=>item.path));
    const collisions=plan.days.flatMap(d=>Array.from({length:d.count},(_,i)=>
      'practice/'+d.date.slice(0,4)+'/'+d.date.slice(5,7)+'/'+d.date.slice(8)+'-'+((d.startIndex||1)+i)+'.md'))
      .filter(path=>paths.has(path));
    if(collisions.length)
      throw Error('Practice dates already exist in this workspace ('+collisions.length+' paths). Use a non-overlapping plan; no files were overwritten.');
  }

  // Build and verify all new commits before writing to GitHub. Existing work
  // is fetched and used as an immutable parent; the final push never forces.
  const temp=mkdtempSync(join(tmpdir(),'gh-aura-activity-'));
  const runGit=opts.gitRunner||git;
  let created=false;
  try {
    const authorization='AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64');
    const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',
      GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0:authorization,GIT_CONFIG_KEY_1:'credential.helper',
      GIT_CONFIG_VALUE_1:''};
    runGit(['init','--quiet','--initial-branch=main'],{cwd:temp});
    let parent=null;
    if(existing) {
      runGit(['fetch','--quiet','--no-tags',remote,'refs/heads/'+targetBranch],{cwd:temp,env});
      parent=runGit(['rev-parse','FETCH_HEAD'],{cwd:temp});
      if(parent!==remoteSha)
        throw Error('Workspace changed while loading its history. No push attempted; regenerate the plan.');
    }
    const stream=fastImportCalendar(plan,opts.authorName,opts.authorEmail,{
      baseSha:parent,branch:targetBranch,initializeWorkspace:!existing
    });
    runGit(['fast-import','--quiet'],{cwd:temp,input:stream});
    const count=Number(runGit(['rev-list','--count',...(parent?[parent+'..'+targetBranch]:[targetBranch])],{cwd:temp}));
    if(count!==plan.summary.syntheticCommits)
      throw Error('Generated commits did not match the approved activity plan.');
    if(!existing) {
      const repository=await requestJSON('/user/repos',{
        ...auth,method:'POST',
        body:{name,description:'GH Aura managed private workspace (synthetic practice)',
          private:true,auto_init:false,has_issues:true,has_wiki:false,has_projects:false}
      });
      if(repository?.private!==true||repository?.full_name?.toLowerCase()!==selected.toLowerCase())
        throw Error('GitHub did not confirm the expected private workspace. Inspect before retrying.');
      created=true;
    }
    runGit(['push','--quiet',remote,
      'refs/heads/'+targetBranch+':refs/heads/'+targetBranch],{cwd:temp,env});
    return {status:'pushed-unverified-graph',repository:'https://github.com/'+owner+'/'+name,
      private:true,workspaceReused:!!existing,requestedCommits:count,
      period:plan.settings.from+'..'+plan.settings.to,
      note:'Synthetic practice only. No existing work was rewritten; GitHub decides contribution attribution and private visibility.'};
  } catch(error) {
    if(created)
      throw Error(error.message+' A private workspace may now exist; inspect before retrying. Never force-push.');
    throw error;
  } finally {rmSync(temp,{recursive:true,force:true});}
}
export async function runCalendar(command,opts={}) {
  if(command==='plan') {
    const { runCalendarPlan }=await import('./calendar.mjs');
    return runCalendarPlan(opts);
  }
  if(command==='preview'){
    const {previewCalendar}=await import('./calendar-preview.mjs'),{emit}=await import('./output.mjs');
    const result=previewCalendar(loadCalendarPlan(opts.review),{year:opts.year,svg:opts.svg});
    emit(opts.svg?result.svg:result,opts);return result;
  }
  if(command!=='apply')throw Error('Use calendar plan or calendar apply.');
  const plan=loadCalendarPlan(opts.review);
  const result=await applyCalendar(plan,{repo:opts.repo,
    confirm:opts.confirm,authorName:opts['author-name'],authorEmail:opts['author-email']});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result;
}

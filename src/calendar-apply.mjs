import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requestJSON, getJSON, tokenFor, validateLogin } from './github.mjs';
import { loadCalendarPlan } from './calendar.mjs';

const LIMIT=2500;
function section(text){return 'data '+Buffer.byteLength(text,'utf8')+'\n'+text+'\n';}
function validIdentity(name,email) {
  if(typeof name!=='string'||!name.trim()||name.length>80||/[\x00-\x1f<>]/.test(name))
    throw Error('--author-name must be printable text of 1-80 characters.');
  if(typeof email!=='string'||email.length>254||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||/[\x00-\x1f]/.test(email))
    throw Error('--author-email must be an actual email associated with your GitHub account.');
}
export function fastImportCalendar(plan,authorName,authorEmail) {
  validIdentity(authorName,authorEmail);
  const entries=plan.days.flatMap(d=>Array.from({length:d.count},(_,i)=>({date:d.date,index:i+1})));
  if(entries.length>LIMIT||!entries.length)throw Error('Calendar plan must have between 1 and 2500 commits.');
  const name=authorName.trim();
  let payload='',n=0,previous=null;
  for(const entry of entries) {
    const date=entry.date;
    const seconds=Math.floor(Date.parse(date+'T12:00:00Z')/1000)+
      (entry.index*181);
    const tz=seconds+' +0000';
    const file='practice/'+date.slice(0,4)+'/'+date.slice(5,7)+'/'+date.slice(8)+'-'+entry.index+'.md';
    const message='chore(practice): generated '+date+' session '+entry.index;
    const text='# Generated practice session\n\n'+
      'Date label: '+date+'\n'+
      'Focus: '+plan.settings.role+'\n'+
      'Session: '+entry.index+'\n\n'+
      'This is synthetic practice activity created by GH Aura. '+
      'It is not independently verified historical software work.\n';
    n++;
    payload+='commit refs/heads/main\nmark :'+n+'\nauthor '+name+' <'+authorEmail+'> '+tz+
      '\ncommitter '+name+' <'+authorEmail+'> '+tz+'\n'+section(message);
    if(previous!==null)payload+='from :'+previous+'\n';
    payload+='M 100644 inline '+file+'\n'+section(text)+'\n';
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
    throw Error('Invalid approved calendar plan.');
  if(!/^[a-f0-9]{64}$/.test(opts.confirm||'')||opts.confirm!==plan.fingerprint)
    throw Error('Calendar fingerprint mismatch. Review the JSON plan and pass --confirm FINGERPRINT.');
  validIdentity(opts.authorName,opts.authorEmail);
  if(typeof opts.repo!=='string'||!/^[a-z\d](?:[a-z\d-]*[a-z\d])?\/[a-z\d][\w.-]{0,79}$/i.test(opts.repo)
     ||opts.repo.includes('..')||opts.repo.endsWith('.git'))
    throw Error('--repo must be OWNER/NEW_PRIVATE_REPO.');
  const token=tokenFor(opts);
  if(!token)throw Error('A GH_TOKEN/GITHUB_TOKEN with private repository creation permission is required.');
  const identity=await getJSON('/user',{...opts,publicRead:false,cache:undefined});
  const owner=validateLogin(identity?.login);
  const [givenOwner,name]=opts.repo.split('/');
  if(givenOwner.toLowerCase()!==owner.toLowerCase())
    throw Error('Calendar generation may create only a new private repository owned by the authenticated account.');
  const start=Date.parse(plan.settings.from+'T00:00:00Z');
  const joined=Date.parse(identity.created_at||'');
  if(Number.isFinite(joined)&&start<joined-86400000)
    throw Error('The selected dates precede this GitHub account. Choose an account-lifetime interval.');
  const base='/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(name);
  const existing=await getJSON(base,{...opts,publicRead:false,cache:undefined});
  if(existing)throw Error('Repository already exists. Use a fresh name; GH Aura never overwrites existing history.');
  // Build and verify the full local series before creating anything on GitHub.
  const temp=mkdtempSync(join(tmpdir(),'gh-aura-calendar-'));
  const runGit=opts.gitRunner||git;
  let created=false;
  try {
    const stream=fastImportCalendar(plan,opts.authorName,opts.authorEmail);
    runGit(['init','--quiet','--initial-branch=main'],{cwd:temp});
    runGit(['fast-import','--quiet'],{cwd:temp,input:stream});
    const count=Number(runGit(['rev-list','--count','main'],{cwd:temp}));
    if(count!==plan.summary.syntheticCommits)throw Error('Generated commit count did not match the approved plan.');
    const repository=await requestJSON('/user/repos',{
      ...opts,method:'POST',cache:undefined,publicRead:false,
      body:{name,description:'GH Aura generated practice timeline (synthetic)',private:true,
        auto_init:false,has_issues:false,has_wiki:false,has_projects:false}
    });
    if(repository?.private!==true||repository?.full_name?.toLowerCase()!==opts.repo.toLowerCase())
      throw Error('GitHub did not confirm the expected private repository. Inspect before retrying.');
    created=true;
    const authorization='AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64');
    const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',
      GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0:authorization,GIT_CONFIG_KEY_1:'credential.helper',
      GIT_CONFIG_VALUE_1:''};
    // No token is added to command-line arguments, Git config, remote URL or saved files.
    runGit(['push','--quiet','https://github.com/'+owner+'/'+name+'.git',
      'refs/heads/main:refs/heads/main'],{cwd:temp,env});
    return {status:'pushed-unverified-graph',repository:'https://github.com/'+owner+'/'+name,
      private:true,requestedCommits:count,period:plan.settings.from+'..'+plan.settings.to,
      note:'Synthetic practice commits pushed. GitHub alone decides attribution; check the profile after indexing. Enable Private contributions in GitHub profile settings.'};
  } catch(error) {
    if(created)throw Error(error.message+' A private repository may now exist; inspect it before retrying. Never force-push.');
    throw error;
  } finally {rmSync(temp,{recursive:true,force:true});}
}
export async function runCalendar(command,opts={}) {
  if(command==='plan') {
    const { runCalendarPlan }=await import('./calendar.mjs');
    return runCalendarPlan(opts);
  }
  if(command!=='apply')throw Error('Use calendar plan or calendar apply.');
  const plan=loadCalendarPlan(opts.review);
  const result=await applyCalendar(plan,{repo:opts.repo,
    confirm:opts.confirm,authorName:opts['author-name'],authorEmail:opts['author-email']});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result;
}

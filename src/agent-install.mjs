import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source=fileURLToPath(new URL('../skills/gh-aura-profile/',import.meta.url));
export function installAgentSkill({client='codex',directory,force=false,home=homedir()}={}){
  if(!['codex','claude','generic'].includes(client)||client==='generic'&&!directory)throw Error('Choose codex, claude or generic with an explicit directory.');
  const root=resolve(directory||join(home,client==='codex'?'.agents':'.claude','skills'));
  const destination=join(root,'gh-aura-profile');
  const boundary=directory?root:resolve(home);
  const safeParents=target=>{
    for(let parent=dirname(target);;parent=dirname(parent)){
      if(existsSync(parent)&&(!lstatSync(parent).isDirectory()||lstatSync(parent).isSymbolicLink()))throw Error('Skill parent must be a real directory, without symbolic links.');
      // The selected root/home is the trust boundary. macOS /var and some
      // system temp directories legitimately resolve through OS-owned links.
      if(parent===boundary||dirname(parent)===parent)break;
    }
  };
  safeParents(destination);
  if(existsSync(destination)&&(!lstatSync(destination).isDirectory()||lstatSync(destination).isSymbolicLink()))throw Error('Skill destination must be a real directory.');
  const files=[];
  const walk=(base,relative='')=>{for(const entry of readdirSync(base,{withFileTypes:true})){
    const path=join(base,entry.name),name=join(relative,entry.name),stat=lstatSync(path);
    if(stat.isSymbolicLink())throw Error('Packaged skill links are not installed.');
    if(stat.isDirectory())walk(path,name);else if(stat.isFile())files.push({name,content:readFileSync(path)});
  }};
  walk(source);
  for(const file of files){const target=join(destination,file.name);safeParents(target);if(existsSync(target)){
    const stat=lstatSync(target);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Existing skill item is not a safe regular file.');
    if(!readFileSync(target).equals(file.content)&&!force)throw Error('Skill differs locally; inspect it and explicitly use --force with --directory to replace it.');
  }}
  let changed=0;
  for(const file of files){const target=join(destination,file.name);if(existsSync(target)&&readFileSync(target).equals(file.content))continue;
    mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,file.content,{flag:existsSync(target)?'w':'wx',mode:0o600});changed++;
  }
  return {format:'gh-aura-skill-install-v1',client,directory:destination,files:files.map(x=>x.name),changed,
    activation:'Ask your agent to improve a GitHub profile, or explicitly select gh-aura-profile. Restart/rescan if the host does not discover the installed skill.',
    mcp:{command:'gh-aura',args:['mcp']},hostConfigurationChanged:false,
    documentation:client==='codex'?'https://developers.openai.com/codex/skills':'https://agentskills.io/integrate-skills'};
}
export function agentDoctor(){
  const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
  const git=spawnSync('git',['--version'],{encoding:'utf8',windowsHide:true,timeout:5000});
  return {format:'gh-aura-agent-diagnostics-v1',version,node:process.version,nodeSupported:Number(process.versions.node.split('.')[0])>=22,
    gitAvailable:git.status===0,skillPackaged:existsSync(join(source,'SKILL.md')),
    executionGrantConfigured:!!process.env.GH_AURA_APPROVED_PLAN&&!!process.env.GH_AURA_APPROVED_FINGERPRINT,
    credentialConfigured:!!(process.env.GH_TOKEN||process.env.GITHUB_TOKEN),
    limits:'Local setup diagnostics only; token permissions, live accounts and client activation are checked separately.'};
}

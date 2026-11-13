// Export research OUTSIDE the product tree. Never edit the original checkpoint.
import { mkdtempSync,readFileSync,writeFileSync,rmSync,realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname,join,resolve,relative,isAbsolute,sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { RESEARCH_CHECKPOINT,RESEARCH_EXPORT_PATHS,correctVisualCollector } from './research-corrections.mjs';

export function prepareResearchWorkspace(){
  const root=realpathSync(fileURLToPath(new URL('../',import.meta.url))),scratchRoot=realpathSync(tmpdir()),location=relative(root,scratchRoot);
  if(!isAbsolute(location)&&location.split(sep)[0]!=='..')throw Error('Research temporary storage must be outside the product checkout.');
  const run=(cmd,args)=>{
    const result=spawnSync(cmd,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
    if(result.status!==0||result.error)throw Error('Research export failed: '+(result.error?.message||result.stderr||cmd));
  };
  run('git',['cat-file','-e',RESEARCH_CHECKPOINT+'^{commit}']);
  const directory=mkdtempSync(join(scratchRoot,'gh-aura-research-work-'));
  try{
    const archive=join(directory,'checkpoint.tar');
    run('git',['archive','--format=tar','--output',archive,RESEARCH_CHECKPOINT,...RESEARCH_EXPORT_PATHS]);run('tar',['-xf',archive,'-C',directory]);rmSync(archive);
    const script=join(directory,'scripts','visual-profile-smoke.mjs'),fixed=correctVisualCollector(readFileSync(script,'utf8'));
    const isolated=fixed.source.replace("'--headless','--no-sandbox',","'--headless',").replace("],{stdio:['ignore','ignore','pipe']});", "],{windowsHide:true,stdio:['ignore','ignore','pipe']});");
    if(isolated===fixed.source||isolated.includes("'--no-sandbox'"))throw Error('Unexpected archived browser launch contract.');
    writeFileSync(script,isolated);
    const taxonomy=join(directory,'src','holistic-profile-taxonomy.mjs'),old=readFileSync(taxonomy),current=readFileSync(join(root,'src','holistic-profile-taxonomy.mjs'));
    writeFileSync(taxonomy,current);
    const result={directory,sourceCommit:RESEARCH_CHECKPOINT,corrections:[fixed.correction,{id:'isolated-browser-defaults-v1',path:'scripts/visual-profile-smoke.mjs',
      beforeSha256:fixed.correction.afterSha256,afterSha256:createHash('sha256').update(isolated).digest('hex'),change:'Keep the browser sandbox enabled and hide temporary Windows helper windows.'},{id:'strict-editorial-contract-v1',path:'src/holistic-profile-taxonomy.mjs',
      beforeSha256:createHash('sha256').update(old).digest('hex'),afterSha256:createHash('sha256').update(current).digest('hex'),
      change:'Use the current strict dates, named reviewers, evidence notes and editorial checks. No record is preapproved.'}],
      next:'Run corrected collectors here, with explicit public-only targets. Old observations remain historical; re-observe affected profiles and keep editorial decisions separate.'};
    writeFileSync(join(directory,'RESEARCH_CORRECTIONS.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
    return result;
  }catch(error){
    if(dirname(resolve(directory))!==scratchRoot)throw Error('Unexpected research scratch location.');
    rmSync(directory,{recursive:true,force:true,maxRetries:4,retryDelay:100});throw error;
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(prepareResearchWorkspace(),null,2)+'\n');

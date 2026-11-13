import test from 'node:test';
import assert from 'node:assert/strict';
import { wholeProfileContext } from '../src/profile-context.mjs';
import { makeProfileSpec } from '../src/agent-profile.mjs';
import { configForTest } from './fixtures.mjs';

test('shared context preserves explicit external work, language and account intent without inspecting unrelated projects',async()=>{
  const paths=[],project={full_name:'organization/actual-work',name:'actual-work',default_branch:'main',private:false,description:'Backend queue library',topics:['backend'],size:10};
  const fetch=async(url,init={})=>{
    assert.equal(init.method||'GET','GET');const path=new URL(url).pathname;paths.push(path);
    if(path==='/users/example')return Response.json({login:'example',type:'User',public_repos:1,bio:'Public bio'});
    if(path==='/users/example/repos')return Response.json([{...project,full_name:'example/popular',name:'popular',stargazers_count:1000}]);
    if(path==='/repos/organization/actual-work')return Response.json(project);
    if(path==='/repos/organization/actual-work/readme')return Response.json({encoding:'base64',content:Buffer.from('# Actual work\n\n## Usage\n\nInstall the package.').toString('base64')});
    if(path==='/repos/organization/actual-work/git/trees/main')return Response.json({truncated:false,tree:[{path:'package.json',type:'blob'},{path:'tests/queue.test.mjs',type:'blob'}]});
    throw Error('Unexpected public context request '+path);
  };
  const spec={readme:false,account:{bio:'Sistemas de backend'},composition:makeProfileSpec({language:'es',goal:'backend',direction:'technical',featured:['organization/actual-work'],maxProjects:1})};
  const result=await wholeProfileContext('example',spec,{fetch,token:'',config:configForTest()});
  assert.equal(result.intent.account.bio,'Sistemas de backend');assert.equal(result.intent.readme,false);assert.equal(result.writing.editorial.language,'es');
  assert.deepEqual(result.writing.preferences.featured,['organization/actual-work']);assert.equal(result.projectEvidence[0].repository,'organization/actual-work');
  assert.equal(result.coverage.complete,true);assert.equal(result.profile.repository.inspected,false);
  assert.ok(!paths.some(p=>p.startsWith('/repos/example/')));assert.ok(result.usage.networkRequests<20);
});

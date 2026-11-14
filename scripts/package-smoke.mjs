import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync,readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'gh-aura-package-'));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run test:package.');
function run(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npm, ...args], { cwd, encoding: 'utf8', timeout: 120000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout;
}
try {
  const packing = JSON.parse(run(['pack', '--json', '--ignore-scripts', '--pack-destination', directory]));
  // npm 10/11 return an array; npm 12 returns an object keyed by package name.
  const packed = Array.isArray(packing) ? packing[0] : packing['gh-aura'];
  assert.ok(packed && Array.isArray(packed.files), 'Unexpected npm pack JSON response.');
  assert.equal(createHash('sha1').update(readFileSync(join(directory,packed.filename))).digest('hex'),packed.shasum,'Packaged bytes differ from npm checksum.');
  assert.ok(packed.files.some((file) => file.path === 'src/cli.mjs'));
  for(const path of ['AGENTS.md','llms.txt','skills/gh-aura-profile/SKILL.md',
    'src/mcp-server.mjs','src/agent-tools.mjs','src/agent-profile.mjs',
    'src/profile-sources.mjs','src/agent-command.mjs',
    'src/profile-query.mjs','src/profile-source-extra.mjs',
    'src/profile-custom-sources.mjs','src/profile-techniques.mjs',
    'src/profile-biography.mjs','src/profile-plan.mjs','src/profile-context.mjs','src/profile-patterns.mjs',
    'src/profile-projects.mjs','src/improve-command.mjs','src/agent-install.mjs','src/project-improvements.mjs',
    'src/workspace-actions.mjs','src/badge-collaboration.mjs','src/badge-collaboration-campaign.mjs',
    'src/profile-spec-config.mjs','src/profile-references.mjs','src/profile-resources.mjs','src/public-https.mjs','src/calendar-preview.mjs']) {
    assert.ok(packed.files.some(file=>file.path===path),'Missing packaged '+path);
  }
  assert.ok(packed.files.every((file) => !file.path.startsWith('tests/') &&
    !file.path.startsWith('.github/') && !file.path.startsWith('research/') &&
    !file.path.startsWith('scripts/') && !file.path.startsWith('docs/') &&
    file.path !== '.gh-aura.json'));
  assert.ok(packed.files.every((file) => ['src', 'README.md', 'LICENSE',
    'CHANGELOG.md', 'SECURITY.md', 'AGENTS.md', 'llms.txt', 'skills', 'package.json'].includes(file.path.split('/')[0])));
  assert.ok(packed.files.some((file) => file.path === 'src/reference.mjs'));
  assert.ok(packed.files.some((file) => file.path === 'src/achievement-matrix.mjs'));
  assert.ok(packed.files.some((file) => file.path === 'src/badge-write-budget.mjs'));
  assert.ok(packed.files.some((file) => file.path === 'src/profile-directions.mjs'));
  assert.ok(packed.files.some((file) => file.path === 'src/badge-accounts.mjs'));
  assert.ok(packed.files.some((file) => file.path === 'src/badge-bulk-git.mjs'));
  const install = join(directory, 'install');
  run(['install', '--prefix', install, '--offline', '--ignore-scripts', '--no-audit', '--no-fund', resolve(directory, packed.filename)]);
  const cli = join(install, 'node_modules', 'gh-aura', 'src', 'cli.mjs');
  assert.ok(existsSync(cli));
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', cwd: directory });
  assert.equal(help.status, 0, help.stderr); assert.match(help.stdout, /GH Aura/);
  const catalog = spawnSync(process.execPath, [cli, 'achievements', '--json'], { encoding: 'utf8', cwd: directory });
  assert.equal(catalog.status, 0, catalog.stderr); assert.ok(JSON.parse(catalog.stdout).catalog.length > 0);
  for (const [args, format] of [
    [['calendar','plan','2022','--density','0'],'gh-aura-synthetic-calendar-v1'],
    [['badge-run','plan','--repo','example/aura-badges','--pulls','0'],'gh-aura-private-badges-v2'],
  ]) {
    const command = spawnSync(process.execPath,[cli,...args], {
      encoding: 'utf8',cwd: directory,timeout: 10000,
      env: {...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
    });
    assert.equal(command.status,0,command.stderr);
    assert.equal(JSON.parse(command.stdout).format,format);
    if(format==='gh-aura-synthetic-calendar-v1')writeFileSync(join(directory,'calendar.json'),command.stdout);
  }
  const commands=[
    [['sources','categories','--json'],value=>value.styles.length===8&&value.styles.every(c=>c.exampleCount>=3)],
    [['sources','profiles','--category','terminal-code','--limit','3','--json'],value=>value.category==='terminal-code'&&value.profiles.length===3],
    [['agent','capabilities','--json'],value=>value.writesExposed===false],
    [['sources','list','--json'],value=>value.count>=10],
    [['agent','spec','--direction','technical'],value=>value.format==='gh-aura-profile-spec-v1'],
    [['improve','spec'],value=>value.format==='gh-aura-whole-profile-v1'&&value.account&&value.composition],
    [['agent','doctor','--json'],value=>value.nodeSupported&&value.skillPackaged],
    [['agent','install','--client','generic','--directory',join(directory,'skills')],value=>value.changed>0&&value.hostConfigurationChanged===false],
  ];
  for(const [args,verify] of commands){
    const output=spawnSync(process.execPath,[cli,...args],{
      encoding:'utf8',cwd:directory,timeout:10000,
      env:{...process.env,GH_AURA_APPROVED_PLAN:'',GH_AURA_APPROVED_FINGERPRINT:''}});
    assert.equal(output.status,0,output.stderr);
    assert.ok(verify(JSON.parse(output.stdout)),args.join(' '));
  }
  for(const [args,verify] of [
    [['sources','design','--query','terminal','--json'],
      data=>data.techniques.some(x=>x.id==='code-portrait')],
    [['agent','bio','--voice','technical','--bio-words','75','--json'],
      data=>data.format==='gh-aura-bio-guide-v1'&&data.biography.maxWords===75],
  ]){
    const output=spawnSync(process.execPath,[cli,...args],{
      encoding:'utf8',cwd:directory,timeout:10000});
    assert.equal(output.status,0,output.stderr);
    assert.ok(verify(JSON.parse(output.stdout)),args.join(' '));
  }
  const messages=[
    {jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'package-smoke',version:'1'}}},
    {jsonrpc:'2.0',method:'notifications/initialized'},
    {jsonrpc:'2.0',id:2,method:'tools/list'},
    {jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'gh_aura_whole_profile_spec',arguments:{spec:{readme:false,account:{bio:'Installed fixture'}}}}},
    {jsonrpc:'2.0',id:4,method:'resources/read',params:{uri:'gh-aura://guide/profile'}},
    {jsonrpc:'2.0',id:5,method:'tools/call',params:{name:'gh_aura_profile_resources_check',arguments:{markdown:'![Local](assets/missing.svg)'}}},
    {jsonrpc:'2.0',id:6,method:'tools/call',params:{name:'gh_aura_activity_preview',arguments:{plan:JSON.parse(readFileSync(join(directory,'calendar.json'),'utf8'))}}},
    {jsonrpc:'2.0',id:7,method:'tools/call',params:{name:'gh_aura_badges_collaboration_campaign',arguments:{repo:'example/workspace',collaborator:'helper',consent:true,kind:'coauthor',exercises:[{content:'# Reviewed private exercise'}]}}},
    {jsonrpc:'2.0',id:8,method:'tools/call',params:{name:'gh_aura_profiles_list',arguments:{category:'terminal-code',limit:3}}},
  ];
  const mcp=spawnSync(process.execPath,[cli,'mcp'],{cwd:directory,encoding:'utf8',timeout:10000,
    input:messages.map(x=>JSON.stringify(x)).join('\n')+'\n',env:{...process.env,GH_TOKEN:'',GITHUB_TOKEN:'',GH_AURA_APPROVED_PLAN:'',GH_AURA_APPROVED_FINGERPRINT:''}});
  assert.equal(mcp.status,0,mcp.stderr);
  const replies=mcp.stdout.trim().split('\n').map(line=>JSON.parse(line)),byId=new Map(replies.map(x=>[x.id,x]));
  assert.ok(byId.get(2).result.tools.some(t=>t.name==='gh_aura_whole_profile_context'));
  assert.ok(!byId.get(2).result.tools.some(t=>t.name==='gh_aura_apply_approved_profile'));
  assert.equal(JSON.parse(byId.get(3).result.content[0].text).account.bio,'Installed fixture');
  assert.ok(byId.get(4).result.contents[0].text.includes('gh_aura_whole_profile_plan'));
  assert.equal(JSON.parse(byId.get(5).result.content[0].text).results[0].state,'unresolved-relative');
  assert.equal(JSON.parse(byId.get(6).result.content[0].text).days[0].before,null);
  assert.equal(JSON.parse(byId.get(7).result.content[0].text).steps.length,1);
  assert.equal(JSON.parse(byId.get(8).result.content[0].text).profiles.length,3);
  console.log('Installed CLI, checksum, whole-profile handlers, Skill and MCP validated offline.');
} finally { rmSync(directory, { recursive: true, force: true }); }

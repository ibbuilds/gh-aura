import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
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
  const [packed] = JSON.parse(run(['pack', '--json', '--ignore-scripts', '--pack-destination', directory]));
  assert.ok(packed.files.some((file) => file.path === 'src/cli.mjs'));
  assert.ok(packed.files.every((file) => !file.path.startsWith('tests/') &&
    !file.path.startsWith('.github/') && !file.path.startsWith('research/') &&
    !file.path.startsWith('scripts/') && !file.path.startsWith('docs/') &&
    file.path !== '.gh-aura.json'));
  assert.ok(packed.files.every((file) => ['src', 'README.md', 'LICENSE',
    'CHANGELOG.md', 'SECURITY.md', 'package.json'].includes(file.path.split('/')[0])));
  assert.ok(packed.files.some((file) => file.path === 'src/reference.mjs'));
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
    [['badge-run','plan','--repo','example/aura-badges','--pulls','0'],'gh-aura-private-badges-v1'],
  ]) {
    const command = spawnSync(process.execPath,[cli,...args], {
      encoding: 'utf8',cwd: directory,timeout: 10000,
      env: {...process.env,GH_TOKEN:'',GITHUB_TOKEN:''},
    });
    assert.equal(command.status,0,command.stderr);
    assert.equal(JSON.parse(command.stdout).format,format);
  }
  console.log('Packed CLI installed and executed successfully without registry access.');
} finally { rmSync(directory, { recursive: true, force: true }); }

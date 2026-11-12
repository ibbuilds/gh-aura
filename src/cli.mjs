#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { HELP, SPECS, parseArgs, validateOptions } from './cli-options.mjs';
import { plain } from './text.mjs';
export { parseArgs } from './cli-options.mjs';
const version = () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

/** Help and argument validation do not import GitHub, cache, writers or publishing. */
export async function main(argv = process.argv.slice(2)) {
  let [command = 'help', ...tokens] = argv;
  if (['--help', '-h', 'help'].includes(command)) { process.stdout.write(HELP); return; }
  if (['--version', '-V', 'version'].includes(command)) { process.stdout.write(version() + '\n'); return; }
  // Friendly aliases preserve the existing explicit commands.
  // No alias changes files or starts GitHub activity by itself.
  if (command === 'activity') {
    const first = tokens[0];
    if (first === 'plan' || first === 'apply') {
      // Reuse the reviewed calendar engine under the unified activity command.
      command = 'calendar';
    } else {
      if (/^\d{4}$/.test(first || '')) {
        tokens = ['--year', first, ...tokens.slice(1)];
      } else if (/^\d{4}\.\.\d{4}$/.test(first || '')) {
        const [from, to] = first.split('..');
        tokens = ['--from', from, '--to', to, ...tokens.slice(1)];
      }
      command = 'contributions';
    }
  } else if (command === 'badges') {
    const first = tokens[0];
    if (first === 'auto' || first === 'automate') {
      command = 'badge-run';
      tokens = tokens.slice(1);
      if (!['plan', 'apply', 'status'].includes(tokens[0])) tokens = ['plan', ...tokens];
    } else {
    if (first === 'free' || first === 'all' || first === 'attainable') {
      tokens = ['--scope', first === 'all' ? 'all' : first, '--plan', ...tokens.slice(1)];
    } else if (first && !first.startsWith('-')) {
      tokens = ['--badge', first, '--plan', ...tokens.slice(1)];
    } else if (!first) {
      tokens = ['--scope', 'free', '--plan'];
    }
    command = 'achievements';
    }
  } else if (command === 'readme') {
    const first = tokens[0];
    if (['minimal', 'regular', 'flashy'].includes(first)) {
      tokens = ['--style', first, ...tokens.slice(1)];
    } else if (/^\d{1,3}$/.test(first || '') && Number(first) <= 100) {
      tokens = ['--visual', first, ...tokens.slice(1)];
    }
    command = 'profile';
  } else if (command === 'pins') {
    command = 'showcase';
  }
  if (command === 'plan') command = 'audit';
  const spec = SPECS[command];
  if (!spec) throw new Error('Unknown command: ' + command + '. Run gh-aura --help.');
  const options = parseArgs(tokens);
  if (options.help) {
    process.stdout.write('Usage: gh-aura ' + spec.usage + '\nOptions: ' + spec.flags.map((flag) => '--' + flag).join(', ') + '\n'); return;
  }
  validateOptions(command, options);
  if (command === 'badge-run') {
    await (await import('./badge-run.mjs')).runBadgeAutomation(options.positional[0],options);
    return;
  }
  if (command === 'calendar') {
    await (await import('./calendar-apply.mjs')).runCalendar(options.positional[0], options);
    return;
  }
  if (command === 'work') {
    await (await import('./work.mjs')).runWork(options.positional[0], options);
    return;
  }
  const handler = ['init', 'config', 'check', 'references', 'story'].includes(command) ? './commands/local.mjs'
    : ['preview', 'apply'].includes(command) ? './commands/publish.mjs' : './commands/read.mjs';
  await (await import(handler)).run(command, options);
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  try { return pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (isEntryPoint()) {
  process.stdout.on('error', (error) => { if (error.code === 'EPIPE') process.exit(0); else throw error; });
  main().catch((error) => { process.stderr.write('GH Aura: ' + plain(error.message) + '\n'); process.exitCode = 1; });
}

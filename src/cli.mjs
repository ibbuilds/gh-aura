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
  if (command === 'plan') command = 'audit';
  const spec = SPECS[command];
  if (!spec) throw new Error('Unknown command: ' + command + '. Run gh-aura --help.');
  const options = parseArgs(tokens);
  if (options.help) {
    process.stdout.write('Usage: gh-aura ' + spec.usage + '\nOptions: ' + spec.flags.map((flag) => '--' + flag).join(', ') + '\n'); return;
  }
  validateOptions(command, options);
  if (command === 'work') {
    await (await import('./work.mjs')).runWork(options.positional[0], options);
    return;
  }
  const handler = ['init', 'config', 'check', 'references'].includes(command) ? './commands/local.mjs'
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

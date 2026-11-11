import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { plain } from './text.mjs';

export function emit(value, options = {}) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  if (options.output) {
    writeFileSync(resolve(options.output), text, { flag: options.force ? 'w' : 'wx', mode: 0o600 });
    process.stderr.write('Wrote ' + plain(resolve(options.output)) + '\n');
  } else process.stdout.write(plain(text) + (text.endsWith('\n') ? '' : '\n'));
}

export function loginFor(options, config) {
  if (options.user && options.positional[0] && options.user.toLowerCase() !== options.positional[0].toLowerCase()) throw new Error('Conflicting usernames.');
  const user = options.user || options.positional[0] || config.user;
  if (!user) throw new Error('Choose an account: gh-aura init USER, or pass USER to this command.');
  if (typeof user !== 'string' || user.length > 39 || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(user) || user.includes('--')) throw new Error('Provide a valid GitHub username.');
  return user;
}

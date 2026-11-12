import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_CONFIG, loadConfig, validateConfig } from './config.mjs';
import { diffText } from './diff.mjs';

const PATTERN = /^[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*$/;
const SECTIONS = new Set(['about', 'projects', 'technologies', 'links', 'stats', 'extras']);

function parts(path) {
  if (!path || !PATTERN.test(path)) throw new Error('Provide a valid dotted configuration path.');
  const keys = path.split('.');
  let value = DEFAULT_CONFIG;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === 2 && keys[0] === 'profile' && keys[1] === 'sections' && SECTIONS.has(key)) {
      if (i !== keys.length - 1) throw new Error('Invalid path: ' + path);
      return { keys, dynamic: true };
    }
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) {
      throw new Error('Unknown configuration path: ' + path);
    }
    value = value[key];
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    throw new Error('Choose a leaf property rather than an object: ' + path);
  }
  return { keys, dynamic: false };
}

function at(config, keys) {
  let value = config;
  for (const key of keys) value = value?.[key];
  return value;
}

function decode(value, expected, isSection) {
  if (isSection) {
    if (value !== 'true' && value !== 'false') throw new Error('Section toggles must be true or false.');
    return value === 'true';
  }
  if (typeof expected === 'string') return value;
  let parsed;
  try { parsed = JSON.parse(value); }
  catch { throw new Error('Provide a valid JSON value for non-string settings.'); }
  if (Array.isArray(expected) && !Array.isArray(parsed)) throw new Error('Expected a JSON array.');
  if (typeof expected === 'number' && typeof parsed !== 'number') throw new Error('Expected a number.');
  return parsed;
}

export function configCommand(action, path, value, options = {}) {
  const filename = resolve(options.file || '.gh-aura.json');
  const isEdit = action === 'set' || action === 'reset';
  const current = isEdit && !existsSync(filename)
    ? structuredClone(DEFAULT_CONFIG)
    : loadConfig(options.file);
  if (!action || action === 'show') return JSON.stringify(current, null, 2) + '\n';
  const { keys, dynamic } = parts(path);
  if (action === 'get') {
    const found = at(current, keys);
    return found === undefined ? '(inherited from profile style)\n' :
      (typeof found === 'string' ? found + '\n' : JSON.stringify(found, null, 2) + '\n');
  }
  if (action !== 'set' && action !== 'reset') {
    throw new Error('Configuration action must be show, get, set, or reset.');
  }
  if (action === 'set' && value === undefined) throw new Error('Provide a value to set.');
  const updated = structuredClone(current);
  const parent = at(updated, keys.slice(0, -1));
  const leaf = keys.at(-1);
  if (action === 'reset' && dynamic) delete parent[leaf];
  else if (action === 'reset') parent[leaf] = at(DEFAULT_CONFIG, keys);
  else parent[leaf] = decode(value, at(DEFAULT_CONFIG, keys), dynamic);
  validateConfig(updated);
  if (options.dryRun) {
    return 'Local configuration preview for ' + filename + '\n' +
      diffText(JSON.stringify(current, null, 2), JSON.stringify(updated, null, 2));
  }
  writeFileSync(filename, JSON.stringify(updated, null, 2) + '\n', { flag: 'w', mode: 0o600 });
  return 'Updated local config: ' + filename + ' (' + keys.join('.') + ')\n';
}

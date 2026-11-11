import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { httpsUrl, plain } from './text.mjs';

export const DEFAULT_CONFIG = {
  user: '',
  scan: { maxRepos: 200, inspectRepos: 0, maxRequests: 60 },
  profile: {
    style: 'minimal', visual: -1, name: '', headline: '', about: '', location: '',
    technologies: [], featured: [], excluded: [], maxProjects: 3,
    sections: {}, links: [], extras: [], accent: 'blue',
  },
  showcase: {
    goal: '', topics: [], preferred: [], excluded: [], limit: 6,
    weights: { relevance: 30, substance: 25, presentation: 20, maintenance: 15, popularity: 10 },
  },
  achievements: { earned: [], excluded: [], allowPaid: false },
  editorial: { language: 'en', targetRole: '', maxWords: 220 },
};

export const SECTIONS = new Set(['about', 'projects', 'technologies', 'links', 'stats', 'extras']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function mergeKnown(base, custom, prefix = '') {
  if (!object(custom)) throw new Error('Configuration must be a JSON object: ' + (prefix || 'root'));
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(custom)) {
    if (!Object.hasOwn(base, key)) {
      if (prefix === 'profile.sections.' && SECTIONS.has(key)) { result[key] = value; continue; }
      throw new Error('Unknown configuration key: ' + prefix + key);
    }
    result[key] = object(base[key]) ? mergeKnown(base[key], value, prefix + key + '.') : value;
  }
  return result;
}

function string(value, label) {
  if (typeof value !== 'string' || value.length > 20000 || plain(value) !== value) {
    throw new Error(label + ' must be text without terminal control characters (maximum 20000 characters).');
  }
}

function array(value, label) {
  if (!Array.isArray(value) || value.length > 100) throw new Error(label + ' must be an array with at most 100 entries.');
  for (const item of value) string(item, label);
}

function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
}

export function validateConfig(config) {
  // Re-run key/type checking for callers that mutate configuration programmatically.
  mergeKnown(DEFAULT_CONFIG, config);
  string(config.user, 'user');
  if (config.user && (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(config.user) || config.user.includes('--'))) throw new Error('user must be a GitHub username.');
  const p = config.profile;
  if (!['minimal', 'regular', 'flashy'].includes(p.style)) throw new Error('profile.style must be minimal, regular, or flashy.');
  for (const key of ['name', 'headline', 'about', 'location', 'accent']) string(p[key], 'profile.' + key);
  if (!/^(?:[a-z][a-z0-9-]{0,19}|#?[a-f0-9]{6})$/i.test(p.accent)) throw new Error('profile.accent must be a color name or six-digit hex value.');
  for (const key of ['technologies', 'featured', 'excluded']) array(p[key], 'profile.' + key);
  for (const key of ['topics', 'preferred', 'excluded']) array(config.showcase[key], 'showcase.' + key);
  string(config.showcase.goal, 'showcase.goal');
  integer(config.scan.maxRequests, 1, 500, 'scan.maxRequests');
  integer(p.visual, -1, 100, 'profile.visual');
  string(config.editorial.targetRole, 'editorial.targetRole');
  if (!['en', 'es'].includes(config.editorial.language)) throw new Error('editorial.language must be en or es.');
  integer(config.editorial.maxWords, 30, 1000, 'editorial.maxWords');
  integer(config.scan.maxRepos, 1, 500, 'scan.maxRepos');
  integer(config.scan.inspectRepos, 0, 20, 'scan.inspectRepos');
  integer(p.maxProjects, 0, 6, 'profile.maxProjects');
  integer(config.showcase.limit, 1, 6, 'showcase.limit');
  for (const [key, value] of Object.entries(p.sections)) {
    if (!SECTIONS.has(key) || typeof value !== 'boolean') throw new Error('Invalid section toggle: ' + key);
  }
  if (!Array.isArray(p.links) || p.links.length > 20) throw new Error('profile.links must contain at most 20 links.');
  for (const link of p.links) {
    if (!object(link) || Object.keys(link).some((key) => !['label', 'url'].includes(key)) || !httpsUrl(link.url)) {
      throw new Error('profile.links must contain {label, url} entries with safe https:// URLs.');
    }
    string(link.label, 'link.label');
  }
  if (!Array.isArray(p.extras) || p.extras.length > 20) throw new Error('profile.extras must contain at most 20 sections.');
  for (const section of p.extras) {
    if (!object(section) || Object.keys(section).some((key) => !['title', 'body'].includes(key))) throw new Error('Extras require {title, body}.');
    string(section.title, 'extra.title'); string(section.body, 'extra.body');
  }
  const weights = Object.values(config.showcase.weights);
  if (weights.length !== 5 || !weights.every((v) => Number.isFinite(v) && v >= 0 && v <= 1000) || weights.reduce((a, b) => a + b, 0) <= 0) {
    throw new Error('showcase.weights must contain five nonnegative numbers with a positive total.');
  }
  array(config.achievements.earned, 'achievements.earned');
  array(config.achievements.excluded, 'achievements.excluded');
  if (typeof config.achievements.allowPaid !== 'boolean') throw new Error('achievements.allowPaid must be true or false.');
  return config;
}

export function loadConfig(filePath) {
  const filename = resolve(filePath || '.gh-aura.json');
  if (!existsSync(filename)) {
    if (filePath) throw new Error('Configuration file not found: ' + filename);
    return structuredClone(DEFAULT_CONFIG);
  }
  let raw;
  try { raw = JSON.parse(readFileSync(filename, 'utf8')); }
  catch { throw new Error('Could not read valid JSON configuration: ' + filename); }
  return validateConfig(mergeKnown(DEFAULT_CONFIG, raw));
}

export function initConfig(filePath, force = false, user = '') {
  const filename = resolve(filePath || '.gh-aura.json');
  const config = structuredClone(DEFAULT_CONFIG);
  config.user = user;
  validateConfig(config);
  writeFileSync(filename, JSON.stringify(config, null, 2) + '\n', { flag: force ? 'w' : 'wx', mode: 0o600 });
  return filename;
}

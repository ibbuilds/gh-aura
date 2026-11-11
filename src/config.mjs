import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_CONFIG = {
  scan: { maxRepos: 200, inspectRepos: 0 },
  profile: {
    style: 'minimal',
    name: '',
    headline: '',
    about: '',
    location: '',
    technologies: [],
    featured: [],
    excluded: [],
    maxProjects: 3,
    sections: {},
    links: [],
    extras: [],
    accent: 'blue',
  },
  showcase: {
    goal: '',
    topics: [],
    preferred: [],
    excluded: [],
    limit: 6,
    weights: {
      relevance: 30,
      substance: 25,
      presentation: 20,
      maintenance: 15,
      popularity: 10,
    },
  },
};

const STYLES = new Set(['minimal', 'regular', 'flashy']);
const SECTIONS = new Set(['about', 'projects', 'technologies', 'links', 'stats', 'extras']);

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeKnown(base, custom, prefix = '') {
  if (!plainObject(custom)) throw new Error('Configuration must be a JSON object.');
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(custom)) {
    if (!Object.hasOwn(base, key)) {
      if (prefix === 'profile.sections.' && SECTIONS.has(key)) {
        result[key] = value;
        continue;
      }
      throw new Error('Unknown configuration key: ' + prefix + key);
    }
    if (plainObject(base[key])) {
      result[key] = mergeKnown(base[key], value, prefix + key + '.');
    } else {
      result[key] = value;
    }
  }
  return result;
}

function checkStringArray(value, label) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(label + ' must be an array of strings.');
  }
}

export function validateConfig(config) {
  if (!STYLES.has(config.profile.style)) {
    throw new Error('profile.style must be minimal, regular, or flashy.');
  }
  for (const key of ['name', 'headline', 'about', 'location', 'accent']) {
    if (typeof config.profile[key] !== 'string') {
      throw new Error('profile.' + key + ' must be a string.');
    }
  }
  if (!/^[a-zA-Z0-9#-]{1,20}$/.test(config.profile.accent)) {
    throw new Error('profile.accent must be a short color label or hex value.');
  }
  for (const key of ['technologies', 'featured', 'excluded']) {
    checkStringArray(config.profile[key], 'profile.' + key);
  }
  for (const key of ['goal']) {
    if (typeof config.showcase[key] !== 'string') {
      throw new Error('showcase.' + key + ' must be a string.');
    }
  }
  for (const key of ['topics', 'preferred', 'excluded']) {
    checkStringArray(config.showcase[key], 'showcase.' + key);
  }
  if (!Number.isInteger(config.scan.inspectRepos) || config.scan.inspectRepos < 0 || config.scan.inspectRepos > 20) {
    throw new Error('scan.inspectRepos must be between 0 and 20.');
  }
  if (!Number.isInteger(config.scan.maxRepos) || config.scan.maxRepos < 1 || config.scan.maxRepos > 500) {
    throw new Error('scan.maxRepos must be between 1 and 500.');
  }
  if (!Number.isInteger(config.profile.maxProjects) || config.profile.maxProjects < 1 || config.profile.maxProjects > 6) {
    throw new Error('profile.maxProjects must be between 1 and 6.');
  }
  if (!Number.isInteger(config.showcase.limit) || config.showcase.limit < 1 || config.showcase.limit > 6) {
    throw new Error('showcase.limit must be between 1 and 6.');
  }
  for (const [key, value] of Object.entries(config.profile.sections)) {
    if (!SECTIONS.has(key) || typeof value !== 'boolean') {
      throw new Error('Unknown or invalid profile.sections setting: ' + key);
    }
  }
  if (!Array.isArray(config.profile.links) || !config.profile.links.every((link) =>
    plainObject(link) && typeof link.label === 'string' && typeof link.url === 'string' &&
    /^https:\/\/[^\s]+$/i.test(link.url))) {
    throw new Error('profile.links must contain {label, url} entries using https:// URLs.');
  }
  if (!Array.isArray(config.profile.extras) || !config.profile.extras.every((section) =>
    plainObject(section) && typeof section.title === 'string' && typeof section.body === 'string')) {
    throw new Error('profile.extras must contain {title, body} entries.');
  }
  const weights = Object.values(config.showcase.weights);
  if (!weights.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0) ||
    weights.reduce((sum, v) => sum + v, 0) <= 0) {
    throw new Error('showcase.weights must contain nonnegative numbers with a positive total.');
  }
  return config;
}

export function loadConfig(filePath) {
  const filename = resolve(filePath || '.gh-aura.json');
  if (!existsSync(filename)) {
    if (filePath) throw new Error('Configuration file not found: ' + filename);
    return structuredClone(DEFAULT_CONFIG);
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(filename, 'utf8'));
  } catch (error) {
    throw new Error('Could not read valid JSON configuration: ' + error.message);
  }
  return validateConfig(mergeKnown(DEFAULT_CONFIG, raw));
}

export function initConfig(filePath, force = false) {
  const filename = resolve(filePath || '.gh-aura.json');
  writeFileSync(filename, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n', {
    flag: force ? 'w' : 'wx',
  });
  return filename;
}

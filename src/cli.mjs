#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initConfig, loadConfig, validateConfig } from './config.mjs';
import { getSnapshot, validateLogin } from './github.mjs';
import { auditProfile, rankRepositories } from './engine.mjs';
import { renderAuditMarkdown, renderPlanMarkdown, renderProfile, renderShowcaseMarkdown } from './render.mjs';
import { ACHIEVEMENTS, ACHIEVEMENT_SOURCES, renderAchievementsMarkdown } from './achievements.mjs';

const VERSION = '0.1.0';
const HELP = [
  'GH Aura — professional GitHub presence, entirely from your terminal',
  '',
  'Usage:',
  '  gh-aura init [--output .gh-aura.json]',
  '  gh-aura audit <username> [--format markdown|json] [--output file]',
  '  gh-aura plan <username> [--output file]',
  '  gh-aura showcase <username> [--goal "backend engineer"] [--limit 6]',
  '  gh-aura profile <username> [--style minimal|regular|flashy] [--output README.md]',
  '  gh-aura achievements [--format markdown|json]',
  '',
  'Global options:',
  '  --config path   Path to local JSON config (default: .gh-aura.json when present)',
  '  --user login    Alternative to the positional username',
  '  --format type   markdown (default) or json',
  '  --json          Shortcut for --format json',
  '  --output path   Write output to local file; stdout is default',
  '  --force         Allow overwriting a local output file',
  '  --help          Show command usage',
  '  --version       Show version',
  '',
  'No GitHub writes, dummy commits, fabricated badges, or retroactive history edits.',
].join('\n');

const VALUE_OPTIONS = new Set(['config', 'user', 'format', 'output', 'goal', 'limit', 'style']);
const FLAGS = new Set(['help', 'version', 'json', 'force']);

export function parseArgs(tokens) {
  const parsed = { positional: [] };
  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i];
    if (value.startsWith('--')) {
      const equal = value.indexOf('=');
      const key = equal === -1 ? value.slice(2) : value.slice(2, equal);
      if (FLAGS.has(key)) {
        if (equal !== -1) throw new Error('--' + key + ' does not take a value.');
        parsed[key] = true;
      } else if (VALUE_OPTIONS.has(key)) {
        const next = equal !== -1 ? value.slice(equal + 1) : tokens[++i];
        if (!next || next.startsWith('--')) throw new Error('Missing value for --' + key);
        parsed[key] = next;
      } else {
        throw new Error('Unknown option: ' + value);
      }
    } else {
      parsed.positional.push(value);
    }
  }
  return parsed;
}

function output(content, file, force) {
  if (!file) {
    process.stdout.write(content.endsWith('\n') ? content : content + '\n');
    return;
  }
  const filename = resolve(file);
  writeFileSync(filename, content, { flag: force ? 'w' : 'wx' });
  process.stdout.write('Wrote ' + filename + '\n');
}

function asJSON(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

async function main() {
  const [command = 'help', ...tokens] = process.argv.slice(2);
  if (command === '--help' || command === '-h') {
    process.stdout.write(HELP + '\n');
    return;
  }
  if (command === '--version') {
    process.stdout.write(VERSION + '\n');
    return;
  }
  const opts = parseArgs(tokens);
  if (command === 'help' || opts.help) {
    process.stdout.write(HELP + '\n');
    return;
  }
  if (command === 'version' || opts.version) {
    process.stdout.write(VERSION + '\n');
    return;
  }
  if (command === 'init') {
    const name = initConfig(opts.output, opts.force);
    process.stdout.write('Created ' + name + '\n');
    return;
  }
  const commands = new Set(['audit', 'plan', 'showcase', 'profile', 'achievements']);
  if (!commands.has(command)) throw new Error('Unknown command: ' + command + '. Run gh-aura --help.');
  const format = opts.json ? 'json' : opts.format || 'markdown';
  if (!['json', 'markdown'].includes(format)) {
    throw new Error('--format must be markdown or json.');
  }
  if (command === 'achievements') {
    const body = format === 'json'
      ? asJSON({ catalog: ACHIEVEMENTS, sources: ACHIEVEMENT_SOURCES, status: 'community-reported; unverified per account' })
      : renderAchievementsMarkdown();
    output(body, opts.output, opts.force);
    return;
  }

  const login = validateLogin(opts.user || opts.positional[0]);
  const config = loadConfig(opts.config);
  if (opts.style) config.profile.style = opts.style;
  if (opts.goal) config.showcase.goal = opts.goal;
  if (opts.limit) {
    const limit = Number(opts.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 6) throw new Error('--limit must be between 1 and 6.');
    config.showcase.limit = limit;
  }
  validateConfig(config);
  const snapshot = await getSnapshot(login, { maxRepos: config.scan.maxRepos });

  if (command === 'profile') {
    const markdown = renderProfile(snapshot, config);
    output(markdown, opts.output, opts.force);
    return;
  }
  if (command === 'showcase') {
    const recommendations = rankRepositories(snapshot, config);
    const body = format === 'json'
      ? asJSON(recommendations.map(({ repo, score, reasons, factors }) => ({
        fullName: repo.full_name, url: repo.html_url, score, reasons, factors,
      })))
      : renderShowcaseMarkdown(snapshot.username, recommendations);
    output(body, opts.output, opts.force);
    return;
  }
  const report = auditProfile(snapshot, config);
  if (command === 'audit') {
    output(format === 'json' ? asJSON(report) : renderAuditMarkdown(report), opts.output, opts.force);
    return;
  }
  if (command === 'plan') {
    output(format === 'json' ? asJSON(report) : renderPlanMarkdown(report), opts.output, opts.force);
  }
}

main().catch((error) => {
  process.stderr.write('GH Aura: ' + error.message + '\n');
  process.exitCode = 1;
});

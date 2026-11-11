#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initConfig, loadConfig, validateConfig } from './config.mjs';
import { configCommand } from './config-cli.mjs';
import { getSnapshot, validateLogin } from './github.mjs';
import { inspectRepositories } from './inspection.mjs';
import { auditProfile, rankRepositories } from './engine.mjs';
import { renderAuditMarkdown, renderPlanMarkdown, renderProfile, renderShowcaseMarkdown } from './render.mjs';
import { ACHIEVEMENTS, ACHIEVEMENT_SOURCES, renderAchievementsMarkdown } from './achievements.mjs';
import { diffText } from './diff.mjs';
import { editorialBrief } from './brief.mjs';
import { applyProfile, previewProfile, profileTarget, readDraft } from './workflow.mjs';

const VERSION = '0.3.0';
const HELP = [
  'GH Aura — a user-directed, terminal-only GitHub profile toolkit',
  '',
  'Usage:',
  '  gh-aura init [--output .gh-aura.json]',
  '  gh-aura config show [--config path]',
  '  gh-aura config get profile.style',
  '  gh-aura config set profile.style regular [--dry-run]',
  '  gh-aura config set profile.sections.stats true',
  '  gh-aura config reset profile.sections.stats',
  '  gh-aura audit <username> [--inspect 6] [--format json]',
  '  gh-aura plan <username> [--inspect 6]',
  '  gh-aura showcase <username> [--goal "backend engineer"] [--limit 6]',
  '  gh-aura profile <username> [--style minimal|regular|flashy] [--output draft.md]',
  '  gh-aura diff <username> [--style minimal|regular|flashy]',
  '  gh-aura brief <username> [--output brief.json]',
  '  gh-aura preview <username> --file draft.md',
  '  gh-aura apply <username> --file draft.md --approve SHA256',
  '  gh-aura achievements [--format markdown|json]',
  '',
  'Options:',
  '  --config path   JSON config (default .gh-aura.json, or built-in defaults)',
  '  --user login    Alternative to positional username',
  '  --format type   markdown (default) or json',
  '  --json          Alias for --format json',
  '  --inspect N     Inspect top N public project READMEs (0–20; default 0)',
  '  --style style   minimal, regular, or flashy',
  '  --goal text     Target engineering focus for showcase rankings',
  '  --limit N       Pin recommendations (1–6)',
  '  --file path     Exact draft file for preview/apply',
  '  --approve hash  SHA-256 from preview, bound to draft and remote state',
  '  --dry-run       Preview local config edits without saving them',
  '  --output path   Write output to a local file (stdout by default)',
  '  --force         Overwrite an existing local output file',
  '  --help          Show help',
  '  --version       Show version',
  '',
  'Only apply performs a remote write; it requires a token, exact draft and approval code.',
].join('\n');

const VALUE_OPTIONS = new Set([
  'config', 'user', 'format', 'output', 'goal', 'limit', 'style', 'inspect', 'file', 'approve',
]);
const FLAGS = new Set(['help', 'version', 'json', 'force', 'dry-run']);

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
  if (command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(HELP + '\n');
    return;
  }
  if (command === '--version' || command === 'version') {
    process.stdout.write(VERSION + '\n');
    return;
  }
  const opts = parseArgs(tokens);
  if (opts.help) {
    process.stdout.write(HELP + '\n');
    return;
  }
  if (opts.version) {
    process.stdout.write(VERSION + '\n');
    return;
  }
  if (command === 'init') {
    const name = initConfig(opts.output, opts.force);
    process.stdout.write('Created ' + name + '\n');
    return;
  }
  if (command === 'config') {
    const [action, path, ...rest] = opts.positional;
    const response = configCommand(action, path, rest.join(' '), {
      file: opts.config, dryRun: opts['dry-run'],
    });
    process.stdout.write(response);
    return;
  }
  const commands = new Set([
    'audit', 'plan', 'showcase', 'profile', 'diff', 'brief', 'preview', 'apply', 'achievements',
  ]);
  if (!commands.has(command)) {
    throw new Error('Unknown command: ' + command + '. Run gh-aura --help.');
  }
  const format = opts.json ? 'json' : opts.format || 'markdown';
  if (!['json', 'markdown'].includes(format)) throw new Error('--format must be markdown or json.');
  if (command === 'achievements') {
    const body = format === 'json'
      ? asJSON({ catalog: ACHIEVEMENTS, sources: ACHIEVEMENT_SOURCES, status: 'community-reported; unverified per account' })
      : renderAchievementsMarkdown();
    output(body, opts.output, opts.force);
    return;
  }

  const login = validateLogin(opts.user || opts.positional[0]);
  if (command === 'apply' && opts['dry-run']) {
    throw new Error('apply --dry-run never publishes. Use gh-aura preview USER --file draft.md instead.');
  }
  if (command === 'preview' || command === 'apply') {
    // No GitHub write is possible until a file and matching approval code are supplied.
    const draft = readDraft(opts.file);
    if (command === 'apply' && !opts.approve) {
      throw new Error('Publishing requires --approve SHA256 from gh-aura preview.');
    }
    const target = await profileTarget(login);
    if (command === 'preview') {
      output(previewProfile(target, draft), opts.output, opts.force);
      return;
    }
    const result = await applyProfile(target, draft, opts.approve);
    process.stdout.write(result.message + (result.commit ? '\n' + result.commit : '') + '\n');
    return;
  }

  const config = loadConfig(opts.config);
  if (opts.style) config.profile.style = opts.style;
  if (opts.goal) config.showcase.goal = opts.goal;
  if (opts.limit) {
    const limit = Number(opts.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 6) throw new Error('--limit must be between 1 and 6.');
    config.showcase.limit = limit;
  }
  if (opts.inspect !== undefined) {
    const count = Number(opts.inspect);
    if (!Number.isInteger(count) || count < 0 || count > 20) throw new Error('--inspect must be between 0 and 20.');
    config.scan.inspectRepos = count;
  }
  validateConfig(config);
  const snapshot = await getSnapshot(login, { maxRepos: config.scan.maxRepos });
  await inspectRepositories(snapshot, config, config.scan.inspectRepos);

  if (command === 'brief') {
    output(asJSON(editorialBrief(snapshot, config)), opts.output, opts.force);
    return;
  }
  if (command === 'profile') {
    output(renderProfile(snapshot, config), opts.output, opts.force);
    return;
  }
  if (command === 'diff') {
    output(diffText(snapshot.profileReadme?.content || '', renderProfile(snapshot, config)),
      opts.output, opts.force);
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
  output(format === 'json' ? asJSON(report)
    : command === 'audit' ? renderAuditMarkdown(report) : renderPlanMarkdown(report),
  opts.output, opts.force);
}

main().catch((error) => {
  process.stderr.write('GH Aura: ' + error.message + '\n');
  process.exitCode = 1;
});

#!/usr/bin/env node
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initConfig, loadConfig, validateConfig } from './config.mjs';
import { configCommand } from './config-cli.mjs';
import { getSnapshot, validateLogin } from './github.mjs';
import { inspectRepositories } from './inspection.mjs';
import { auditProfile, rankRepositories } from './engine.mjs';
import { renderAuditMarkdown, renderProfile, renderShowcaseMarkdown } from './render.mjs';
import { achievementReport, renderAchievementsMarkdown } from './achievements.mjs';
import { contributionsReport, renderContributions } from './contributions.mjs';
import { diffText } from './diff.mjs';
import { editorialBrief } from './brief.mjs';
import { applyProfile, previewProfile, profileTarget, readDraft, readReview, saveReview } from './workflow.mjs';
import { plain } from './text.mjs';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const COMMON = ['config', 'user'];
const DATA = [...COMMON, 'inspect', 'format', 'output', 'force'];
const SPECS = {
  init: { usage: 'init [USER] [--config FILE]', flags: ['config', 'output', 'force'], max: 1 },
  config: { usage: 'config show|get|set|reset [KEY] [VALUE] [--dry-run]', flags: ['config', 'dry-run'], max: 3 },
  audit: { usage: 'audit [USER] [--inspect 6] [--json]', flags: DATA, max: 1 },
  profile: { usage: 'profile [USER] [--style minimal|regular|flashy] [--output draft.md]', flags: [...COMMON, 'style', 'inspect', 'output', 'force'], max: 1 },
  preview: { usage: 'preview [USER] --file draft.md [--save review.json]', flags: [...COMMON, 'file', 'save', 'force'], max: 1 },
  apply: { usage: 'apply --review review.json | apply [USER] --file draft.md --approve CODE', flags: [...COMMON, 'file', 'approve', 'review', 'format'], max: 1 },
  showcase: { usage: 'showcase [USER] [--goal TEXT] [--limit 6] [--inspect 6]', flags: [...DATA, 'goal', 'limit'], max: 1 },
  achievements: { usage: 'achievements [USER] [--json]', flags: [...COMMON, 'format', 'output', 'force'], max: 1 },
  contributions: { usage: 'contributions [USER] [--year YYYY | --all] [--json]', flags: [...COMMON, 'year', 'all', 'format', 'output', 'force'], max: 1 },
  brief: { usage: 'brief [USER] [--style minimal|regular|flashy] [--output brief.json]', flags: [...DATA, 'style'], max: 1 },
  diff: { usage: 'diff [USER] [--style minimal|regular|flashy]', flags: [...COMMON, 'style', 'output', 'force'], max: 1 },
};
const VALUES = new Set(['config', 'user', 'format', 'output', 'style', 'inspect', 'file', 'save', 'approve', 'review', 'goal', 'limit', 'year']);
const FLAGS = new Set(['help', 'version', 'json', 'force', 'dry-run', 'all']);
const HELP = [
  'GH Aura — a GitHub profile toolkit. You choose every change.', '',
  'Start:', '  gh-aura init USER', '  gh-aura audit',
  '  gh-aura profile --output draft.md',
  '  gh-aura preview --file draft.md --save review.json',
  '  gh-aura apply --review review.json', '',
  'Explore:', '  showcase       Recommend projects to pin',
  '  achievements   Explore badges and relevant public evidence',
  '  contributions  Inspect annual activity and visibility checks',
  '  brief          Export JSON for any editor or AI assistant',
  '  config         Read or change local preferences', '',
  'Use gh-aura COMMAND --help for options. No command runs in the background.',
  'Only apply writes to GitHub. The other commands read data or write local files.',
].join('\n') + '\n';

export function parseArgs(tokens) {
  const result = { positional: [] };
  let literal = false;
  for (let index = 0; index < tokens.length; index++) {
    let value = tokens[index];
    if (literal) { result.positional.push(value); continue; }
    if (value === '--') { literal = true; continue; }
    value = ({ '-h': '--help', '-V': '--version', '-o': '--output' })[value] || value;
    if (!value.startsWith('-')) { result.positional.push(value); continue; }
    const equal = value.indexOf('=');
    const key = equal < 0 ? value.slice(2) : value.slice(2, equal);
    if (!value.startsWith('--') || (!VALUES.has(key) && !FLAGS.has(key))) throw new Error('Unknown option: ' + value);
    if (Object.hasOwn(result, key)) throw new Error('Duplicate option: --' + key);
    if (FLAGS.has(key)) {
      if (equal >= 0) throw new Error('--' + key + ' takes no value.');
      result[key] = true;
    } else {
      const next = equal >= 0 ? value.slice(equal + 1) : tokens[++index];
      if (next === undefined || next.startsWith('--')) throw new Error('Missing value for --' + key);
      result[key] = next;
    }
  }
  return result;
}

function emit(value, options = {}) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  if (options.output) {
    writeFileSync(resolve(options.output), text, { flag: options.force ? 'w' : 'wx', mode: 0o600 });
    process.stderr.write('Wrote ' + plain(resolve(options.output)) + '\n');
  } else process.stdout.write(plain(text) + (text.endsWith('\n') ? '' : '\n'));
}

function loginFor(options, config) {
  if (options.user && options.positional[0] && options.user.toLowerCase() !== options.positional[0].toLowerCase()) throw new Error('Conflicting usernames.');
  const user = options.user || options.positional[0] || config.user;
  if (!user) throw new Error('Choose an account: gh-aura init USER, or pass USER to this command.');
  return validateLogin(user);
}

export async function main(argv = process.argv.slice(2)) {
  let [command = 'help', ...tokens] = argv;
  if (['--help', '-h', 'help'].includes(command)) { process.stdout.write(HELP); return; }
  if (['--version', '-V', 'version'].includes(command)) { process.stdout.write(VERSION + '\n'); return; }
  if (command === 'plan') command = 'audit'; // Compatibility alias, not a second report implementation.
  const spec = SPECS[command];
  if (!spec) throw new Error('Unknown command: ' + command + '. Run gh-aura --help.');
  const options = parseArgs(tokens);
  if (options.help) { emit('Usage: gh-aura ' + spec.usage + '\nOptions: ' + spec.flags.map((flag) => '--' + flag).join(', ') + '\n'); return; }
  if (command === 'apply' && options['dry-run']) throw new Error('apply --dry-run never publishes. Use preview instead.');
  if (options.json) {
    if (options.format) throw new Error('Choose --json or --format, not both.');
    options.format = 'json'; delete options.json;
  }
  for (const key of Object.keys(options)) if (key !== 'positional' && !spec.flags.includes(key)) throw new Error('--' + key + ' is not supported by ' + command + '.');
  if (options.positional.length > spec.max) throw new Error('Too many arguments. Usage: gh-aura ' + spec.usage);
  if (options.format && !['json', 'markdown'].includes(options.format)) throw new Error('--format must be json or markdown.');
  if (options.force && !options.output && !options.save && command !== 'init') throw new Error('--force requires a local output file; it never overrides GitHub revisions.');
  if (command === 'init') {
    if (options.config && options.output) throw new Error('Choose --config or --output, not both.');
    emit('Created ' + initConfig(options.config || options.output, options.force, options.positional[0] || '')); return;
  }
  if (command === 'config') {
    const [action = 'show', key, value] = options.positional;
    const counts = { show: 1, get: 2, set: 3, reset: 2 };
    if (!Object.hasOwn(counts, action) || (options.positional.length || 1) !== counts[action]) throw new Error('Use config show, get KEY, set KEY VALUE, or reset KEY. Quote values containing spaces.');
    if (options['dry-run'] && !['set', 'reset'].includes(action)) throw new Error('--dry-run is only valid for config set/reset.');
    emit(configCommand(action, key, value, { file: options.config, dryRun: options['dry-run'] })); return;
  }
  if (command === 'apply' && options.review) {
    if (options.file || options.approve || options.config) throw new Error('--review cannot be combined with --file, --approve or --config.');
    const review = readReview(options.review);
    if ((options.user || options.positional[0]) && loginFor(options, { user: review.user }).toLowerCase() !== review.user.toLowerCase()) throw new Error('Review belongs to a different user.');
    const draft = readDraft(review.file);
    const result = await applyProfile(await profileTarget(review.user), draft, review.approval);
    emit(options.format === 'json' ? result : result.message + (result.commit ? '\n' + result.commit : '')); return;
  }
  const config = loadConfig(options.config);
  if (command === 'achievements' && !options.user && !options.positional[0] && !config.user) {
    const report = await achievementReport(null, config);
    emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
  }
  const login = loginFor(options, config);
  if (command === 'preview' || command === 'apply') {
    const draft = readDraft(options.file);
    if (command === 'apply' && !options.approve) throw new Error('Publishing requires --approve from preview, or --review FILE.');
    const target = await profileTarget(login);
    if (command === 'preview') {
      emit(previewProfile(target, draft));
      if (options.save) {
        saveReview(options.save, target, options.file, draft, options.force);
        emit('Review saved. Run apply --review with that file only after inspecting this diff.');
      }
    } else {
      const result = await applyProfile(target, draft, options.approve);
      emit(options.format === 'json' ? result : result.message + (result.commit ? '\n' + result.commit : ''));
    }
    return;
  }
  if (options.style) config.profile.style = options.style;
  if (options.goal !== undefined) config.showcase.goal = options.goal;
  if (options.limit !== undefined) config.showcase.limit = Number(options.limit);
  if (options.inspect !== undefined) config.scan.inspectRepos = Number(options.inspect);
  validateConfig(config);
  if (command === 'contributions' && options.all && options.year !== undefined) throw new Error('Choose --all or --year, not both.');
  if (command === 'brief' && options.format === 'markdown') throw new Error('brief exports JSON only.');
  const snapshot = await getSnapshot(login, { maxRepos: config.scan.maxRepos });
  if (!['contributions', 'achievements'].includes(command)) await inspectRepositories(snapshot, config, config.scan.inspectRepos);
  if (command === 'profile') { emit(renderProfile(snapshot, config), options); return; }
  if (command === 'diff') { emit(diffText(snapshot.profileReadme?.content || '', renderProfile(snapshot, config)), options); return; }
  if (command === 'brief') { emit(editorialBrief(snapshot, config), options); return; }
  if (command === 'achievements') {
    const report = await achievementReport(snapshot, config);
    emit(options.format === 'json' ? report : renderAchievementsMarkdown(report), options); return;
  }
  if (command === 'contributions') {
    const report = await contributionsReport(snapshot, { all: options.all, year: options.year === undefined ? undefined : Number(options.year) });
    emit(options.format === 'json' ? report : renderContributions(report), options); return;
  }
  if (command === 'showcase') {
    const ranked = rankRepositories(snapshot, config);
    emit(options.format === 'json' ? ranked : renderShowcaseMarkdown(snapshot.username, ranked), options); return;
  }
  const report = auditProfile(snapshot, config);
  emit(options.format === 'json' ? report : renderAuditMarkdown(report), options);
}

// npm bin links and macOS /var aliases need canonical paths; imports must stay side-effect free.
function isEntryPoint() {
  if (!process.argv[1]) return false;
  try { return pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}

if (isEntryPoint()) {
  process.stdout.on('error', (error) => { if (error.code === 'EPIPE') process.exit(0); else throw error; });
  main().catch((error) => { process.stderr.write('GH Aura: ' + plain(error.message) + '\n'); process.exitCode = 1; });
}

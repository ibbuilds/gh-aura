const COMMON = ['config', 'user'];
const READ = [...COMMON, 'fresh', 'stats', 'budget'];
const DATA = [...READ, 'inspect', 'format', 'output', 'force'];
export const SPECS = {
  references: { usage: 'references [--company NAME] [--json]', flags: ['company', 'format', 'output', 'force'], max: 0 },
  init: { usage: 'init [USER] [--config FILE]', flags: ['config', 'output', 'force'], max: 1 },
  config: { usage: 'config show|get|set|reset [KEY] [VALUE] [--dry-run]', flags: ['config', 'dry-run'], max: 3 },
  audit: { usage: 'audit [USER] [--goal "backend engineer"] [--inspect 3] [--json] [--stats]', flags: [...DATA, 'goal'], max: 1 },
  profile: { usage: 'profile [USER] [--style minimal|regular|flashy | --visual 0..100] [--keep] [-o draft.md]', flags: [...READ, 'style', 'visual', 'inspect', 'output', 'force', 'keep'], max: 1 },
  preview: { usage: 'preview [USER] --file draft.md [--save review.json]', flags: [...COMMON, 'file', 'save', 'force'], max: 1 },
  apply: { usage: 'apply --review review.json [--pr] | apply [USER] --file draft.md --approve CODE [--pr]', flags: [...COMMON, 'file', 'approve', 'review', 'format', 'pr'], max: 1 },
  showcase: { usage: 'showcase [USER] [--goal TEXT] [--limit 6] [--inspect 6]', flags: [...DATA, 'goal', 'limit'], max: 1 },
  achievements: { usage: 'achievements [USER] [--json]', flags: [...READ, 'format', 'output', 'force'], max: 1 },
  contributions: { usage: 'contributions [USER] [--year YYYY | --all | --from YYYY-MM-DD --to YYYY-MM-DD] [--days] [--private] [--recover] [--details]', flags: [...READ, 'year', 'all', 'from', 'to', 'days', 'private', 'recover', 'format', 'output', 'force', 'details'], max: 1 },
  brief: { usage: 'brief [USER] [--prompt] [--style minimal|regular|flashy | --visual 0..100] [-o brief.json]', flags: [...DATA, 'style', 'visual', 'prompt'], max: 1 },
  check: { usage: 'check --file draft.md [--brief brief.json] [--json] [--strict]', flags: ['config', 'file', 'brief', 'format', 'output', 'force', 'strict'], max: 0 },
  diff: { usage: 'diff [USER] [--style minimal|regular|flashy | --visual 0..100]', flags: [...READ, 'style', 'visual', 'output', 'force'], max: 1 },
};
const VALUES = new Set(['config', 'user', 'format', 'output', 'style', 'visual', 'inspect', 'file', 'save', 'approve', 'review', 'goal', 'limit', 'year', 'from', 'to', 'budget', 'brief', 'company']);
const FLAGS = new Set(['help', 'version', 'json', 'force', 'dry-run', 'all', 'fresh', 'keep', 'pr', 'details', 'stats', 'prompt', 'strict', 'days', 'private', 'recover']);
export const HELP = [
  'GH Aura — a GitHub profile toolkit. You choose every change.', '',
  'Start:', '  gh-aura init USER', '  gh-aura audit',
  '  gh-aura profile --output draft.md',
  '  gh-aura preview --file draft.md --save review.json',
  '  gh-aura apply --review review.json', '',
  'Explore:', '  showcase       Recommend projects to pin',
  '  achievements   Explore badges and relevant public evidence',
  '  contributions  Inspect annual activity and visibility checks',
  '  brief --prompt Export grounded instructions for any writer',
  '  check          Check a draft locally before reviewing it',
  '  references     Browse sourced working-engineer profile examples (offline)',
  '  config         Read or change local preferences', '',
  'Use gh-aura COMMAND --help for options. No command runs in the background.',
  'Only apply writes to GitHub. Add --stats to a read command to measure its cost.',
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

export function validateOptions(command, options) {
  const spec = SPECS[command];
  if (command === 'apply' && options['dry-run']) throw new Error('apply --dry-run never publishes. Use preview instead.');
  if (options.json) {
    if (options.format) throw new Error('Choose --json or --format, not both.');
    options.format = 'json'; delete options.json;
  }
  for (const key of Object.keys(options)) if (key !== 'positional' && !spec.flags.includes(key)) throw new Error('--' + key + ' is not supported by ' + command + '.');
  if (options.positional.length > spec.max) throw new Error('Too many arguments. Usage: gh-aura ' + spec.usage);
  if (options.format && !['json', 'markdown'].includes(options.format)) throw new Error('--format must be json or markdown.');
  if (options.force && !options.output && !options.save && command !== 'init') throw new Error('--force requires a local output file; it never overrides GitHub revisions.');
  if (options.visual !== undefined && options.style) throw new Error('Choose --visual or --style, not both.');
  if (options.visual !== undefined && (!/^\d+$/.test(options.visual) || Number(options.visual) > 100)) throw new Error('--visual must be an integer from 0 to 100.');
  if (options.budget !== undefined && (!/^\d+$/.test(options.budget) || Number(options.budget) < 1 || Number(options.budget) > 500)) throw new Error('--budget must be an integer from 1 to 500.');
  if (command === 'contributions' && options.all && options.year !== undefined) throw new Error('Choose --all or --year, not both.');
  if (command === 'contributions' && (options.from !== undefined || options.to !== undefined) && (options.all || options.year !== undefined)) throw new Error('Choose --from/--to or --year/--all, not both.');
  if (command === 'contributions' && options.year !== undefined && !/^\d{4}$/.test(options.year)) throw new Error('--year must be a four-digit year.');

  if (command === 'brief' && ((options.prompt && options.format === 'json') || (!options.prompt && options.format === 'markdown'))) throw new Error('brief exports JSON; use --prompt for writing instructions, without --json.');
}

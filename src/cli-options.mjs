const COMMON = ['config', 'user'];
const READ = [...COMMON, 'fresh', 'stats', 'budget'];
const DATA = [...READ, 'inspect', 'deep', 'format', 'output', 'force'];
export const SPECS = {
  'badge-run': { usage: 'badge-run plan --repo OWNER/PRIVATE_REPO [--pulls 2] [--start 0] [--no-quickdraw] --output badges.json | badge-run apply --review badges.json --confirm FINGERPRINT', flags: ['repo','pulls','start','no-quickdraw','role','output','force','review','confirm'], max: 1 },
  calendar: { usage: 'activity plan [YEAR] [--from YYYY --to YYYY] [--density 0..100] [--growth 0..100] [--weekends 0..100] [--intensity 1..6] [--existing actual.json] [--output plan.json] | activity apply --review plan.json [--repo OWNER/PRIVATE_WORKSPACE] --author-name NAME --author-email VERIFIED_EMAIL --confirm FINGERPRINT', flags: ['year','from','to','density','growth','weekends','intensity','seed','mode','role','existing','output','force','review','repo','confirm','author-name','author-email'], max: 2 },
  story: { usage: 'story list | story set OWNER/REPO --contribution TEXT [--proof URL] | story remove OWNER/REPO', flags: ['config', 'dry-run', 'problem', 'contribution', 'tradeoffs', 'outcome', 'proof'], max: 2 },
  work: { usage: 'work preview --repo OWNER/REPO --path README.md --file draft.md [--save review.json] | work apply --review review.json', flags: ['repo', 'path', 'file', 'save', 'review', 'private', 'force', 'format'], max: 1 },
  references: { usage: 'references [--company NAME] [--json]', flags: ['company', 'format', 'output', 'force'], max: 0 },
  init: { usage: 'init [USER] [--config FILE]', flags: ['config', 'output', 'force'], max: 1 },
  config: { usage: 'config show|get|set|reset [KEY] [VALUE] [--dry-run]', flags: ['config', 'dry-run'], max: 3 },
  audit: { usage: 'audit [USER] [--goal "backend engineer"] [--job vacancy.txt] [--inspect 3] [--deep 2] [--json]', flags: [...DATA, 'goal', 'job', 'checks'], max: 1 },
  profile: { usage: 'profile [USER] [--style minimal|regular|flashy | --visual 0..100] [--language en|es] [--keep] [-o draft.md]', flags: [...READ, 'style', 'visual', 'language', 'inspect', 'output', 'force', 'keep'], max: 1 },
  preview: { usage: 'preview [USER] --file draft.md [--save review.json]', flags: [...COMMON, 'file', 'save', 'force'], max: 1 },
  apply: { usage: 'apply --review review.json [--pr] | apply [USER] --file draft.md --approve CODE [--pr]', flags: [...COMMON, 'file', 'approve', 'review', 'format', 'pr'], max: 1 },
  showcase: { usage: 'showcase [USER] [--goal TEXT] [--limit 6] [--inspect 3] [--deep 2]', flags: [...DATA, 'goal', 'limit', 'checks'], max: 1 },
  achievements: { usage: 'achievements [USER] [--scope all|free|attainable] [--plan] [--badge ID] [--private] [--prepare ID --repo OWNER/NAME]', flags: [...READ, 'format', 'output', 'force', 'scope', 'plan', 'badge', 'private', 'prepare', 'repo'], max: 1 },
  contributions: { usage: 'contributions [USER] [--year YYYY | --all | --from YYYY-MM-DD --to YYYY-MM-DD] [--local PATH --emails-file FILE] [--days] [--recover] [--plan]', flags: [...READ, 'year', 'all', 'from', 'to', 'days', 'private', 'recover', 'plan', 'local', 'emails-file', 'format', 'output', 'force', 'details'], max: 1 },
  brief: { usage: 'brief [USER] [--prompt] [--style minimal|regular|flashy | --visual 0..100] [-o brief.json]', flags: [...DATA, 'style', 'visual', 'language', 'prompt', 'checks'], max: 1 },
  check: { usage: 'check --file draft.md [--brief brief.json] [--json] [--strict]', flags: ['config', 'file', 'brief', 'format', 'output', 'force', 'strict'], max: 0 },
  diff: { usage: 'diff [USER] [--style minimal|regular|flashy | --visual 0..100]', flags: [...READ, 'style', 'visual', 'output', 'force'], max: 1 },
};
const VALUES = new Set(['config', 'user', 'format', 'output', 'style', 'visual', 'inspect', 'file', 'save', 'approve', 'review', 'goal', 'limit', 'year', 'from', 'to', 'budget', 'brief', 'company', 'scope', 'badge', 'deep', 'prepare', 'repo', 'language', 'job', 'local', 'emails-file', 'path', 'problem', 'contribution', 'tradeoffs', 'outcome', 'proof', 'density', 'growth', 'weekends', 'intensity', 'seed', 'mode', 'role', 'existing', 'confirm', 'author-name', 'author-email', 'pulls', 'start']);
const FLAGS = new Set(['help', 'version', 'json', 'force', 'dry-run', 'all', 'fresh', 'keep', 'pr', 'details', 'stats', 'prompt', 'strict', 'days', 'private', 'recover', 'plan', 'checks', 'no-quickdraw']);
export const HELP = [
  'GH Aura — simple GitHub profile CLI. You choose every change.', '',
  'One-time setup:',
  '  gh-aura init USER', '',
  'Four primary actions:',
  '  gh-aura activity 2022       Inspect observed activity for a year',
  '  gh-aura badges free         Explore no-cost achievement opportunities',
  '  gh-aura badges auto        Plan private workspace exercises',
  '  gh-aura readme minimal      Generate a profile README draft',
  '  gh-aura pins                Recommend projects to feature',
  '  gh-aura activity plan 2022 --density 65 --output plan.json', ''
  'Review and publish a README:',
  '  gh-aura readme minimal --output draft.md',
  '  gh-aura preview --file draft.md --save review.json',
  '  gh-aura apply --review review.json --pr', '',
  'More: audit, work, story, check, brief, config, references.',
  'Details: gh-aura COMMAND --help. No background jobs or automatic profile writes.',
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
  if (options.language && !['en', 'es'].includes(options.language)) throw new Error('--language must be en or es.');
  if (options.visual !== undefined && options.style) throw new Error('Choose --visual or --style, not both.');
  if (options.visual !== undefined && (!/^\d+$/.test(options.visual) || Number(options.visual) > 100)) throw new Error('--visual must be an integer from 0 to 100.');
  if (options.budget !== undefined && (!/^\d+$/.test(options.budget) || Number(options.budget) < 1 || Number(options.budget) > 500)) throw new Error('--budget must be an integer from 1 to 500.');
  if (options.deep !== undefined && (!/^\d+$/.test(options.deep) || Number(options.deep) > 5)) throw new Error('--deep must be 0–5.');
  if (command === 'contributions' && options.all && options.year !== undefined) throw new Error('Choose --all or --year, not both.');
  if (command === 'contributions' && (options.from !== undefined || options.to !== undefined) && (options.all || options.year !== undefined)) throw new Error('Choose --from/--to or --year/--all, not both.');
  if (command === 'achievements' && options.scope && !['all', 'free', 'attainable'].includes(options.scope)) throw new Error('--scope must be all, free, or attainable.');
  if (command === 'achievements' && options.prepare) {
    if (!options.repo) throw new Error('--prepare requires an explicit --repo OWNER/NAME.');
    if (options.plan || options.badge || options.scope) throw new Error('--prepare cannot be combined with --plan, --badge or --scope.');
    if (options.user || options.positional.length) throw new Error('Use --repo with --prepare, not a profile username.');
  }
  if (command === 'achievements' && options.repo && !options.prepare) throw new Error('--repo requires --prepare BADGE_ID.');


  if (command === 'badge-run') {
    const action = options.positional[0];
    const planKeys = ['repo','pulls','start','no-quickdraw','role','output','force'];
    if (action === 'plan') {
      if (options.review || options.confirm) {
        throw Error('badges auto plan accepts --repo OWNER/PRIVATE_REPO, optionally --pulls, --start and --output.');
      }
      for(const [key,min,max] of [['pulls',0,16],['start',0,1024]]) {
        if(options[key]!==undefined&&(!/^\d+$/.test(options[key])||Number(options[key])<min||Number(options[key])>max)){
          throw Error('--'+key+' must be an integer '+min+'..'+max+'.');
        }
      }
    } else if (action === 'apply') {
      if (!options.review || !/^[a-f0-9]{64}$/i.test(options.confirm||'') ||
          planKeys.some(key=>options[key]!==undefined)) {
        throw Error('badge-run apply requires --review FILE and --confirm FINGERPRINT only.');
      }
    } else {
      throw Error('Use badge-run plan or badge-run apply.');
    }
  }
  if (command === 'calendar') {
    const [action, shorthand] = options.positional;
    const planning = ['year','from','to','density','growth','weekends','intensity','seed','mode','role','existing','output','force'];
    const applying = ['review','repo','confirm','author-name','author-email'];
    if (!['plan','apply'].includes(action)) throw Error('Use activity plan [YEAR] or activity apply --review FILE.');
    if (action === 'plan') {
      if (shorthand && (!/^\d{4}$/.test(shorthand) || options.year || options.from || options.to)) {
        throw Error('Use one year (activity plan 2022), or --from/--to, not both.');
      }
      if (shorthand) options.year = shorthand;
      if ((options.year && (options.from || options.to)) || applying.some(k=>options[k]!==undefined)) {
        throw Error('activity plan accepts date/density options only, not remote write arguments.');
      }
      if (options.year && !/^\d{4}$/.test(String(options.year))) throw Error('--year must be YYYY.');
    } else if (options.positional.length !== 1 ||
        !['review','confirm','author-name','author-email'].every(k=>options[k]) ||
        planning.some(k=>options[k]!==undefined)) {
      throw Error('activity apply requires --review FILE --confirm FINGERPRINT --author-name NAME --author-email VERIFIED_EMAIL (optional --repo OWNER/PRIVATE_WORKSPACE).');
    }
  }
  if (command === 'story') {
    const [action] = options.positional;
    const editable = ['problem', 'contribution', 'tradeoffs', 'outcome', 'proof'];
    if (!['list', 'set', 'remove'].includes(action)) {
      throw new Error('Use story list, story set OWNER/REPO --contribution TEXT, or story remove OWNER/REPO.');
    }
    if (action === 'list' && (options.positional.length !== 1 || options['dry-run'] ||
        editable.some((key) => options[key] !== undefined))) {
      throw new Error('story list takes no project or edit flags.');
    }
    if (action === 'set' && (options.positional.length !== 2 ||
        !editable.some((key) => options[key] !== undefined))) {
      throw new Error('story set requires OWNER/REPO and at least one --contribution/--problem/--tradeoffs/--outcome/--proof flag.');
    }
    if (action === 'remove' && (options.positional.length !== 2 ||
        editable.some((key) => options[key] !== undefined))) {
      throw new Error('story remove needs only OWNER/REPO, optionally --dry-run.');
    }
  }
  if (command === 'work') {
    const action = options.positional[0];
    if (!['preview', 'apply'].includes(action)) {
      throw new Error('Use work preview --repo OWNER/REPO --path README.md --file draft.md, or work apply --review FILE.');
    }
    if (action === 'preview' && (!options.repo || !options.path || !options.file ||
        options.review || options.format)) {
      throw new Error('work preview requires --repo OWNER/REPO, --path README.md (or docs/...), and --file draft.md. Only --save saves a review.');
    }
    if (action === 'apply' && (!options.review || options.repo || options.path || options.file ||
        options.save || options.private || options.force)) {
      throw new Error('work apply requires only --review REVIEW.json; repo, path and draft are bound to that review.');
    }
  }
  if (command === 'contributions' && options['emails-file'] && !options.local) throw new Error('--emails-file requires --local PATH.');
  if (command === 'contributions' && options.local && (options.year !== undefined || options.all || options.private || options.days || options.details || options.plan)) throw new Error('--local is offline; use only --from, --to, --recover, or --emails-file with it.');
  if (command === 'contributions' && options.year !== undefined && !/^\d{4}$/.test(options.year)) throw new Error('--year must be a four-digit year.');

  if (command === 'brief' && ((options.prompt && options.format === 'json') || (!options.prompt && options.format === 'markdown'))) throw new Error('brief exports JSON; use --prompt for writing instructions, without --json.');
}

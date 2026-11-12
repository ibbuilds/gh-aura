import { loadConfig } from './config.mjs';
import { configCommand } from './config-cli.mjs';

const FIELDS = ['problem', 'contribution', 'tradeoffs', 'outcome', 'proof'];

/**
 * A local-only, human-provided description of real individual project work.
 * Never treated as independently GitHub-verified ownership.
 */
export function storyCommand(action, repo, options = {}) {
  const config = loadConfig(options.config);
  const stories = config.profile.projectStories;
  if (action === 'list') {
    if (!stories.length) return 'No project stories yet. Add one with: gh-aura story set OWNER/REPO --contribution "What I built"\n';
    return stories.map((x) => {
      const values = FIELDS.filter((field) => x[field])
        .map((field) => '  ' + field + ': ' + x[field]);
      return x.repo + '\n' + values.join('\n');
    }).join('\n\n') + '\n\nUser-supplied claims; evidence links do not certify personal ownership.\n';
  }
  if (typeof repo !== 'string' || !repo.trim()) {
    throw new Error('Supply the project name as OWNER/REPO or REPO.');
  }
  const match = (x) => x.repo.toLowerCase() === repo.toLowerCase();
  const current = stories.find(match);
  if (action === 'remove') {
    if (!current) return 'No project story configured for ' + repo + '.\n';
    return configCommand('set', 'profile.projectStories',
      JSON.stringify(stories.filter((x) => !match(x))),
      { file: options.config, dryRun: options['dry-run'] });
  }
  if (action !== 'set') throw new Error('Use story list, story set, or story remove.');
  const edit = Object.fromEntries(FIELDS.filter((field) => options[field] !== undefined)
    .map((field) => [field, options[field]]));
  if (!Object.keys(edit).length) {
    throw new Error('story set needs at least one of --problem, --contribution, --tradeoffs, --outcome, --proof.');
  }
  const next = current ? stories.map((x) => match(x) ? { ...x, ...edit } : x)
    : [...stories, { repo, ...edit }];
  return configCommand('set', 'profile.projectStories', JSON.stringify(next),
    { file: options.config, dryRun: options['dry-run'] });
}

import { readFileSync, statSync } from 'node:fs';
import { initConfig, loadConfig } from '../config.mjs';
import { configCommand } from '../config-cli.mjs';
import { emit } from '../output.mjs';

export async function run(command, options) {
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
  if (command === 'references') {
    const { referenceReport, renderReferenceReport } = await import('../reference.mjs');
    const data = referenceReport(options.company || '');
    emit(options.format === 'json' ? data : renderReferenceReport(data), options);
    return;
  }
  if (!options.file) throw new Error('Specify a Markdown draft with --file.');
  if (statSync(options.file).size > 256 * 1024) throw new Error('Draft exceeds 256 KiB.');
  const draft = readFileSync(options.file, 'utf8');
  let brief = null;
  if (options.brief) {
    if (statSync(options.brief).size > 128 * 1024) throw new Error('Brief exceeds 128 KiB.');
    brief = JSON.parse(readFileSync(options.brief, 'utf8'));
  }
  const { checkDraft, renderDraftCheck } = await import('../editorial.mjs');
  const maxWords = options.config ? loadConfig(options.config).editorial.maxWords : brief?.editorial?.maxWords ?? loadConfig().editorial.maxWords;
  const report = checkDraft(draft, brief, { maxWords });
  emit(options.format === 'json' ? report : renderDraftCheck(report), options);
  if (options.strict && report.findings.length) process.exitCode = 1;
}

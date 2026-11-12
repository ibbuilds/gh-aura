import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { renderProfile } from '../src/render.mjs';
import { parseArgs, validateOptions } from '../src/cli-options.mjs';
import { snapshotForTest } from './fixtures.mjs';

function scenario(language, style) {
  const config = structuredClone(DEFAULT_CONFIG);
  config.editorial.language = language;
  config.profile.style = style;
  config.profile.visual = -1;
  config.profile.featured = ['backend-toolkit'];
  config.profile.projectStories = [{
    repo: 'example/backend-toolkit',
    problem: 'Deploying an API',
    contribution: 'Implemented authentication',
    tradeoffs: 'Kept the interface small',
    outcome: 'Shipped a working API',
    proof: 'https://github.com/example/backend-toolkit',
  }];
  config.profile.technologies = ['TypeScript'];
  config.profile.sections.technologies = true;
  config.profile.sections.stats = true;
  return { config, snapshot: snapshotForTest() };
}

test('Spanish labels are localized but project claims and source URLs remain untouched', () => {
  for (const style of ['minimal', 'regular', 'flashy']) {
    const { config, snapshot } = scenario('es', style);
    const output = renderProfile(snapshot, config);
    assert.match(output, /Implemented authentication/);
    assert.match(output, /https:\/\/github.com\/example\/backend-toolkit/);
    assert.match(output, /Tecnologías/);
    assert.match(output, /Resumen de repositorios públicos/);
    assert.doesNotMatch(output, /Public repository snapshot|Languages in public repositories/);
    if (style === 'minimal') assert.match(output, /Trabajo seleccionado|Mi trabajo/);
    if (style === 'regular') assert.match(output, /\| Proyecto \| Descripción \| Mi contribución \|/);
    if (style === 'flashy') assert.match(output, /Decisiones y compromisos técnicos/);
  }
});

test('English templates retain existing headings and user content', () => {
  for (const style of ['minimal', 'regular', 'flashy']) {
    const { config, snapshot } = scenario('en', style);
    const output = renderProfile(snapshot, config);
    assert.match(output, /Implemented authentication/);
    assert.match(output, /Technologies/);
    assert.match(output, /Public repository snapshot/);
  }
});

test('language is a validated, per-invocation option and unrelated commands reject it', () => {
  validateOptions('profile', parseArgs(['--language', 'es']));
  validateOptions('brief', parseArgs(['--language', 'en']));
  assert.throws(() => validateOptions('profile', parseArgs(['--language', 'fr'])), /language must be en or es/);
  assert.throws(() => validateOptions('audit', parseArgs(['--language', 'es'])), /not supported/);
});

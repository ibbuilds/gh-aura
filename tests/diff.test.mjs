import test from 'node:test';
import assert from 'node:assert/strict';
import { diffText } from '../src/diff.mjs';

test('reports unchanged README without a misleading diff', () => {
  assert.equal(diffText('# Me\n', '# Me\n'), 'No changes.\n');
});

test('marks genuine added and removed lines', () => {
  const result = diffText('# Before\nOld bio\n', '# After\nNew bio\n');
  assert.match(result, /-Old bio/);
  assert.match(result, /\+New bio/);
  assert.match(result, /--- existing profile README/);
});

test('does not exhaust memory for massive READMEs', () => {
  assert.match(diffText('x\n'.repeat(700), 'y\n'), /exceeds 600 lines/);
});

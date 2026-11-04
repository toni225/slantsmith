// Run: node --experimental-strip-types test/scheme.test.ts
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../src/engines/model.ts';
import { RhymeEngine } from '../src/engines/rhyme.ts';
import { detectScheme } from '../src/app/rhyme/scheme.ts';

const dir = new URL('../src/assets/model/en-us/', import.meta.url);
const bin = (f: string) => new Uint8Array(readFileSync(new URL(f, dir)));
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
const model = loadModel(readFileSync(new URL('lexicon.txt', dir), 'utf8'), bin('phones.bin'), bin('meta.bin'), bin('commonness.bin'), manifest.sounds);
const engine = new RhymeEngine(model);

test('FR-22 acceptance: night/day/light/way reads A B A B', () => {
  const letters = detectScheme(engine, ['night', 'day', 'light', 'way']).map((r) => r.letter);
  assert.deepEqual(letters, ['A', 'B', 'A', 'B']);
});

test('blank line endings get no letter', () => {
  const result = detectScheme(engine, ['night', '', 'light']);
  assert.deepEqual(result.map((r) => r.letter), ['A', null, 'A']);
});

test('a group only known as slant once matched stays slant for its founder too', () => {
  const result = detectScheme(engine, ['soul', 'hold']); // slant, not perfect
  assert.equal(result[0].letter, result[1].letter);
  assert.equal(result[0].type, 'slant');
  assert.equal(result[1].type, 'slant');
});

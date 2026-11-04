// Run: node --experimental-strip-types test/syllables.test.ts
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../src/engines/model.ts';
import { syllableCount } from '../src/app/rhyme/syllables.ts';

const dir = new URL('../src/assets/model/en-us/', import.meta.url);
const bin = (f: string) => new Uint8Array(readFileSync(new URL(f, dir)));
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
const model = loadModel(readFileSync(new URL('lexicon.txt', dir), 'utf8'), bin('phones.bin'), bin('meta.bin'), bin('commonness.bin'), manifest.sounds);

test('syllable counts for known words', () => {
  assert.equal(syllableCount(model, 'hold'), 1);
  assert.equal(syllableCount(model, 'controlled'), 2);
  assert.equal(syllableCount(model, 'beautiful'), 3);
});

test('unknown word returns undefined', () => {
  assert.equal(syllableCount(model, 'malibuzz'), undefined);
});

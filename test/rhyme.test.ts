// Run: node --experimental-strip-types test/rhyme.test.ts
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../src/engines/model.ts';
import { RhymeEngine } from '../src/engines/rhyme.ts';

const dir = new URL('../src/assets/model/en-us/', import.meta.url);
const bin = (f: string) => new Uint8Array(readFileSync(new URL(f, dir)));
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
const model = loadModel(readFileSync(new URL('lexicon.txt', dir), 'utf8'), bin('phones.bin'), bin('meta.bin'), bin('commonness.bin'), manifest.sounds);
const engine = new RhymeEngine(model);

const rows = readFileSync(new URL('./slantsmith_rhyme_test_set.csv', import.meta.url), 'utf8')
  .trim().split('\n').slice(1).map((l) => l.trim().split(','))
  .map(([input, expected, type, top]) => ({ input, expected, type, top: Number(top) }));

const SMALL = new Set(['as', 'the', 'to', 'your', 'it', 'of', 'and', 'so']);
function passes(r: (typeof rows)[number]): boolean {
  if (r.type === 'multi') {
    const ins = r.input.split(' ').filter((w) => !SMALL.has(w)), exp = r.expected.split(' ').filter((w) => !SMALL.has(w));
    return ins.every((w, i) => engine.rhymes(w).perfect.slice(0, r.top).some((x) => x.word === exp[i]));
  }
  const res = engine.rhymes(r.input);
  if (r.type === 'unknown') {
    // A guessed word passes when its top results rhyme with the expected word, i.e. the sound guess is right.
    const same = new Set([r.expected, ...engine.rhymes(r.expected).perfect.map((x) => x.word)]);
    return res.perfect.slice(0, r.top).some((x) => same.has(x.word));
  }
  const list = r.type === 'perfect' ? res.perfect : res.slant.filter((x) => x.type === r.type);
  return list.slice(0, r.top).some((x) => x.word === r.expected);
}

const group = (t: string) => (['assonance', 'consonance', 'family', 'additive', 'subtractive'].includes(t) ? 'slant' : t);
const tally: Record<string, { pass: number; total: number; misses: string[] }> = {};
for (const r of rows) {
  const g = (tally[group(r.type)] ??= { pass: 0, total: 0, misses: [] });
  g.total++;
  if (passes(r)) g.pass++; else g.misses.push(`${r.input}>${r.expected}`);
}

const NEED: Record<string, number> = { perfect: 0.95, slant: 0.8, multi: 0.7, unknown: 0.6 };
for (const [g, t] of Object.entries(tally)) {
  test(`${g}: ${t.pass}/${t.total} pass (need ${NEED[g] * 100}%)`, () => {
    assert.ok(t.pass / t.total >= NEED[g], `misses: ${t.misses.slice(0, 15).join(' ')}`);
  });
}

test('lookups are fast (p95 under 100 ms)', () => {
  const times = rows.map((r) => { const t = performance.now(); engine.rhymes(r.input.split(' ')[0]); return performance.now() - t; }).sort((a, b) => a - b);
  assert.ok(times[Math.floor(times.length * 0.95)] < 100);
});

test('explicit words can be hidden', () => {
  const all = engine.rhymes('duck').perfect.map((x) => x.word);
  const clean = engine.rhymes('duck', true).perfect.map((x) => x.word);
  assert.ok(all.length > clean.length && clean.every((w) => !model.explicit(model.ids.get(w)!)));
});

test('dictionary words CMU lacks are in the model, flagged estimated', () => {
  assert.ok(model.ids.has('aahed') && engine.rhymes('aahed').estimated);
  assert.ok(!engine.rhymes('walking').estimated);
  const id = (w: string) => model.ids.get(w)!;
  // Inflections are built on their base, so a plural rhymes like its singular plus "z".
  assert.deepEqual([...model.phones[id('cartographers')]].slice(0, -1), [...model.phones[id('cartographer')]]);
});

test('compounds also rhyme on their last part', () => {
  const words = (w: string) => engine.rhymes(w).perfect.map((x) => x.word);
  assert.ok(words('heartstrings').includes('things'));
  assert.ok(words('waterfall').includes('call'));
  assert.ok(words('daydreams').includes('seems'));
});

test('dropped-g words rhyme like the full word', () => {
  assert.deepEqual(engine.rhymes("runnin'").perfect.slice(0, 5), engine.rhymes('running').perfect.slice(0, 5));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRES } from '../src/app/chords/genres.ts';
import { chordFor, chordFrequencies, extend, numeralAt, DIATONIC, EXTENSIONS } from '../src/engines/chords.ts';

const sym = (nums: string[], root: number, mode: 'major' | 'minor') => nums.map((n) => chordFor(n, root, mode).symbol);

test('diatonic chords of C major and A minor', () => {
  assert.deepEqual(sym(DIATONIC.major, 0, 'major'), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  assert.deepEqual(sym(DIATONIC.minor, 9, 'minor'), ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
});

test('flat keys spell with flats, sharp keys with sharps', () => {
  assert.deepEqual(sym(['I', 'IV', 'V', 'vi'], 10, 'major'), ['Bb', 'Eb', 'F', 'Gm']);
  assert.deepEqual(sym(['I', 'IV', 'V', 'vi'], 2, 'major'), ['D', 'G', 'A', 'Bm']);
  assert.deepEqual(sym(['i', 'iv', 'v'], 2, 'minor'), ['Dm', 'Gm', 'Am']); // D minor lives in the flat key of F major
});

test('borrowed, seventh and diminished chords', () => {
  assert.equal(chordFor('bVII', 0, 'major').symbol, 'Bb');
  assert.equal(chordFor('V7', 7, 'major').symbol, 'D7');
  assert.deepEqual(chordFor('V7', 0, 'major').semitones, [0, 4, 7, 10]);
  assert.equal(chordFor('ii7', 0, 'major').symbol, 'Dm7');
  assert.equal(chordFor('Imaj7', 0, 'major').symbol, 'Cmaj7');
  assert.equal(chordFor('vii°', 0, 'major').symbol, 'Bdim');
});

test('bad numerals throw; A4 is 440 Hz', () => {
  assert.throws(() => chordFor('IX', 0, 'major'));
  assert.ok(Math.abs(chordFrequencies('vi', 0, 'major')[0] - 220) < 0.01); // Am root = A3
});

test('every genre preset parses in every key', () => {
  for (const g of GENRES) for (const p of g.presets) for (let root = 0; root < 12; root++) {
    for (const n of p.numerals) assert.ok(chordFor(n, root, p.mode).symbol, `${g.id} ${n}`);
  }
});

test('extensions follow the key: maj7 on I and IV, dominant on V, m7 on ii, half-dim on vii', () => {
  const C = (n: string, ext: any) => chordFor(extend(n, ext, 'major'), 0, 'major').symbol;
  assert.deepEqual(['I', 'ii', 'IV', 'V', 'vi', 'vii°'].map((n) => C(n, '7')), ['Cmaj7', 'Dm7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']);
  assert.deepEqual(['I', 'ii', 'V'].map((n) => C(n, '9')), ['Cmaj9', 'Dm9', 'G9']);
  assert.deepEqual(['I', 'V', 'vi'].map((n) => C(n, '13')), ['Cmaj13', 'G13', 'Am13']);
  assert.deepEqual(['I', 'ii', 'V'].map((n) => C(n, '6')), ['C6', 'Dm6', 'G6']);
  assert.deepEqual(['I', 'ii'].map((n) => C(n, 'sus4')), ['Csus4', 'Dsus4']);
  assert.equal(C('I', 'add9'), 'Cadd9');
  assert.equal(chordFor(extend('VII', '7', 'minor'), 9, 'minor').symbol, 'G7'); // A minor: VII is G, dominant
  assert.equal(chordFor(extend('VI', '7', 'minor'), 9, 'minor').symbol, 'Fmaj7');
});

test('chord notes: names and intervals', () => {
  assert.deepEqual(chordFor('Imaj9', 0, 'major').notes, ['C', 'E', 'G', 'B', 'D']);
  assert.deepEqual(chordFor('V13', 0, 'major').semitones, [0, 4, 7, 10, 14, 21]);
  assert.deepEqual(chordFor('I11', 0, 'major').semitones, [0, 7, 10, 14, 17]); // no third
  assert.deepEqual(chordFor('Isus2', 0, 'major').notes, ['C', 'D', 'G']);
});

test('every extension of every diatonic chord parses in every key and mode', () => {
  for (const mode of ['major', 'minor'] as const) for (let root = 0; root < 12; root++) for (const e of EXTENSIONS) {
    for (const n of DIATONIC[mode]) assert.ok(chordFor(extend(n, e.id, mode), root, mode).notes.length >= 3, `${n} ${e.id}`);
  }
});

test('diminished chord takes colours; 6/9 and sus with 7th or 9th', () => {
  const B = (e: any) => chordFor(extend('vii°', e, 'major'), 0, 'major').symbol;
  assert.deepEqual(['6', '7', '9', '11', '13', 'sus2', 'sus4', 'add9'].map(B), ['Bdim7', 'Bm7b5', 'Bm9b5', 'Bm11b5', 'Bm13b5', 'Bsus2', 'Bsus4', 'Bdimadd9']);
  assert.deepEqual(chordFor('Bdim7'.length ? 'vii°7' : '', 0, 'major').semitones, [0, 3, 6, 9]);
  const C = (n: string, e: any) => chordFor(extend(n, e, 'major'), 0, 'major');
  assert.equal(C('I', '6/9').symbol, 'C6/9');
  assert.deepEqual(C('I', '6/9').notes, ['C', 'E', 'G', 'A', 'D']);
  assert.equal(C('V', '7sus4').symbol, 'G7sus4');
  assert.deepEqual(C('V', '9sus4').notes, ['G', 'C', 'D', 'F', 'A']);
  assert.equal(C('ii', '6/9').symbol, 'Dm6/9');
});

test('circle of fifths: every major and minor chord has a numeral in every key', () => {
  for (const mode of ['major', 'minor'] as const) for (let root = 0; root < 12; root++) for (let n = 0; n < 12; n++) for (const minor of [false, true]) {
    const c = chordFor(numeralAt(n, minor, mode), root, mode);
    assert.equal(c.root, (root + n) % 12);
    assert.equal(c.semitones[1], minor ? 3 : 4);
  }
  const C = (n: number, minor: boolean) => chordFor(numeralAt(n, minor, 'major'), 0, 'major').symbol;
  assert.deepEqual([0, 7, 5, 10, 3, 6].map((n) => C(n, false)), ['C', 'G', 'F', 'Bb', 'Eb', 'F#']);
  assert.deepEqual([9, 4, 2, 6, 1, 10].map((n) => C(n, true)), ['Am', 'Em', 'Dm', 'F#m', 'C#m', 'Bbm']);
  assert.equal(numeralAt(9, true, 'major'), 'vi'); // in-key chords keep their plain numeral
});

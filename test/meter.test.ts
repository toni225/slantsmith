import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onBeat, patternName, tempoFromTaps } from '../src/app/songs/meter.ts';
import { songStats } from '../src/app/songs/stats.ts';

test('meter: pattern names, stresses on the beat', () => {
  assert.equal(patternName([0, 1, 0, 1, 0, 1]), 'da-DUM (iambic)');
  assert.equal(patternName([1, 0, 1, 0, 2, 0]), 'DUM-da (trochaic)');
  assert.equal(patternName([1, 1, 0, 0, 1]), null);
  assert.equal(patternName([0, 1]), null); // too short to call
  assert.deepEqual(onBeat([1, 0, 1, 0, 0, 1]), { on: 2, of: 3, offset: 0 });
  assert.deepEqual(onBeat([0, 1, 0, 1]), { on: 2, of: 2, offset: 1 }); // "and HOLD it TIGHT" starts as a pickup
});

test('tap tempo: average gap, old taps ignored, needs three taps', () => {
  assert.equal(tempoFromTaps([0, 500, 1000, 1500]), 120);
  assert.equal(tempoFromTaps([0, 600]), null);
  assert.equal(tempoFromTaps([0, 600, 9000, 9500, 10000]), 120); // the pause starts a new count
});

test('song stats: counts, repeated words without the small ones', () => {
  const s = songStats([
    { id: '1', name: 'Verse', text: 'Hold on, hold on\nI will hold you\n' },
    { id: '2', name: 'Chorus', text: 'you and the night\nthe night' },
  ]);
  assert.deepEqual([s.sections, s.lines, s.words, s.uniqueWords], [2, 4, 14, 8]);
  assert.deepEqual(s.topWords, [{ word: 'hold', count: 3 }, { word: 'night', count: 2 }]);
});

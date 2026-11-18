import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartLines, maskChords, segments, usedChords } from '../src/app/songs/chordpro.ts';

test('chords over words: mask keeps positions, segments split at chords', () => {
  assert.equal(maskChords('[Am]Hold on'), '    Hold on');
  assert.deepEqual(segments('[Am]Hold on to[F]night'), [{ chord: 'Am', text: 'Hold on to' }, { chord: 'F', text: 'night' }]);
  assert.deepEqual(segments('no chords'), [{ chord: '', text: 'no chords' }]);
  assert.deepEqual(segments('Hold [G]'), [{ chord: '', text: 'Hold ' }, { chord: 'G', text: '' }]);
});

test('chart lines put each chord over its letter; usedChords lists each once', () => {
  assert.deepEqual(chartLines('[Am]Hold on to[F]night'), ['Am        F', 'Hold on tonight']);
  assert.deepEqual(chartLines('[Cmaj7]I[G]go'), ['Cmaj7 G', 'I     go']); // a long chord pushes the words
  assert.deepEqual(chartLines('plain'), ['plain']);
  assert.deepEqual(usedChords('[Am]a [F]b [Am]c'), ['Am', 'F']);
});

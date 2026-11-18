import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareSections, diffLines } from '../src/app/songs/compare.ts';

const kinds = (d: { kind: string; text: string }[]) => d.map((l) => `${l.kind[0]}:${l.text}`);

test('line diff keeps shared lines and marks the rest', () => {
  assert.deepEqual(kinds(diffLines(['a', 'b', 'c'], ['a', 'x', 'c', 'd'])), ['s:a', 'r:b', 'a:x', 's:c', 'a:d']);
  assert.deepEqual(kinds(diffLines([], ['a'])), ['a:a']);
  assert.deepEqual(kinds(diffLines(['a'], [])), ['r:a']);
});

test('sections match by id: renamed, edited, added, removed, chords', () => {
  const take = [
    { id: '1', name: 'Verse 1', text: 'hold on\nlet go' },
    { id: '2', name: 'Chorus', text: 'sing' },
    { id: '3', name: 'Bridge', text: 'gone' },
  ];
  const now = [
    { id: '1', name: 'Verse', text: 'hold on\nhold tight', chords: 'C  G' },
    { id: '2', name: 'Chorus', text: 'sing' },
    { id: '4', name: 'Outro', text: 'bye' },
  ];
  const d = compareSections(take, now);
  assert.deepEqual(d.map((s) => [s.name, s.status, s.was]), [
    ['Verse', 'changed', 'Verse 1'], ['Chorus', 'same', undefined], ['Outro', 'added', undefined], ['Bridge', 'removed', undefined],
  ]);
  assert.deepEqual(kinds(d[0].lines), ['a:Chords: C  G', 's:hold on', 'r:let go', 'a:hold tight']);
});

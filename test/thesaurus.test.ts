import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { Dictionary, Thesaurus } from '../src/engines/thesaurus.ts';

const th = new Thesaurus(readFileSync(new URL('../src/assets/model/en-us/thesaurus.txt', import.meta.url), 'utf8'));

test('thesaurus: groups by meaning, inflected words find their base', () => {
  const happy = th.lookup('Happy')!;
  assert.equal(happy.base, 'happy');
  assert.ok(happy.groups.some((g) => g.kind === 'same' && g.words.includes('glad')));
  assert.ok(th.lookup('cold')!.groups[0].words.includes('icy'));
  const run = th.lookup('run')!.groups;
  assert.ok(run.some((g) => g.kind === 'kinds' && g.words.includes('sprint'))); // verb meanings too
  assert.ok(run.some((g) => g.kind === 'broader' && g.words.includes('hurry')));
  assert.equal(th.lookup('happier')?.base, 'happy');
  assert.equal(th.lookup('hugged')?.base, 'hug'); // doubled consonant undone
  assert.equal(th.lookup('kissed')?.base, 'kiss');
  assert.equal(th.lookup('zzqx'), null);
});

test('dictionary: gzipped file unzips, words list meanings by part of speech', () => {
  const dict = new Dictionary(gunzipSync(readFileSync(new URL('../src/assets/model/en-us/dictionary.txt.gz', import.meta.url))).toString('utf8'));
  const run = dict.lookup('running')!;
  assert.equal(run.base, 'running'); // WordNet lists running itself
  const ran = dict.lookup('runs')!;
  assert.equal(ran.base, 'run');
  assert.ok(ran.meanings.length > 40 && ran.meanings.some((m) => m.pos === 'v') && ran.meanings.some((m) => m.pos === 'n'));
  assert.ok(ran.meanings.every((m) => m.definition.length > 3));
  assert.ok(dict.lookup('happy')!.meanings.every((m) => m.pos === 'a')); // satellite adjectives read as adjectives
  assert.equal(dict.lookup('zzqx'), null);
  assert.equal(dict.lookup('ran')?.base, 'run'); // irregular forms from WordNet
  assert.equal(dict.lookup('geese')?.base, 'goose');
  assert.equal(dict.lookup('hearts')?.also, 'heart'); // a word of its own (the card game), and heart + s
  assert.equal(dict.lookup('heart')?.also, null);

  // Like a book: neighbours, pages by letter, random words.
  const heart = dict.lookup('heart')!;
  assert.ok(heart.prev! < 'heart' && heart.next! > 'heart');
  assert.equal(dict.lookup(heart.next!)!.prev, 'heart');
  const p1 = dict.browse('h', 1);
  assert.equal(p1.words.length, 40);
  assert.ok(p1.words.every((w) => w.word[0] === 'h' && w.gloss.length > 3) && p1.pages > 10);
  assert.equal(dict.browse('h', 9999).page, p1.pages); // clamped
  const page = dict.browse('h', dict.pageOf('heart')).words;
  assert.equal(page.find((w) => w.word === 'heart')?.gloss, heart.meanings[0].definition);
  assert.ok(dict.random((w) => w.startsWith('q')).startsWith('q'));
});

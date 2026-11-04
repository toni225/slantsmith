import type { Model } from '../../engines/model';

// shortcut: duplicates rhyme.ts's vowel set rather than exporting it; merge if a third user needs it.
const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);

export function syllableCount(model: Model, word: string): number | undefined {
  const id = model.ids.get(word.toLowerCase());
  if (id === undefined) return undefined;
  const phones = model.phones[id];
  let n = 0;
  for (const b of phones) if (VOWELS.has(model.sounds[b & 63])) n++;
  return n;
}

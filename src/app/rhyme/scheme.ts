import type { RhymeEngine } from '../../engines/rhyme';
import type { SchemeLetter } from './rhyme-protocol';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function rhymeTypeBetween(engine: RhymeEngine, a: string, b: string): 'perfect' | 'slant' | null {
  const r = engine.rhymes(a);
  if (r.perfect.some((x) => x.word === b)) return 'perfect';
  if (r.slant.some((x) => x.word === b)) return 'slant';
  return null;
}

// FR-22: rhyme letters A, B, C... per line ending, grouped by rhyme (perfect beats slant
// when a line matches more than one earlier group). Blank line endings get no letter.
export function detectScheme(engine: RhymeEngine, endings: string[]): SchemeLetter[] {
  const groups: { words: string[]; letter: string; type: 'perfect' | 'slant' | null }[] = [];
  const result: SchemeLetter[] = [];
  for (const word of endings) {
    if (!word) { result.push({ letter: null, type: null }); continue; }
    let best: { group: (typeof groups)[number]; type: 'perfect' | 'slant' } | null = null;
    for (const group of groups) {
      for (const gw of group.words) {
        const type = rhymeTypeBetween(engine, word, gw);
        if (type === 'perfect') { best = { group, type }; break; }
        if (type === 'slant' && !best) best = { group, type };
      }
      if (best?.type === 'perfect') break;
    }
    if (best) {
      best.group.words.push(word);
      if (best.type === 'perfect' || best.group.type === null) best.group.type = best.type;
      result.push({ letter: best.group.letter, type: best.group.type });
    } else {
      const letter = LETTERS[groups.length % LETTERS.length];
      groups.push({ words: [word], letter, type: null });
      result.push({ letter, type: null });
    }
  }
  // Backfill: a group's type is only known once a 2nd member joins it; apply it to the founder too.
  const byLetter = new Map(groups.map((g) => [g.letter, g.type]));
  return result.map((r) => (r.letter ? { ...r, type: byLetter.get(r.letter) ?? null } : r));
}

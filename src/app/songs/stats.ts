// Song stats for the editor: counts, the words used most, line lengths, rhyme kinds.
// Plain functions, erasable syntax only, so test/stats.test.ts runs them in Node.
import type { Section } from './song.model';

// Small words every song repeats; left out of "words you use most".
const SMALL = new Set(`a an the and or but so if of to in on at by for from with as is am are was were be been
  i i'm i'll i've i'd me my mine you you're your yours he him his she her it it's its we us our they them their
  this that these those there here what when where who how all no not do does did don't can can't will won't
  just like oh ooh yeah la na hey got get`.split(/\s+/));

export interface SongStats {
  sections: number;
  lines: number;
  words: number;
  uniqueWords: number;
  topWords: { word: string; count: number }[];
}

export function songStats(sections: Section[]): SongStats {
  // The editor passes lyrics with [chords] already blanked out (maskChords), so chords are not words.
  const lines = sections.flatMap((s) => s.text.split('\n')).filter((l) => l.trim());
  const words = lines.flatMap((l) => l.toLowerCase().match(/[a-z']+/g) ?? []);
  const counts = new Map<string, number>();
  for (const w of words) if (!SMALL.has(w) && w.length > 1) counts.set(w, (counts.get(w) ?? 0) + 1);
  const topWords = [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([word, count]) => ({ word, count }));
  return { sections: sections.length, lines: lines.length, words: words.length, uniqueWords: new Set(words).size, topWords };
}

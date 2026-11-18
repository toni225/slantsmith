// Thesaurus: synonyms grouped by meaning, from thesaurus.txt (tools/build_word_model.py load_thesaurus).
// Erasable syntax only, so Node runs it in test/thesaurus.test.ts.

// same: words with this meaning; kinds: kinds of it (kiss -> peck); broader: what it is a kind of (kiss -> touch).
export type GroupKind = 'same' | 'kinds' | 'broader';
export interface SynonymGroup { kind: GroupKind; words: string[] }
export interface Synonyms { base: string; groups: SynonymGroup[] } // base: the dictionary form looked up
const KIND: Record<string, GroupKind> = { '=': 'same', '<': 'kinds', '>': 'broader' };

// WordNet lists base forms (walk, happy), so an inflected word tries its likely bases in turn.
const ENDINGS: [string, string][] = [
  ['ies', 'y'], ['ied', 'y'], ['ier', 'y'], ['iest', 'y'], ['es', ''], ['s', ''], ['ed', ''], ['ed', 'e'],
  ['ing', ''], ['ing', 'e'], ['er', ''], ['er', 'e'], ['est', ''], ['est', 'e'],
];

function findBase(input: string, has: (w: string) => boolean): string | undefined {
  return findBases(input, has)[0];
}

// Every listed word the input could be, the input itself first: hearts -> hearts (the card game), heart.
function findBases(input: string, has: (w: string) => boolean): string[] {
  const word = input.toLowerCase().trim();
  const tries = [word];
  for (const [end, add] of ENDINGS) {
    if (word.length > end.length + 2 && word.endsWith(end)) {
      const stem = word.slice(0, -end.length);
      tries.push(stem + add);
      if (!add && /([^aeiou])\1$/.test(stem)) tries.push(stem.slice(0, -1)); // running -> run
    }
  }
  return [...new Set(tries.filter(has))];
}

function entries(lines: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of lines) {
    const bar = line.indexOf('|');
    if (bar > 0) map.set(line.slice(0, bar), line.slice(bar + 1));
  }
  return map;
}

export class Thesaurus {
  private entries: Map<string, string>;

  constructor(text: string) {
    this.entries = entries(text.split('\n'));
  }

  lookup(input: string): Synonyms | null {
    const base = findBase(input, (t) => this.entries.has(t));
    return base ? { base, groups: this.entries.get(base)!.split(';').map((g) => ({ kind: KIND[g[0]], words: g.slice(1).split(',') })) } : null;
  }
}

// Definitions, from dictionary.txt.gz (build_word_model.py load_dictionary): a block of meanings
// ("n|a running race"), a blank line, then words listing their meanings' line numbers in base 36
// (or "@run" for an irregular form pointing at its base).
export type PartOfSpeech = 'n' | 'v' | 'a' | 'r'; // noun, verb, adjective, adverb
export interface Meaning { pos: PartOfSpeech; definition: string }
// prev/next: the headwords either side in A-Z order, for flipping through like a book.
// also: another word the input may be a form of (hearts is a card game, and also heart + s).
export interface Definitions { base: string; meanings: Meaning[]; prev: string | null; next: string | null; also: string | null }
// A book page: each word with its first meaning, like a printed dictionary's short gloss.
export interface PageWord { word: string; pos: PartOfSpeech; gloss: string }
export interface BrowsePage { letter: string; page: number; pages: number; words: PageWord[] }
export const PAGE_SIZE = 40;

export class Dictionary {
  private meanings: string[];
  private words: Map<string, string>;
  readonly headwords: string[]; // A-Z, words with meanings of their own (not ran -> run pointers)
  private position = new Map<string, number>();

  constructor(text: string) {
    const [meanings, words] = text.split('\n\n');
    this.meanings = meanings.split('\n');
    this.words = entries(words.split('\n'));
    this.headwords = [...this.words].filter(([, v]) => v[0] !== '@').map(([w]) => w).sort();
    this.headwords.forEach((w, i) => this.position.set(w, i));
  }

  lookup(input: string): Definitions | null {
    const resolve = (w: string) => (this.words.get(w)![0] === '@' ? this.words.get(w)!.slice(1) : w); // irregular form: ran -> run
    const bases = [...new Set(findBases(input, (t) => this.words.has(t)).map(resolve))];
    if (!bases.length) return null;
    const base = bases[0];
    const at = this.position.get(base)!;
    return {
      base,
      meanings: this.words.get(base)!.split(',').map((i) => this.meaning(i)),
      prev: this.headwords[at - 1] ?? null,
      next: this.headwords[at + 1] ?? null,
      also: bases[1] ?? null,
    };
  }

  private meaning(i: string): Meaning {
    const line = this.meanings[parseInt(i, 36)];
    return { pos: line[0] as PartOfSpeech, definition: line.slice(2) };
  }

  /** One page of the words starting with a letter; page is clamped to the ones that exist. */
  browse(letter: string, page: number, size = PAGE_SIZE): BrowsePage {
    const all = this.headwords.filter((w) => w[0] === letter);
    const pages = Math.max(1, Math.ceil(all.length / size));
    const p = Math.min(Math.max(1, page), pages);
    const words = all.slice((p - 1) * size, p * size).map((word) => {
      const first = this.meaning(this.words.get(word)!.split(',')[0]);
      return { word, pos: first.pos, gloss: first.definition };
    });
    return { letter, page: p, pages, words };
  }

  /** The page a word sits on, so "back to the page" opens where the word is. */
  pageOf(word: string, size = PAGE_SIZE): number {
    return Math.floor(this.headwords.filter((w) => w[0] === word[0] && w < word).length / size) + 1;
  }

  /** A random headword that passes keep (tried up to 500 times, then any word). */
  random(keep: (w: string) => boolean = () => true, rand: () => number = Math.random): string {
    for (let i = 0; i < 500; i++) {
      const w = this.headwords[Math.floor(rand() * this.headwords.length)];
      if (keep(w)) return w;
    }
    return this.headwords[Math.floor(rand() * this.headwords.length)];
  }
}

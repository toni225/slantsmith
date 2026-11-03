// Rhyme engine (Phase 3 spec, "Rhyme engine"). Pure functions over a loaded Model.
import type { Model } from './model.ts';

export type RhymeType = 'perfect' | 'assonance' | 'consonance' | 'family' | 'additive' | 'subtractive';
export interface Rhyme { word: string; type: RhymeType; score: number; why: string }
export interface RhymeResult { word: string; estimated: boolean; perfect: Rhyme[]; slant: Rhyme[] }

interface Split { onset: string; vowel: string; tail: string[]; multi: boolean }

// Height (0 low - 3 high), backness (0 front - 2 back), rounding.
const VOWEL: Record<string, [number, number, number]> = {
  IY: [3, 0, 0], IH: [2.5, 0, 0], EY: [2, 0, 0], EH: [1.5, 0, 0], AE: [1, 0, 0], AY: [0.5, 1, 0],
  AH: [1, 1, 0], ER: [1.5, 1, 0], AA: [0, 2, 0], AO: [0.5, 2, 1], AW: [0.5, 1.5, 1], OY: [1, 2, 1],
  OW: [1.5, 2, 1], UH: [2.5, 2, 1], UW: [3, 2, 1],
};
// Place (0 lips - 7 throat), manner, voiced.
const CONS: Record<string, [number, string, number]> = {
  P: [0, 'stop', 0], B: [0, 'stop', 1], M: [0, 'nasal', 1], W: [0, 'glide', 1], F: [1, 'fric', 0], V: [1, 'fric', 1],
  TH: [2, 'fric', 0], DH: [2, 'fric', 1], T: [3, 'stop', 0], D: [3, 'stop', 1], N: [3, 'nasal', 1], S: [3, 'fric', 0],
  Z: [3, 'fric', 1], L: [3, 'liquid', 1], R: [3, 'liquid', 1], SH: [4, 'fric', 0], ZH: [4, 'fric', 1],
  CH: [4, 'affr', 0], JH: [4, 'affr', 1], Y: [5, 'glide', 1], K: [6, 'stop', 0], G: [6, 'stop', 1], NG: [6, 'nasal', 1],
  HH: [7, 'fric', 0],
};
const SAY: Record<string, string> = {
  IY: 'ee', IH: 'ih', EY: 'ay', EH: 'eh', AE: 'a', AY: 'eye', AH: 'uh', ER: 'er', AA: 'ah', AO: 'aw', AW: 'ow',
  OY: 'oy', OW: 'oh', UH: 'u', UW: 'oo', JH: 'j', HH: 'h', DH: 'th',
};
const say = (s: string) => SAY[s] ?? s.toLowerCase();
const isVowel = (s: string) => s in VOWEL;
const MAX = 50;

// ADR-08: the dictionary is inconsistent here and most US speakers merge these.
function normVowel(v: string, next: string | undefined): string {
  if (v === 'AO') return 'AA';
  if (next === 'R' && v === 'IY') return 'IH';
  if (next === 'R' && v === 'UW') return 'UH';
  return v;
}

export class RhymeEngine {
  private splits: Split[];
  private byKey = new Map<string, number[]>();
  private byVowel = new Map<string, number[]>();
  private byTail = new Map<string, number[]>();
  private suffixKeys?: Map<string, Map<string, number>>;
  private m: Model;

  constructor(m: Model) {
    this.m = m;
    this.splits = m.phones.map((p) => this.split(p));
    this.splits.forEach((s, id) => {
      push(this.byKey, key(s), id);
      if (!s.multi) {
        push(this.byVowel, s.vowel, id);
        if (s.tail.length) push(this.byTail, s.tail.join(' '), id);
      }
    });
  }

  private split(p: Uint8Array): Split {
    const sym = Array.from(p, (b) => this.m.sounds[b & 63]);
    const stress = Array.from(p, (b) => b >> 6);
    let i = stress.lastIndexOf(1);
    if (i < 0) i = stress.lastIndexOf(2);
    if (i < 0) i = sym.map(isVowel).lastIndexOf(true);
    const tail = sym.slice(i + 1).map((s, j) => (isVowel(s) && stress[i + 1 + j] === 0 ? 'AH' : s));
    return { onset: sym[i - 1] ?? '', vowel: normVowel(sym[i], sym[i + 1]), tail, multi: tail.some(isVowel) };
  }

  rhymes(input: string, hideExplicit = false): RhymeResult {
    const word = input.toLowerCase().trim();
    let id = this.m.ids.get(word);
    if (id === undefined && /in'?$/.test(word)) id = this.m.ids.get(word.replace(/in'?$/, 'ing'));
    const s = id !== undefined ? this.splits[id] : this.estimate(word);
    if (!s) return { word, estimated: true, perfect: [], slant: [] };
    const keep = (c: number) => c !== id && !(hideExplicit && this.m.explicit(c)) && this.m.words[c] !== word;
    return { word, estimated: id === undefined, perfect: this.perfect(s, keep), slant: s.multi ? [] : this.slant(s, keep) };
  }

  // Rhymes for each stressed content word of a phrase; the UI combines them.
  phrase(text: string, hideExplicit = false): RhymeResult[] {
    return text.split(/\s+/).filter((w) => w && !SMALL.has(w.toLowerCase())).map((w) => this.rhymes(w, hideExplicit));
  }

  private perfect(s: Split, keep: (c: number) => boolean): Rhyme[] {
    return (this.byKey.get(key(s)) ?? [])
      .filter((c) => keep(c) && this.splits[c].onset !== s.onset)
      .sort((a, b) => this.m.commonness[b] - this.m.commonness[a])
      .slice(0, MAX)
      .map((c) => ({ word: this.m.words[c], type: 'perfect' as const, score: 100, why: `Same ${say(s.vowel)}${s.tail.length ? ' + ' + s.tail.map(say).join('') : ''} sound` }));
  }

  private slant(s: Split, keep: (c: number) => boolean): Rhyme[] {
    const seen = new Set<number>();
    const out: (Rhyme & { rank: number })[] = [];
    for (const c of [...(this.byVowel.get(s.vowel) ?? []), ...(this.byTail.get(s.tail.join(' ')) ?? [])]) {
      if (seen.has(c) || !keep(c)) continue;
      seen.add(c);
      const t = this.splits[c];
      const type = classify(s, t);
      if (!type) continue;
      const score = 100 - 40 * vowelDistance(s.vowel, t.vowel) - 35 * tailDistance(s.tail, t.tail) - 10 * Math.abs(s.tail.length - t.tail.length);
      out.push({ word: this.m.words[c], type, score: Math.round(score), why: explain(type, s, t), rank: score + (40 * this.m.commonness[c]) / 255 });
    }
    const perType = new Map<RhymeType, number>();
    return out
      .sort((a, b) => b.rank - a.rank)
      .filter((r) => { const n = perType.get(r.type) ?? 0; perType.set(r.type, n + 1); return n < MAX; })
      .map(({ rank, ...r }) => r);
  }

  // shortcut: guesses the rhyme part from the longest spelling ending shared with known words; real letter-to-sound rules if testers find it weak.
  private estimate(word: string): Split | undefined {
    if (!this.suffixKeys) {
      this.suffixKeys = new Map();
      this.m.words.forEach((w, id) => {
        const k = key(this.splits[id]);
        for (let n = 2; n <= 8 && n <= w.length; n++) {
          const sk = ending(w, n);
          const counts = this.suffixKeys!.get(sk) ?? new Map<string, number>();
          counts.set(k, (counts.get(k) ?? 0) + 1 + this.m.commonness[id] / 64);
          this.suffixKeys!.set(sk, counts);
        }
      });
    }
    // Slang spellings: skrrt -> skrt, thicc -> thick.
    for (const w of [word, word.replace(/cc$/, 'ck').replace(/(.)\1+/g, '$1')]) {
      for (let n = Math.min(8, w.length); n >= 2; n--) {
        const counts = this.suffixKeys.get(ending(w, n));
        if (!counts) continue;
        const best = [...counts].sort((a, b) => b[1] - a[1])[0][0];
        const [vowel, ...tail] = best.split(' ').filter(Boolean);
        return { onset: '?', vowel, tail, multi: tail.some(isVowel) };
      }
    }
    return undefined;
  }
}

const SMALL = new Set('a an the to of in on at for and or but my your his her its our their i you he she we they it is was be me us them with from by so as that this'.split(' '));

// Spelling ending plus whether a vowel letter comes before it, so "ham" does not borrow from "team".
function ending(w: string, n: number) { return w.slice(-n) + (/[aeiouy]/.test(w[w.length - n - 1] ?? '') ? '+v' : '+c'); }
function key(s: Split) { return s.vowel + ' ' + s.tail.join(' '); }
function push(m: Map<string, number[]>, k: string, v: number) { (m.get(k) ?? m.set(k, []).get(k)!).push(v); }

// Same rules as the 300-item test set generator, so tests and engine agree.
function classify(a: Split, b: Split): RhymeType | null {
  const ta = a.tail, tb = b.tail;
  if (ta[0] === 'R' || tb[0] === 'R') return null;
  if (a.vowel === b.vowel) {
    if (ta.join() === tb.join()) return null;
    if (ta.length === 1 && tb.length === 1 && sameKind(ta[0], tb[0])) return 'family';
    if (tb.length === ta.length + 1 && tb.slice(0, ta.length).join() === ta.join()) return 'additive';
    if (ta.length === tb.length + 1 && ta.slice(0, tb.length).join() === tb.join()) return 'subtractive';
    if (ta.length && ta.length === tb.length && !sameKind(ta.at(-1)!, tb.at(-1)!)) return 'assonance';
    return null;
  }
  const merged = [['IH', 'IY'], ['UH', 'UW'], ['AA', 'AO']].some((p) => p.includes(a.vowel) && p.includes(b.vowel));
  return !merged && ta.length && ta.join() === tb.join() ? 'consonance' : null;
}

function sameKind(x: string, y: string) {
  const a = CONS[x], b = CONS[y];
  return !!a && !!b && ['stop', 'fric', 'nasal'].includes(a[1]) && a[1] === b[1] && a[2] === b[2];
}

function vowelDistance(x: string, y: string) {
  const a = VOWEL[x], b = VOWEL[y];
  return (Math.abs(a[0] - b[0]) / 3 + Math.abs(a[1] - b[1]) / 2 + Math.abs(a[2] - b[2])) / 3;
}

function tailDistance(x: string[], y: string[]) {
  const n = Math.max(x.length, y.length);
  if (!n) return 0;
  let d = 0;
  for (let i = 1; i <= n; i++) {
    const a = CONS[x[x.length - i]], b = CONS[y[y.length - i]];
    d += !a || !b ? 1 : (Math.abs(a[0] - b[0]) / 7 + (a[1] === b[1] ? 0 : 1) + (a[2] === b[2] ? 0 : 0.5)) / 2.5;
  }
  return d / n;
}

function explain(type: RhymeType, a: Split, b: Split): string {
  switch (type) {
    case 'subtractive': return `Drops the final ${say(a.tail.at(-1)!)}`;
    case 'additive': return `Adds ${say(b.tail.at(-1)!)} at the end`;
    case 'consonance': return `Same ${a.tail.map(say).join('')} ending, new vowel`;
    case 'family': return `Same ${say(a.vowel)} vowel, ${say(a.tail[0])} becomes ${say(b.tail[0])}`;
    case 'assonance': return `Same ${say(a.vowel)} vowel, ends in ${b.tail.map(say).join('')}`;
    default: return 'Same sound';
  }
}

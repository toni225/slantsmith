// Meter of a lyric line: which syllables are stressed, and whether they land on the beat.
// Plain functions, erasable syntax only, so test/meter.test.ts runs them in Node.

// Stress per syllable, as the word model has it: 1 main, 2 secondary, 0 none.
export interface WordStress { word: string; stress: number[] }

const strong = (s: number) => s === 1;

// "da-DUM da-DUM" names, when the whole line keeps one pattern. Secondary stress may go either way.
export function patternName(stress: number[]): string | null {
  if (stress.length < 4) return null;
  const fits = (first: boolean) => stress.every((s, i) => s === 2 || strong(s) === ((i % 2 === 0) === first));
  if (fits(false)) return 'da-DUM (iambic)';
  if (fits(true)) return 'DUM-da (trochaic)';
  return null;
}

// Tap-along plays one syllable per half beat. A line may start on the beat (offset 0) or half a beat
// early, as a pickup (offset 1: "and HOLD it TIGHT"); we take whichever puts more stresses on the beat.
// on/of: how many of the line's stressed syllables land on a beat.
export function onBeat(stress: number[]): { on: number; of: number; offset: 0 | 1 } {
  const count = (offset: number) => stress.filter((s, i) => strong(s) && (i + offset) % 2 === 0).length;
  const of = stress.filter(strong).length;
  const [a, b] = [count(0), count(1)];
  return b > a ? { on: b, of, offset: 1 } : { on: a, of, offset: 0 };
}

// Beats per minute from tap times (ms): the average gap of the last few taps.
// A pause over 2 seconds starts a new count, so an old tap never drags the tempo.
export function tempoFromTaps(taps: number[]): number | null {
  const recent: number[] = [];
  for (let i = taps.length - 1; i >= 0 && recent.length < 6; i--) {
    if (recent.length && recent[0] - taps[i] > 2000) break;
    recent.unshift(taps[i]);
  }
  if (recent.length < 3) return null;
  const gap = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
  return Math.max(40, Math.min(220, Math.round(60000 / gap)));
}

// Chord theory for the Chords page: pure functions, no UI. Erasable syntax only (see CLAUDE.md).
export type Mode = 'major' | 'minor';

const SCALE: Record<Mode, number[]> = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Major tonics whose key signature is flats (F, Bb, Eb, Ab, Db); everything else spells with sharps.
const FLAT_KEYS = new Set([5, 10, 3, 8, 1]);
const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export interface Chord { symbol: string; semitones: number[]; root: number; notes: string[] } // semitones are above the chord's own root
// Note names for a key, spelled with flats or sharps the way its key signature does.
export function spelling(root: number, mode: Mode): string[] {
  const major = mode === 'major' ? root : (root + 3) % 12;
  return FLAT_KEYS.has(major) ? FLAT : SHARP;
}

// Notes stacked on top of the root and fifth, in semitones above the root. 6/7/9/11/13 are the extensions.
const EXTRA: Record<string, number[]> = {
  '6': [9], '7': [10], 'maj7': [11], '9': [10, 14], 'maj9': [11, 14],
  '11': [10, 14, 17], '13': [10, 14, 21], 'maj13': [11, 14, 21], 'add9': [14], '6/9': [9, 14],
};
// Half-diminished (minor 7th, flat 5th) with its extensions, and the sus chords that carry a 7th or 9th.
const HALF_DIM: Record<string, number[]> = { 'ø': [0, 3, 6, 10], 'ø9': [0, 3, 6, 10, 14], 'ø11': [0, 3, 6, 10, 14, 17], 'ø13': [0, 3, 6, 10, 14, 21] };
const NUMERAL = /^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(°7|°add9|°|ø13|ø11|ø9|ø|maj7|maj9|maj13|13|11|9|7sus4|9sus4|7|6\/9|6|sus2|sus4|add9)?$/;

// "ii", "V7", "bVII", "vii°", "Imaj9", "Isus4" in a key -> the chord to play. Case = major/minor, as in roman-numeral analysis.
export function chordFor(numeral: string, root: number, mode: Mode): Chord {
  const m = NUMERAL.exec(numeral);
  if (!m) throw new Error(`bad numeral: ${numeral}`);
  const [, acc, letters, suffix = ''] = m;
  const degree = DEGREES.indexOf(letters.toUpperCase());
  const lower = letters === letters.toLowerCase();
  const at = (root + SCALE[mode][degree] + (acc === 'b' ? -1 : acc === '#' ? 1 : 0) + 12) % 12;
  const names = acc === 'b' ? FLAT : acc === '#' ? SHARP : spelling(root, mode); // a written b or # picks its own spelling
  const name = names[at];
  const q = lower ? 'm' : '';
  let semitones: number[];
  let symbol: string;
  if (suffix === '°') { semitones = [0, 3, 6]; symbol = name + 'dim'; }
  else if (suffix === '°7') { semitones = [0, 3, 6, 9]; symbol = name + 'dim7'; }
  else if (suffix === '°add9') { semitones = [0, 3, 6, 14]; symbol = name + 'dimadd9'; }
  else if (suffix in HALF_DIM) { semitones = HALF_DIM[suffix]; symbol = name + 'm' + (suffix === 'ø' ? '7' : suffix.slice(1)) + 'b5'; }
  else if (suffix.includes('sus')) {
    semitones = [0, suffix.endsWith('sus2') ? 2 : 5, 7, ...(suffix.length > 4 ? [10, ...(suffix[0] === '9' ? [14] : [])] : [])];
    symbol = suffix.length > 4 ? name + suffix[0] + 'sus4' : name + suffix;
  }
  else {
    semitones = [0, lower ? 3 : 4, 7, ...(EXTRA[suffix] ?? [])];
    // A major 11th chord drops its third: it grinds against the 11th.
    if (suffix === '11' && !lower) semitones.splice(1, 1);
    symbol = name + (suffix.startsWith('maj') && lower ? `m(${suffix})` : suffix.startsWith('maj') ? suffix : q + suffix);
  }
  return { symbol, semitones, root: at, notes: semitones.map((s) => names[(at + s) % 12]) };
}

// The 7 chords built on each scale degree, as numerals: C major is C Dm Em F G Am Bdim.
export const DIATONIC: Record<Mode, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
};

// The numeral for a chord whose root is `semis` above the key's tonic, in or out of the key: lets the
// circle of fifths play all 24 major and minor chords. Out-of-key roots are written flat for major chords
// and sharp for minor ones (Bb, Eb, but F#m, C#m), the way players usually name them.
export function numeralAt(semis: number, minor: boolean, mode: Mode): string {
  const sc = SCALE[mode];
  const n = ((semis % 12) + 12) % 12;
  let d = sc.indexOf(n);
  let acc = '';
  const flat = () => { if (d < 0) { d = sc.indexOf(n + 1); if (d >= 0) acc = 'b'; } };
  const sharp = () => { if (d < 0) { d = sc.indexOf(n - 1); if (d >= 0) acc = '#'; } };
  if (minor ? n === 10 : n !== 6) { flat(); sharp(); } else { sharp(); flat(); }
  return acc + (minor ? DEGREES[d].toLowerCase() : DEGREES[d]);
}

export type Extension = 'triad' | '6' | '6/9' | '7' | '9' | '11' | '13' | 'sus2' | 'sus4' | '7sus4' | '9sus4' | 'add9';
export const EXTENSIONS: { id: Extension; label: string; note: string }[] = [
  { id: 'triad', label: 'Triad', note: 'Three notes: root, third, fifth. The plain sound.' },
  { id: '6', label: '6th', note: 'Adds the 6th. Sweet and settled; a classic way to end a song.' },
  { id: '6/9', label: '6/9', note: 'Adds the 6th and 9th together. Lush and relaxed; no 7th.' },
  { id: '7', label: '7th', note: 'Adds the 7th that fits the key. Warmer, a little unresolved.' },
  { id: '9', label: '9th', note: 'Stacks a 9th on the 7th. Smooth: the R&B and jazz colour.' },
  { id: '11', label: '11th', note: 'Adds an 11th. Wide and hanging. Major chords drop the third so it does not clash.' },
  { id: '13', label: '13th', note: 'Adds a 13th. Rich and full, the top of the jazz stack.' },
  { id: 'sus2', label: 'sus2', note: 'Swaps the third for the 2nd. Open, neither happy nor sad.' },
  { id: 'sus4', label: 'sus4', note: 'Swaps the third for the 4th. Hangs in the air and wants to resolve.' },
  { id: '7sus4', label: '7sus4', note: 'A sus4 with the 7th on top. Floating, a favourite in soul and funk.' },
  { id: '9sus4', label: '9sus4', note: 'A sus4 with the 7th and 9th. Open and modern.' },
  { id: 'add9', label: 'add9', note: 'Triad plus the 9th, no 7th. Bright and airy.' },
];

// A diatonic numeral given a colour: "V" + 9 -> "V9", "I" + 9 -> "Imaj9", "ii" + 7 -> "ii7".
// The 7th is major or minor to match the key (the scale note a 7th above the root decides).
export function extend(numeral: string, ext: Extension, mode: Mode): string {
  if (ext === 'triad') return numeral;
  const m = NUMERAL.exec(numeral);
  if (!m) throw new Error(`bad numeral: ${numeral}`);
  if (m[3] === '°') {
    const base = m[1] + m[2]; // the diminished chord: 6 is the fully diminished 7th, 7/9/11/13 are half-diminished
    if (ext === '6') return base + '°7';
    if (ext === 'add9') return base + '°add9';
    if (ext === '6/9' || ext === '7sus4' || ext === '9sus4') return numeral;
    return ext === 'sus2' || ext === 'sus4' ? base + ext : base + 'ø' + (ext === '7' ? '' : ext);
  }
  if (ext === 'sus2' || ext === 'sus4' || ext === 'add9' || ext === '6' || ext === '6/9' || ext === '7sus4' || ext === '9sus4') return numeral + ext;
  const d = DEGREES.indexOf(m[2].toUpperCase());
  // A minor chord always takes the minor 7th; a major chord takes the 7th the scale gives it.
  const major7 = m[2] !== m[2].toLowerCase() && (SCALE[mode][(d + 6) % 7] - SCALE[mode][d] + 12) % 12 === 11;
  return numeral + (major7 && ext !== '11' ? 'maj' : '') + ext; // an 11th chord is named plain: C11, not Cmaj11
}

// Frequencies of the chord, its root kept in one octave (C3 = 48) so chords sit together when played in turn.
export function chordFrequencies(numeral: string, root: number, mode: Mode): number[] {
  const c = chordFor(numeral, root, mode);
  return c.semitones.map((s) => 440 * 2 ** ((48 + c.root + s - 69) / 12));
}

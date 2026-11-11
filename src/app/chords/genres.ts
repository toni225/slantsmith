import type { Mode } from '../../engines/chords';

export interface Preset { numerals: string[]; mode: Mode; note?: string }
export interface Genre { id: string; name: string; tip: string; presets: Preset[] }

// Common progressions per genre, as roman numerals so they follow whatever key is picked.
// Tips are general songwriting practice, not rules: every genre breaks its own habits.
export const GENRES: Genre[] = [
  {
    id: 'pop', name: 'Pop',
    tip: 'Four chords on a loop carry most pop. The verse and chorus often share them; the chorus lifts by changing the order or the melody, not by adding chords.',
    presets: [
      { numerals: ['I', 'V', 'vi', 'IV'], mode: 'major', note: 'The most-used pop loop' },
      { numerals: ['vi', 'IV', 'I', 'V'], mode: 'major', note: 'Same chords, starts on the minor for a moodier verse' },
      { numerals: ['I', 'vi', 'IV', 'V'], mode: 'major', note: '1950s doo-wop, still everywhere' },
    ],
  },
  {
    id: 'rock', name: 'Rock',
    tip: 'Strong, simple roots and power chords. Borrowing the flat seventh (bVII) from the minor scale gives that open, anthemic rock sound.',
    presets: [
      { numerals: ['I', 'IV', 'V'], mode: 'major', note: 'Three-chord rock' },
      { numerals: ['I', 'bVII', 'IV', 'I'], mode: 'major', note: 'Mixolydian, the classic rock turn' },
      { numerals: ['i', 'VII', 'VI', 'VII'], mode: 'minor', note: 'Minor rock riff-style loop' },
    ],
  },
  {
    id: 'blues', name: 'Blues',
    tip: 'The 12-bar blues: four bars on the I, two on the IV, back to the I, then the V and IV as a turnaround. Play every chord as a seventh.',
    presets: [
      { numerals: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], mode: 'major', note: '12 bars, one chord per bar' },
    ],
  },
  {
    id: 'jazz', name: 'Jazz',
    tip: 'The ii-V-I is the building block: tension on the V7 resolving home to the I. Seventh chords everywhere; the chord quality, not the root, carries the colour.',
    presets: [
      { numerals: ['ii7', 'V7', 'Imaj7'], mode: 'major', note: 'The jazz cadence' },
      { numerals: ['Imaj7', 'vi7', 'ii7', 'V7'], mode: 'major', note: 'Turnaround: loops back to the I' },
      { numerals: ['ii°', 'V7', 'i'], mode: 'minor', note: 'Minor ii-V-i' },
    ],
  },
  {
    id: 'hiphop', name: 'Hip-hop and trap',
    tip: 'Two to four chords, usually minor, looping for the whole beat. Leave room for the vocal: sparse chords, long notes, and the loop does the work.',
    presets: [
      { numerals: ['i', 'VI', 'III', 'VII'], mode: 'minor', note: 'Dark, cinematic loop' },
      { numerals: ['i', 'iv'], mode: 'minor', note: 'Two chords, plenty of space' },
      { numerals: ['i', 'VI', 'VII'], mode: 'minor', note: 'Rising and resolving back' },
    ],
  },
  {
    id: 'rnb', name: 'R&B and soul',
    tip: 'Same chord order as pop, but with sevenths and slower, smoother movement. Extended chords (7ths, 9ths) are the sound.',
    presets: [
      { numerals: ['Imaj7', 'vi7', 'ii7', 'V7'], mode: 'major', note: 'The classic with sevenths' },
      { numerals: ['IV', 'iii', 'ii', 'I'], mode: 'major', note: 'Stepping down to rest on the I' },
    ],
  },
  {
    id: 'country', name: 'Country',
    tip: 'Open, singable chords and a steady pulse. The IV and V do most of the work; the story in the words is the point, so keep the chords out of its way.',
    presets: [
      { numerals: ['I', 'IV', 'V', 'I'], mode: 'major', note: 'The classic' },
      { numerals: ['I', 'V', 'vi', 'IV'], mode: 'major', note: 'The pop loop, played country' },
      { numerals: ['I', 'IV', 'I', 'V'], mode: 'major', note: 'Verse that waits on the V' },
    ],
  },
  {
    id: 'folk', name: 'Folk and acoustic',
    tip: 'Open guitar chords in friendly keys (G, C, D, A, E). A capo moves the song to your voice without changing the shapes you play.',
    presets: [
      { numerals: ['I', 'IV', 'I', 'V'], mode: 'major', note: 'Simple and sturdy' },
      { numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], mode: 'major', note: 'The Canon progression' },
    ],
  },
  {
    id: 'reggae', name: 'Reggae',
    tip: 'The rhythm is the chord: short stabs on the off-beats, and often just two chords. Keep the bass melodic and let the chords be rhythm, not weight.',
    presets: [
      { numerals: ['I', 'IV'], mode: 'major', note: 'Two chords, one groove' },
      { numerals: ['I', 'V', 'vi', 'IV'], mode: 'major', note: 'Pop loop, off-beat chords' },
      { numerals: ['i', 'iv', 'v', 'i'], mode: 'minor', note: 'Minor roots feel' },
    ],
  },
  {
    id: 'edm', name: 'Electronic and dance',
    tip: 'A short loop, repeated, with energy built by adding and removing layers. The drop reuses the same chords as the build; the change is rhythm and sound, not harmony.',
    presets: [
      { numerals: ['vi', 'IV', 'I', 'V'], mode: 'major', note: 'Uplifting, festival-style' },
      { numerals: ['i', 'VI', 'III', 'VII'], mode: 'minor', note: 'Driving minor loop' },
      { numerals: ['I', 'V', 'vi', 'IV'], mode: 'major', note: 'The pop loop' },
    ],
  },
];

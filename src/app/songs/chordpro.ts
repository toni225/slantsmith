// Chords over the words (optional, Settings): chords written inline in the lyrics, ChordPro style:
// "[Am]Hold on to[F]night". Plain functions, erasable syntax only, so test/chordpro.test.ts runs them.

const CHORD = /\[([^\]\n]*)\]/g;

// The line with every [chord] turned into spaces of the same length. Syllable counts, rhyme letters
// and grammar flags read this, so chords never count as words and flag positions still match the text.
export function maskChords(line: string): string {
  return line.replace(CHORD, (m) => ' '.repeat(m.length));
}

export function hasChords(text: string): boolean {
  return /\[[^\]\n]+\]/.test(text);
}

// "[Am]Hold on [F]tonight" -> [{chord:'Am', text:'Hold on '}, {chord:'F', text:'tonight'}]
export function segments(line: string): { chord: string; text: string }[] {
  const out: { chord: string; text: string }[] = [];
  let at = 0, chord = '';
  for (const m of line.matchAll(CHORD)) {
    if (m.index! > at || chord) out.push({ chord, text: line.slice(at, m.index) });
    chord = m[1];
    at = m.index! + m[0].length;
  }
  if (at < line.length || chord || !out.length) out.push({ chord, text: line.slice(at) });
  return out;
}

// Plain-text chart for .txt export: a chord line above the lyric line, chords over the right letter.
export function chartLines(line: string): string[] {
  if (!hasChords(line)) return [line];
  let chords = '', lyrics = '';
  for (const s of segments(line)) {
    if (s.chord) {
      if (chords.length > lyrics.length) lyrics = lyrics.padEnd(chords.length); // a chord wider than its word pushes the lyric along
      chords = chords.padEnd(lyrics.length) + s.chord + ' ';
    }
    lyrics += s.text;
  }
  return [chords.trimEnd(), lyrics];
}

// Chords used in some text, first appearance first: the quick-insert chips in the editor.
export function usedChords(text: string): string[] {
  return [...new Set([...text.matchAll(CHORD)].map((m) => m[1].trim()).filter(Boolean))];
}

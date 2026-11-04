export interface Section {
  id: string;
  name: string;
  text: string; // one line per lyric line; rhyme letters/syllable counts are v1.1 (FR-21/22)
}

export interface Song {
  id: string;
  title: string;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

export function newSong(): Song {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled song',
    sections: [{ id: crypto.randomUUID(), name: 'Verse 1', text: '' }],
    createdAt: now,
    updatedAt: now,
  };
}

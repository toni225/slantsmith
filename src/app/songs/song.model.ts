export interface Section {
  id: string;
  name: string;
  text: string; // one line per lyric line; rhyme letters/syllable counts are v1.1 (FR-21/22)
  ignoredFlags?: string[]; // FR-11: grammar flag keys ("rule|word") ignored for this song
}

export interface Song {
  id: string;
  title: string;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
  checklist?: Record<string, boolean>; // Mix help's "before mastering" checklist, keyed by item id
}

// FR-32: a snapshot of a song at a point in time. name === null means an
// automatic 10-minute snapshot; a string name means the writer saved it on
// purpose. Auto takes are capped (newest 20 kept); named takes never expire.
export interface Take {
  id: string;
  songId: string;
  n: number; // 1-based, increases per song regardless of auto/named
  name: string | null;
  title: string;
  sections: Section[];
  createdAt: number;
}

// FR-33: full backup, all songs and takes on the device.
export interface Backup {
  version: 1;
  exportedAt: number;
  songs: Song[];
  takes: Take[];
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

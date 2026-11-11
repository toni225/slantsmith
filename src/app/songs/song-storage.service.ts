import { Injectable, signal } from '@angular/core';
import type { Backup, Section, Song, Take } from './song.model';

const DB_NAME = 'slantsmith';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
// FR-32: snapshots of a song (ADR-07: versions in their own store).
const TAKES_STORE = 'takes';
const MAX_AUTO_TAKES = 20; // named takes are never pruned

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SONGS_STORE)) db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(TAKES_STORE)) db.createObjectStore(TAKES_STORE, { keyPath: 'id' }).createIndex('songId', 'songId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// IndexedDB storage for songs (ADR-07: one record per song). Lyrics never leave the device.
@Injectable({ providedIn: 'root' })
export class SongStorageService {
  readonly songs = signal<Song[]>([]);
  readonly ready = signal(false);
  private db: Promise<IDBDatabase>;

  constructor() {
    this.db = openDb();
    this.refresh();
  }

  async refresh(): Promise<void> {
    const db = await this.db;
    const all = await new Promise<Song[]>((resolve, reject) => {
      const req = db.transaction(SONGS_STORE, 'readonly').objectStore(SONGS_STORE).getAll();
      req.onsuccess = () => resolve(req.result as Song[]);
      req.onerror = () => reject(req.error);
    });
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    this.songs.set(all);
    this.ready.set(true);
  }

  async get(id: string): Promise<Song | undefined> {
    const db = await this.db;
    return new Promise((resolve, reject) => {
      const req = db.transaction(SONGS_STORE, 'readonly').objectStore(SONGS_STORE).get(id);
      req.onsuccess = () => resolve(req.result as Song | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async save(song: Song): Promise<void> {
    const db = await this.db;
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(SONGS_STORE, 'readwrite').objectStore(SONGS_STORE).put(song);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    await this.refresh();
  }

  // Deletes the song and its takes together, so no orphan takes are left behind.
  async remove(id: string): Promise<void> {
    const db = await this.db;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([SONGS_STORE, TAKES_STORE], 'readwrite');
      tx.objectStore(SONGS_STORE).delete(id);
      const takes = tx.objectStore(TAKES_STORE);
      const req = takes.index('songId').getAllKeys(id);
      req.onsuccess = () => req.result.forEach((key) => takes.delete(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await this.refresh();
  }

  async listTakes(songId: string): Promise<Take[]> {
    const db = await this.db;
    const all = await new Promise<Take[]>((resolve, reject) => {
      const req = db.transaction(TAKES_STORE, 'readonly').objectStore(TAKES_STORE).index('songId').getAll(songId);
      req.onsuccess = () => resolve(req.result as Take[]);
      req.onerror = () => reject(req.error);
    });
    return all.sort((a, b) => b.n - a.n);
  }

  // FR-32: name === null for an automatic 10-minute snapshot; a string for a take the writer named on purpose.
  async saveTake(songId: string, title: string, sections: Section[], name: string | null): Promise<void> {
    const db = await this.db;
    const existing = await this.listTakes(songId);
    const take: Take = {
      id: crypto.randomUUID(),
      songId,
      n: (existing[0]?.n ?? 0) + 1,
      name,
      title,
      sections: sections.map((s) => ({ ...s })),
      createdAt: Date.now(),
    };
    const tx = db.transaction(TAKES_STORE, 'readwrite');
    tx.objectStore(TAKES_STORE).put(take);
    // Auto takes beyond the newest 20 are pruned; named takes are never deleted.
    const autoTakes = existing.filter((t) => t.name === null);
    for (const stale of autoTakes.slice(MAX_AUTO_TAKES - 1)) tx.objectStore(TAKES_STORE).delete(stale.id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // FR-33: full backup, all songs and takes on the device - lyrics never leave it unless the writer exports this file themselves.
  async exportAll(): Promise<Backup> {
    const db = await this.db;
    const [songs, takes] = await Promise.all([
      new Promise<Song[]>((resolve, reject) => {
        const req = db.transaction(SONGS_STORE, 'readonly').objectStore(SONGS_STORE).getAll();
        req.onsuccess = () => resolve(req.result as Song[]);
        req.onerror = () => reject(req.error);
      }),
      new Promise<Take[]>((resolve, reject) => {
        const req = db.transaction(TAKES_STORE, 'readonly').objectStore(TAKES_STORE).getAll();
        req.onsuccess = () => resolve(req.result as Take[]);
        req.onerror = () => reject(req.error);
      }),
    ]);
    return { version: 1, exportedAt: Date.now(), songs, takes };
  }

  // Throws if `json` isn't a Slantsmith backup; nothing is written in that case. Upserts by id otherwise.
  async importAll(json: string): Promise<number> {
    let backup: Backup;
    try {
      backup = JSON.parse(json);
    } catch {
      throw new Error('not-a-backup');
    }
    if (backup?.version !== 1 || !Array.isArray(backup.songs)) throw new Error('not-a-backup');
    const db = await this.db;
    const tx = db.transaction([SONGS_STORE, TAKES_STORE], 'readwrite');
    for (const song of backup.songs) tx.objectStore(SONGS_STORE).put(song);
    for (const take of backup.takes ?? []) tx.objectStore(TAKES_STORE).put(take);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await this.refresh();
    return backup.songs.length;
  }
}

import { Injectable, signal } from '@angular/core';
import type { Section, Song, Take } from './song.model';

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

  async remove(id: string): Promise<void> {
    const db = await this.db;
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(SONGS_STORE, 'readwrite').objectStore(SONGS_STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
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
}

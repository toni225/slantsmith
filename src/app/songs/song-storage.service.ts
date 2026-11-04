import { Injectable, signal } from '@angular/core';
import type { Song } from './song.model';

const DB_NAME = 'slantsmith';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
// shortcut: reserved for FR-32 auto-snapshots/named takes (ADR-07: versions in their own store), unused until that's built.
const TAKES_STORE = 'takes';

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
}

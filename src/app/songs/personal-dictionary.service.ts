import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'slantsmith:personal-dictionary';

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// FR-11: words added here are never flagged again, in any song.
@Injectable({ providedIn: 'root' })
export class PersonalDictionaryService {
  private readonly words = signal(new Set(load()));

  has(word: string): boolean {
    return this.words().has(word.toLowerCase());
  }

  add(word: string) {
    const next = new Set(this.words());
    next.add(word.toLowerCase());
    this.words.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }
}

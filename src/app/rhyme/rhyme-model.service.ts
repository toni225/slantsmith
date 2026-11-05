import { Injectable, signal } from '@angular/core';
import type { GrammarFlag } from '../../engines/grammar';
import type { GrammarResponse, RhymeResponse, SchemeLetter, SchemeResponse, SyllablesResponse, UiRhymeResult } from './rhyme-protocol';

// Rhyme/grammar engines run off the main thread (ADR-04).
@Injectable({ providedIn: 'root' })
export class RhymeModelService {
  readonly error = signal<string | null>(null);
  // shortcut: cold-load timing for Sprint 2 item 3 real-device check; remove once that's closed.
  readonly coldLoadMs = signal<number | null>(null);
  private readonly startedAt = performance.now();
  private readonly worker = new Worker(new URL('./rhyme.worker', import.meta.url), { type: 'module' });
  private nextId = 0;
  private readonly pending = new Map<number, { resolve: (r: never) => void; reject: (e: Error) => void }>();

  constructor() {
    this.worker.addEventListener('message', ({ data }: MessageEvent<RhymeResponse | SyllablesResponse | SchemeResponse | GrammarResponse>) => {
      if (this.coldLoadMs() === null) this.coldLoadMs.set(Math.round(performance.now() - this.startedAt));
      const p = this.pending.get(data.id);
      if (!p) return;
      this.pending.delete(data.id);
      if ('error' in data) p.reject(new Error(data.error)); else p.resolve(data.result as never);
    });
    this.worker.addEventListener('error', (e) => this.error.set(e.message));
  }

  rhyme(word: string, hideExplicit = false): Promise<UiRhymeResult> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (r: never) => void, reject: (e) => { this.error.set(e.message); reject(e); } });
      this.worker.postMessage({ id, kind: 'rhyme', word, hideExplicit });
    });
  }

  /** FR-21: syllable count per word, undefined for unknown words. */
  syllables(words: string[]): Promise<(number | undefined)[]> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (r: never) => void, reject: (e) => { this.error.set(e.message); reject(e); } });
      this.worker.postMessage({ id, kind: 'syllables', words });
    });
  }

  /** FR-22: rhyme-letter scheme (A, B, C...) per line ending. */
  scheme(words: string[]): Promise<SchemeLetter[]> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (r: never) => void, reject: (e) => { this.error.set(e.message); reject(e); } });
      this.worker.postMessage({ id, kind: 'scheme', words });
    });
  }

  /** FR-09/10: grammar flags for one line. */
  checkGrammar(line: string): Promise<GrammarFlag[]> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (r: never) => void, reject: (e) => { this.error.set(e.message); reject(e); } });
      this.worker.postMessage({ id, kind: 'grammar', line });
    });
  }
}

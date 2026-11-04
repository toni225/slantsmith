import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { RhymeModelService } from '../rhyme/rhyme-model.service';
import type { SchemeLetter } from '../rhyme/rhyme-protocol';
import { SongStorageService } from './song-storage.service';
import type { Section, Song } from './song.model';

const AUTOSAVE_MS = 2000; // FR-32: autosave within 2s
const WORD_RE = /[a-zA-Z']+/g;

export interface LineCount { syllables: number; estimated: boolean }

@Component({
  selector: 'app-song-editor',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './song-editor.component.html',
  styleUrl: './song-editor.component.css',
})
export class SongEditorComponent {
  private readonly storage = inject(SongStorageService);
  private readonly models = inject(RhymeModelService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;

  readonly song = signal<Song | null>(null);
  readonly status = signal<'saved' | 'saving'>('saved');
  // FR-21: live syllable count per line, keyed by section id.
  readonly lineCounts = signal<Record<string, LineCount[]>>({});
  // FR-22: rhyme-letter scheme per line ending, keyed by section id.
  readonly lineSchemes = signal<Record<string, SchemeLetter[]>>({});

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/songs']); return; }
    this.storage.get(id).then((song) => {
      if (!song) { this.router.navigate(['/songs']); return; }
      this.song.set(song);
      for (const section of song.sections) this.updateLine(section);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.saveTimer));
  }

  lines(section: Section): string[] {
    return section.text.split('\n');
  }

  counts(section: Section): LineCount[] {
    return this.lineCounts()[section.id] ?? [];
  }

  scheme(section: Section): SchemeLetter[] {
    return this.lineSchemes()[section.id] ?? [];
  }

  private updateLine(section: Section) {
    this.updateLineCounts(section);
    this.updateLineScheme(section);
  }

  private updateLineCounts(section: Section) {
    const lines = section.text.split('\n');
    const words = lines.map((l) => l.match(WORD_RE) ?? []);
    const flat = words.flat();
    if (!flat.length) {
      this.lineCounts.update((m) => ({ ...m, [section.id]: lines.map(() => ({ syllables: 0, estimated: false })) }));
      return;
    }
    this.models.syllables(flat).then((counts) => {
      let at = 0;
      const perLine = words.map((ws) => {
        const slice = counts.slice(at, at + ws.length);
        at += ws.length;
        return { syllables: slice.reduce((n: number, c) => n + (c ?? 0), 0), estimated: slice.some((c) => c === undefined) };
      });
      this.lineCounts.update((m) => ({ ...m, [section.id]: perLine }));
    });
  }

  private updateLineScheme(section: Section) {
    const endings = section.text.split('\n').map((l) => (l.match(WORD_RE) ?? []).at(-1)?.toLowerCase() ?? '');
    this.models.scheme(endings).then((result) => {
      this.lineSchemes.update((m) => ({ ...m, [section.id]: result }));
    });
  }

  private scheduleSave() {
    this.status.set('saving');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const song = this.song();
      if (!song) return;
      song.updatedAt = Date.now();
      this.storage.save(song).then(() => this.status.set('saved'));
    }, AUTOSAVE_MS);
  }

  setTitle(title: string) {
    const song = this.song();
    if (!song) return;
    this.song.set({ ...song, title: title.trim() || 'Untitled song' });
    this.scheduleSave();
  }

  setSectionText(section: Section, text: string) {
    section.text = text;
    this.updateLine(section);
    this.scheduleSave();
  }

  renameSection(section: Section, name: string) {
    section.name = name.trim() || section.name;
    this.scheduleSave();
  }

  addSection() {
    const song = this.song();
    if (!song) return;
    const section: Section = { id: crypto.randomUUID(), name: `Section ${song.sections.length + 1}`, text: '' };
    song.sections.push(section);
    this.song.set({ ...song });
    this.updateLine(section);
    this.scheduleSave();
  }

  duplicateSection(index: number) {
    const song = this.song();
    if (!song) return;
    const copy: Section = { ...song.sections[index], id: crypto.randomUUID() };
    song.sections.splice(index + 1, 0, copy);
    this.song.set({ ...song });
    this.updateLine(copy);
    this.scheduleSave();
  }

  deleteSection(index: number) {
    const song = this.song();
    if (!song || song.sections.length <= 1) return;
    song.sections.splice(index, 1);
    this.song.set({ ...song });
    this.scheduleSave();
  }

  moveSection(index: number, dir: -1 | 1) {
    const song = this.song();
    if (!song) return;
    const target = index + dir;
    if (target < 0 || target >= song.sections.length) return;
    [song.sections[index], song.sections[target]] = [song.sections[target], song.sections[index]];
    this.song.set({ ...song });
    this.scheduleSave();
  }
}

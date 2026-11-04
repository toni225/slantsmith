import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SongStorageService } from './song-storage.service';
import type { Section, Song } from './song.model';

const AUTOSAVE_MS = 2000; // FR-32: autosave within 2s

@Component({
  selector: 'app-song-editor',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './song-editor.component.html',
  styleUrl: './song-editor.component.css',
})
export class SongEditorComponent {
  private readonly storage = inject(SongStorageService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;

  readonly song = signal<Song | null>(null);
  readonly status = signal<'saved' | 'saving'>('saved');

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/songs']); return; }
    this.storage.get(id).then((song) => {
      if (!song) { this.router.navigate(['/songs']); return; }
      this.song.set(song);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.saveTimer));
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
    this.scheduleSave();
  }

  renameSection(section: Section, name: string) {
    section.name = name.trim() || section.name;
    this.scheduleSave();
  }

  addSection() {
    const song = this.song();
    if (!song) return;
    song.sections.push({ id: crypto.randomUUID(), name: `Section ${song.sections.length + 1}`, text: '' });
    this.song.set({ ...song });
    this.scheduleSave();
  }

  duplicateSection(index: number) {
    const song = this.song();
    if (!song) return;
    const copy: Section = { ...song.sections[index], id: crypto.randomUUID() };
    song.sections.splice(index + 1, 0, copy);
    this.song.set({ ...song });
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

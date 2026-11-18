import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { compareSections } from './compare';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SongStorageService } from './song-storage.service';
import type { Song, Take } from './song.model';

function when(ts: number): string {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// FR-32: "Save this as a take", restore a prior take, and compare any take with the draft.
@Component({
  selector: 'app-takes-list',
  imports: [RouterLink, NgTemplateOutlet, TabNavComponent],
  templateUrl: './takes-list.component.html',
  styleUrl: './takes-list.component.css',
})
export class TakesListComponent {
  private readonly storage = inject(SongStorageService);
  private readonly router = inject(Router);
  protected readonly songId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly song = signal<Song | null>(null);
  readonly takes = signal<Take[]>([]);
  protected readonly when = when;

  readonly comparing = signal<string | null>(null); // id of the take shown against the draft
  private readonly picked = computed(() => this.takes().find((t) => t.id === this.comparing()));
  readonly diff = computed(() => {
    const take = this.picked(), song = this.song();
    return take && song ? compareSections(take.sections, song.sections) : [];
  });
  readonly titleChange = computed(() => {
    const take = this.picked(), song = this.song();
    return take && song && take.title !== song.title ? { was: take.title, now: song.title } : null;
  });
  readonly unchanged = computed(() => !!this.picked() && !this.titleChange() && this.diff().every((s) => s.status === 'same'));

  compare(take: Take) {
    this.comparing.set(this.comparing() === take.id ? null : take.id);
  }

  constructor() {
    if (!this.songId) { this.router.navigate(['/songs']); return; }
    this.refresh();
  }

  private refresh() {
    this.storage.get(this.songId).then((song) => {
      if (!song) { this.router.navigate(['/songs']); return; }
      this.song.set(song);
    });
    this.storage.listTakes(this.songId).then((takes) => this.takes.set(takes));
  }

  async saveAsTake() {
    const song = this.song();
    if (!song) return;
    const name = prompt('Name this take')?.trim();
    if (!name) return;
    await this.storage.saveTake(song.id, song.title, song.sections, name);
    this.refresh();
  }

  async restore(take: Take) {
    const song = this.song();
    if (!song) return;
    if (!confirm(`Restore "${take.name ?? 'Autosave'}"? This replaces the current draft.`)) return;
    await this.storage.save({ ...song, title: take.title, sections: take.sections.map((s) => ({ ...s })), updatedAt: Date.now() });
    this.router.navigate(['/songs', song.id]);
  }
}

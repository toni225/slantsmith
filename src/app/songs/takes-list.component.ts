import { Component, inject, signal } from '@angular/core';
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

// FR-32: "Save this as a take", restore a prior take. Compare-with-now (also on the
// approved artboard) isn't built - a real diff view, not something to stub.
@Component({
  selector: 'app-takes-list',
  imports: [RouterLink, TabNavComponent],
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

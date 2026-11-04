import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SongStorageService } from './song-storage.service';
import { newSong, type Song } from './song.model';

function firstLine(song: Song): string {
  for (const s of song.sections) {
    const line = s.text.split('\n').find((l) => l.trim());
    if (line) return line.trim();
  }
  return 'No lines yet';
}

function when(ts: number): string {
  const d = new Date(ts), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

@Component({
  selector: 'app-songs-list',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './songs-list.component.html',
  styleUrl: './songs-list.component.css',
})
export class SongsListComponent {
  private readonly storage = inject(SongStorageService);
  private readonly router = inject(Router);

  readonly search = signal('');
  protected readonly ready = this.storage.ready;
  protected readonly songs = this.storage.songs;

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.storage.songs();
    if (!q) return all;
    return all.filter((s) => s.title.toLowerCase().includes(q) || s.sections.some((sec) => sec.text.toLowerCase().includes(q)));
  });

  protected readonly latest = computed(() => this.filtered()[0]);
  protected readonly earlier = computed(() => this.filtered().slice(1));

  protected readonly firstLine = firstLine;
  protected readonly when = when;

  setSearch(q: string) { this.search.set(q); }

  async createSong() {
    const song = newSong();
    await this.storage.save(song);
    this.router.navigate(['/songs', song.id]);
  }
}

import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SongStorageService } from '../songs/song-storage.service';
import { SettingsService, type TextSize, type Theme } from './settings.service';

type ImportState = { kind: 'error' } | { kind: 'done'; count: number } | null;

@Component({
  selector: 'app-settings-page',
  imports: [TabNavComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {
  protected readonly settings = inject(SettingsService);
  private readonly storage = inject(SongStorageService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly importState = signal<ImportState>(null);
  protected readonly themes: { value: Theme; label: string }[] = [
    { value: 'dark', label: 'Studio dark' },
    { value: 'light', label: 'Paper light' },
    { value: 'system', label: 'Match my phone' },
  ];
  protected readonly sizes: { value: TextSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  pickTheme(t: Theme) { this.settings.theme.set(t); }
  pickSize(s: TextSize) { this.settings.textSize.set(s); }
  toggleLyricMode() { this.settings.lyricModeDefault.update((v) => !v); }
  toggleHideExplicit() { this.settings.hideExplicit.update((v) => !v); }

  // FR-33: full backup .json export/import, from the approved Settings.dc.html/ImportError.dc.html artboards.
  async exportBackup() {
    const backup = await this.storage.exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slantsmith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  chooseImportFile() {
    this.fileInput()?.nativeElement.click();
  }

  async importBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file after an error
    if (!file) return;
    try {
      const count = await this.storage.importAll(await file.text());
      this.importState.set({ kind: 'done', count });
    } catch {
      this.importState.set({ kind: 'error' });
    }
  }

  dismissImportState() {
    this.importState.set(null);
  }
}

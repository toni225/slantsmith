import { Component, inject } from '@angular/core';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SettingsService, type TextSize, type Theme } from './settings.service';

@Component({
  selector: 'app-settings-page',
  imports: [TabNavComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {
  protected readonly settings = inject(SettingsService);
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
}

import { Component, DestroyRef, inject, isDevMode, signal } from '@angular/core';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SettingsService } from '../settings/settings.service';
import { QuickRhymeBarComponent } from './quick-rhyme-bar.component';
import { RhymeModelService } from './rhyme-model.service';
import { RhymeSheetComponent } from './rhyme-sheet.component';

// Above this width the rhyme sheet stops being an on-demand overlay and becomes
// a permanent panel beside the word field (see rhyme-sheet.component.css and adapt.md).
const DESKTOP_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-rhyme-page',
  imports: [QuickRhymeBarComponent, RhymeSheetComponent, TabNavComponent],
  templateUrl: './rhyme-page.component.html',
  styleUrl: './rhyme-page.component.css',
})
export class RhymePageComponent {
  readonly word = signal('hold');
  readonly sheetOpen = signal(false);
  readonly isDesktop = signal(matchMedia(DESKTOP_QUERY).matches);
  // shortcut: visible only in dev builds, for Sprint 2 item 3 real-device timing; remove once that's closed.
  readonly showColdLoad = isDevMode();
  private readonly models = inject(RhymeModelService);
  readonly coldLoadMs = this.models.coldLoadMs;
  readonly hideExplicit = inject(SettingsService).hideExplicit;

  constructor() {
    const mql = matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
    mql.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', onChange));
  }

  setWord(w: string) {
    const v = w.trim();
    if (v) this.word.set(v);
  }

  useWord(w: string) { this.word.set(w); }
  openSheet() { this.sheetOpen.set(true); }
  closeSheet() { this.sheetOpen.set(false); }
}

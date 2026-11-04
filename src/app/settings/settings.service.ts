import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'system' | 'dark' | 'light';
export type TextSize = 'small' | 'medium' | 'large';

export interface Settings {
  theme: Theme;
  textSize: TextSize;
  lyricModeDefault: boolean;
  hideExplicit: boolean;
}

const DEFAULTS: Settings = { theme: 'system', textSize: 'medium', lyricModeDefault: true, hideExplicit: false };
const STORAGE_KEY = 'slantsmith:settings';
const ZOOM: Record<TextSize, string> = { small: '0.9', medium: '1', large: '1.15' };

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// FR-50: theme, text size, lyric mode default, hide explicit words; persists offline (localStorage).
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly stored = load();
  readonly theme = signal(this.stored.theme);
  readonly textSize = signal(this.stored.textSize);
  readonly lyricModeDefault = signal(this.stored.lyricModeDefault);
  readonly hideExplicit = signal(this.stored.hideExplicit);

  constructor() {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolved = this.theme() === 'system' ? (prefersDark.matches ? 'dark' : 'light') : this.theme();
      document.documentElement.dataset['theme'] = resolved;
    };
    effect(applyTheme);
    prefersDark.addEventListener('change', applyTheme);

    // shortcut: CSS zoom scales the whole layout rather than every px value becoming rem; upgrade if that causes complaints.
    effect(() => { document.documentElement.style.zoom = ZOOM[this.textSize()]; });

    effect(() => {
      const settings: Settings = {
        theme: this.theme(),
        textSize: this.textSize(),
        lyricModeDefault: this.lyricModeDefault(),
        hideExplicit: this.hideExplicit(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    });
  }
}

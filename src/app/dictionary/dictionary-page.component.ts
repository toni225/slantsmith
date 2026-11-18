import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { BrowsePage, Meaning, PartOfSpeech } from '../../engines/thesaurus';
import type { WordEntry } from '../rhyme/rhyme-protocol';
import { RhymeModelService } from '../rhyme/rhyme-model.service';
import { SettingsService } from '../settings/settings.service';
import { TabNavComponent } from '../shell/tab-nav.component';

const POS_NAME: Record<PartOfSpeech, string> = { n: 'Noun', v: 'Verb', a: 'Adjective', r: 'Adverb' };
const POS_SHORT: Record<PartOfSpeech, string> = { n: 'n.', v: 'v.', a: 'adj.', r: 'adv.' };
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Definitions from Open English WordNet, looked up in the rhyme worker (dictionary.txt.gz, fetched on first use).
// Read it like a book: pages of words by letter, flip to the word before or after, or open a random word.
@Component({
  selector: 'app-dictionary-page',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './dictionary-page.component.html',
  styleUrl: './dictionary-page.component.css',
})
export class DictionaryPageComponent {
  private readonly models = inject(RhymeModelService);
  private readonly hideExplicit = inject(SettingsService).hideExplicit;
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');
  private ticket = 0; // the newest request wins; older replies are dropped

  readonly letters = LETTERS;
  readonly posShort = POS_SHORT;
  readonly view = signal<'book' | 'entry'>('book');
  readonly query = signal('');
  readonly entry = signal<WordEntry | null>(null); // null in the entry view: not in the dictionary
  readonly book = signal<BrowsePage | null>(null);
  readonly here = signal<string | null>(null); // the word "Page" came back from, marked on the book page
  readonly loading = signal(false);
  readonly failed = signal(false);

  readonly letter = computed(() => (this.view() === 'entry' ? this.entry()?.base[0] ?? this.query()[0] : this.book()?.letter) ?? 'a');

  // Meanings grouped by part of speech, in the dictionary's order.
  readonly groups = computed(() => {
    const groups: { pos: string; meanings: Meaning[] }[] = [];
    for (const m of this.entry()?.meanings ?? []) {
      const name = POS_NAME[m.pos];
      if (groups.at(-1)?.pos !== name) groups.push({ pos: name, meanings: [] });
      groups.at(-1)!.meanings.push(m);
    }
    return groups;
  });

  constructor() {
    this.openPage('a', 1);
    // Keep the current letter centred on the strip (not scrollIntoView: that also scrolls the page sideways).
    effect(() => {
      const strip = this.strip()?.nativeElement;
      const btn = strip?.querySelector<HTMLElement>(`[data-letter="${this.letter()}"]`);
      if (strip && btn) strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2 });
    });
  }

  private async load<T>(job: Promise<T>, done: (r: T) => void) {
    const mine = ++this.ticket;
    this.loading.set(true);
    this.failed.set(false);
    try {
      const r = await job;
      if (mine !== this.ticket) return;
      done(r);
    } catch {
      if (mine === this.ticket) this.failed.set(true); // e.g. offline before the dictionary was ever downloaded
    }
    if (mine !== this.ticket) return;
    this.loading.set(false);
    // After render: back at the top, or at the marked word when returning to its page.
    setTimeout(() => {
      const page = this.scroller()?.nativeElement;
      const mark = page?.querySelector<HTMLElement>('.here');
      page?.scrollTo({ top: mark ? mark.offsetTop - page.clientHeight / 3 : 0 });
      mark?.querySelector('button')?.focus({ preventScroll: true });
    });
  }

  look(input: string) {
    const word = input.trim().toLowerCase();
    if (!word) return;
    this.query.set(word);
    this.load(this.models.define(word), (d) => { this.entry.set(d); this.view.set('entry'); });
  }

  random() {
    this.load(this.models.randomWord(this.hideExplicit()), (d) => { this.query.set(d.base); this.entry.set(d); this.view.set('entry'); });
  }

  openPage(letter: string, page: number, word?: string) {
    this.here.set(word ?? null);
    this.load(this.models.browse(letter, page, word), (p) => { this.book.set(p); this.view.set('book'); });
  }

  // Next/previous page; past a letter's last page it moves on to the next letter, like turning a page.
  turn(step: 1 | -1) {
    const p = this.book();
    if (!p) return;
    const i = LETTERS.indexOf(p.letter);
    if (step === 1 && p.page === p.pages) { if (i < 25) this.openPage(LETTERS[i + 1], 1); }
    else if (step === -1 && p.page === 1) { if (i > 0) this.openPage(LETTERS[i - 1], 9999); } // clamped to its last page
    else this.openPage(p.letter, p.page + step);
  }

  backToPage() {
    const d = this.entry();
    if (d) this.openPage(d.base[0], 1, d.base);
    else this.openPage(this.letter(), 1);
  }

  retry() {
    if (this.view() === 'entry' && this.query()) this.look(this.query());
    else this.openPage(this.book()?.letter ?? 'a', this.book()?.page ?? 1);
  }

  // Left/right arrows flip, like the buttons, unless the writer is typing.
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('input, textarea')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const step = e.key === 'ArrowRight' ? 1 : -1;
    if (this.view() === 'book') this.turn(step);
    else {
      const to = step === 1 ? this.entry()?.next : this.entry()?.prev;
      if (to) this.look(to);
    }
    e.preventDefault();
  }
}

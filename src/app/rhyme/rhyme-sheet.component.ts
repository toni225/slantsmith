import { Component, ElementRef, HostListener, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import type { WordType } from '../../engines/model';
import { RhymeModelService } from './rhyme-model.service';
import type { UiRhyme, UiRhymeResult } from './rhyme-protocol';

type Tab = 'perfect' | 'slant';
type LengthFilter = 'any' | 1 | 2;
type TypeFilter = 'any' | WordType;

const TYPE_FILTERS: TypeFilter[] = ['any', 'noun', 'verb', 'adjective', 'adverb'];

// shortcut: "common only" cuts at a fixed commonness byte (160/255); revisit once we have usage data.
const COMMON_CUTOFF = 160;

@Component({
  selector: 'app-rhyme-sheet',
  templateUrl: './rhyme-sheet.component.html',
  styleUrl: './rhyme-sheet.component.css',
})
export class RhymeSheetComponent {
  private readonly models = inject(RhymeModelService);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly word = input.required<string>();
  readonly hideExplicit = input(false);
  readonly closed = output<void>();
  readonly used = output<string>();

  readonly tab = signal<Tab>('perfect');
  readonly lengthFilter = signal<LengthFilter>('any');
  readonly typeFilter = signal<TypeFilter>('any');
  readonly typeFilters = TYPE_FILTERS;
  readonly commonOnly = signal(false);
  readonly result = signal<UiRhymeResult | null>(null);

  readonly rows = computed(() => {
    const r = this.result();
    if (!r) return [];
    let list = this.tab() === 'perfect' ? r.perfect : r.slant;
    const len = this.lengthFilter();
    const type = this.typeFilter();
    const common = this.commonOnly();
    if (len !== 'any' || type !== 'any' || common) {
      list = list.filter((x) => {
        if (len !== 'any' && x.syllables !== len) return false;
        if (type !== 'any' && !x.types.includes(type)) return false;
        if (common && x.commonness < COMMON_CUTOFF) return false;
        return true;
      });
    }
    return list;
  });

  readonly subtitle = computed(() => {
    const r = this.result();
    if (!r) return 'Loading…';
    if (r.estimated) return 'estimated pronunciation';
    return r.syllables ? `${r.syllables} syllable${r.syllables === 1 ? '' : 's'}` : 'rhymes';
  });

  readonly footer = computed(() => {
    const r = this.result();
    if (!r) return 'Loading…';
    const total = this.tab() === 'perfect' ? r.perfect.length : r.slant.length;
    const shown = this.rows().length;
    return shown === total ? `${total} found.` : `Showing ${shown} of ${total}.`;
  });

  constructor() {
    effect(() => {
      const word = this.word();
      const hideExplicit = this.hideExplicit();
      this.result.set(null);
      this.models.rhyme(word, hideExplicit).then((r) => this.result.set(r));
    });
    effect(() => { this.word(); this.panel()?.nativeElement.querySelector<HTMLElement>('button')?.focus(); });
  }

  pick(tab: Tab) { this.tab.set(tab); }
  pickLength(len: LengthFilter) { this.lengthFilter.set(len); }
  pickType(type: TypeFilter) { this.typeFilter.set(type); }
  toggleCommon() { this.commonOnly.update((v) => !v); }
  close() { this.closed.emit(); }
  use(word: string) { this.used.emit(word); }

  chipKind(r: UiRhyme): 'solid' | 'dotted' {
    return r.type === 'perfect' ? 'solid' : 'dotted';
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.close(); }

  @HostListener('keydown.tab', ['$event'])
  onTab(e: Event) {
    const shiftKey = (e as KeyboardEvent).shiftKey;
    const root = this.panel()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('button, a, [tabindex]')).filter((el) => !el.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RhymeModelService } from './rhyme-model.service';
import type { UiRhyme, UiRhymeResult } from './rhyme-protocol';

const BAR_SIZE = 5;

@Component({
  selector: 'app-quick-rhyme-bar',
  templateUrl: './quick-rhyme-bar.component.html',
  styleUrl: './quick-rhyme-bar.component.css',
})
export class QuickRhymeBarComponent {
  private readonly models = inject(RhymeModelService);

  readonly word = input.required<string>();
  readonly hideExplicit = input(false);
  readonly useWord = output<string>();
  readonly seeAll = output<void>();

  private readonly result = signal<UiRhymeResult | null>(null);

  readonly chips = computed<UiRhyme[]>(() => {
    const r = this.result();
    if (!r) return [];
    return [...r.perfect, ...r.slant].slice(0, BAR_SIZE);
  });

  constructor() {
    effect(() => {
      const word = this.word();
      const hideExplicit = this.hideExplicit();
      this.result.set(null);
      this.models.rhyme(word, hideExplicit).then((r) => this.result.set(r));
    });
  }
}

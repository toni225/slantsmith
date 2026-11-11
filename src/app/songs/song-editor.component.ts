import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { RhymeModelService } from '../rhyme/rhyme-model.service';
import type { SchemeLetter } from '../rhyme/rhyme-protocol';
import { RhymeSheetComponent } from '../rhyme/rhyme-sheet.component';
import { SettingsService } from '../settings/settings.service';
import { PersonalDictionaryService } from './personal-dictionary.service';
import { SongStorageService } from './song-storage.service';
import type { Section, Song } from './song.model';
import type { GrammarFlag } from '../../engines/grammar';

const AUTOSAVE_MS = 2000; // FR-32: autosave within 2s
const AUTO_TAKE_MS = 10 * 60 * 1000; // FR-32: auto snapshot every 10 min
const WORD_RE = /[a-zA-Z']+/g;

export interface LineCount { syllables: number; estimated: boolean }

// FR-09/10/11: a grammar flag plus which line of the section it's in (flag.start/end are line-relative).
export interface SectionFlag { lineIndex: number; flag: GrammarFlag }

// FR-23: the word tapped in a section's textarea, with enough to replace it in place.
interface TappedWord { textarea: HTMLTextAreaElement; start: number; end: number; word: string }

@Component({
  selector: 'app-song-editor',
  imports: [RouterLink, TabNavComponent, RhymeSheetComponent],
  templateUrl: './song-editor.component.html',
  styleUrl: './song-editor.component.css',
})
export class SongEditorComponent {
  private readonly storage = inject(SongStorageService);
  private readonly models = inject(RhymeModelService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;
  private autoTakeTimer?: ReturnType<typeof setInterval>;

  readonly song = signal<Song | null>(null);
  readonly status = signal<'saved' | 'saving'>('saved');
  // FR-21: live syllable count per line, keyed by section id.
  readonly lineCounts = signal<Record<string, LineCount[]>>({});
  // FR-22: rhyme-letter scheme per line ending, keyed by section id.
  readonly lineSchemes = signal<Record<string, SchemeLetter[]>>({});
  // FR-09/10: grammar flags per line, keyed by section id.
  readonly lineGrammar = signal<Record<string, GrammarFlag[][]>>({});
  // FR-11: "ignore once" - dismissed for this editing session only, not persisted.
  private readonly ignoredOnce = signal(new Set<string>());
  private readonly dictionary = inject(PersonalDictionaryService);
  // FR-23: tap a word, see rhymes, tap a result to replace it; undo (Ctrl/Cmd+Z) restores it.
  readonly hideExplicit = inject(SettingsService).hideExplicit;
  readonly tapped = signal<TappedWord | null>(null);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/songs']); return; }
    this.storage.get(id).then((song) => {
      if (!song) { this.router.navigate(['/songs']); return; }
      this.song.set(song);
      for (const section of song.sections) this.updateLine(section);
    });
    this.autoTakeTimer = setInterval(() => {
      const song = this.song();
      if (song) this.storage.saveTake(song.id, song.title, song.sections, null);
    }, AUTO_TAKE_MS);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.saveTimer);
      clearInterval(this.autoTakeTimer);
    });
  }

  lines(section: Section): string[] {
    return section.text.split('\n');
  }

  counts(section: Section): LineCount[] {
    return this.lineCounts()[section.id] ?? [];
  }

  scheme(section: Section): SchemeLetter[] {
    return this.lineSchemes()[section.id] ?? [];
  }

  // FR-11: flags not dismissed once, ignored in this song, or added to the personal dictionary.
  grammarFlags(section: Section): SectionFlag[] {
    const perLine = this.lineGrammar()[section.id] ?? [];
    const once = this.ignoredOnce();
    const ignored = new Set(section.ignoredFlags ?? []);
    const out: SectionFlag[] = [];
    perLine.forEach((flags, lineIndex) => {
      for (const flag of flags) {
        const onceKey = `${section.id}:${lineIndex}:${flag.key}:${flag.start}`;
        if (once.has(onceKey) || ignored.has(flag.key) || this.dictionary.has(flag.word)) continue;
        out.push({ lineIndex, flag });
      }
    });
    return out;
  }

  private updateLine(section: Section) {
    this.updateLineCounts(section);
    this.updateLineScheme(section);
    this.updateLineGrammar(section);
  }

  private updateLineGrammar(section: Section) {
    const lines = section.text.split('\n');
    Promise.all(lines.map((l) => this.models.checkGrammar(l))).then((perLine) => {
      this.lineGrammar.update((m) => ({ ...m, [section.id]: perLine }));
    });
  }

  private updateLineCounts(section: Section) {
    const lines = section.text.split('\n');
    const words = lines.map((l) => l.match(WORD_RE) ?? []);
    const flat = words.flat();
    if (!flat.length) {
      this.lineCounts.update((m) => ({ ...m, [section.id]: lines.map(() => ({ syllables: 0, estimated: false })) }));
      return;
    }
    this.models.syllables(flat).then((counts) => {
      let at = 0;
      const perLine = words.map((ws) => {
        const slice = counts.slice(at, at + ws.length);
        at += ws.length;
        return { syllables: slice.reduce((n: number, c) => n + (c.count ?? 0), 0), estimated: slice.some((c) => c.estimated) };
      });
      this.lineCounts.update((m) => ({ ...m, [section.id]: perLine }));
    });
  }

  private updateLineScheme(section: Section) {
    const endings = section.text.split('\n').map((l) => (l.match(WORD_RE) ?? []).at(-1)?.toLowerCase() ?? '');
    this.models.scheme(endings).then((result) => {
      this.lineSchemes.update((m) => ({ ...m, [section.id]: result }));
    });
  }

  // FR-23: find the word under the cursor on double-click and open the rhyme sheet for it.
  // A single click has to stay a normal click (place the caret, keep typing) or editing breaks.
  tapWord(event: MouseEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const pos = textarea.selectionStart;
    const text = textarea.value;
    let start = pos, end = pos;
    while (start > 0 && /[a-zA-Z']/.test(text[start - 1])) start--;
    while (end < text.length && /[a-zA-Z']/.test(text[end])) end++;
    if (start === end) { this.tapped.set(null); return; }
    this.tapped.set({ textarea, start, end, word: text.slice(start, end) });
  }

  closeTap() {
    this.tapped.set(null);
  }

  // FR-09/11: apply a grammar flag's suggestion (or, for a doubled word, remove the repeat).
  fixFlag(section: Section, sf: SectionFlag) {
    const lines = section.text.split('\n');
    const line = lines[sf.lineIndex];
    const { start, end, suggestion } = sf.flag;
    lines[sf.lineIndex] = suggestion
      ? line.slice(0, start) + suggestion + line.slice(end)
      : (line.slice(0, start).replace(/\s+$/, '') + line.slice(end)).replace(/^ /, '');
    this.setSectionText(section, lines.join('\n'));
  }

  ignoreOnce(section: Section, sf: SectionFlag) {
    const key = `${section.id}:${sf.lineIndex}:${sf.flag.key}:${sf.flag.start}`;
    this.ignoredOnce.update((s) => new Set(s).add(key));
  }

  ignoreInSong(section: Section, flag: GrammarFlag) {
    section.ignoredFlags = [...(section.ignoredFlags ?? []), flag.key];
    this.song.set({ ...this.song()! });
    this.scheduleSave();
  }

  addToDictionary(flag: GrammarFlag) {
    this.dictionary.add(flag.word);
  }

  useTappedWord(replacement: string) {
    const tapped = this.tapped();
    if (!tapped) return;
    const { textarea, start, end } = tapped;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    // execCommand (not a direct .value assignment) keeps this on the native undo stack, so Ctrl/Cmd+Z restores it.
    document.execCommand('insertText', false, replacement);
    this.tapped.set(null);
  }

  private scheduleSave() {
    this.status.set('saving');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const song = this.song();
      if (!song) return;
      song.updatedAt = Date.now();
      this.storage.save(song).then(() => this.status.set('saved'));
    }, AUTOSAVE_MS);
  }

  setTitle(title: string) {
    const song = this.song();
    if (!song) return;
    this.song.set({ ...song, title: title.trim() || 'Untitled song' });
    this.scheduleSave();
  }

  setSectionText(section: Section, text: string) {
    section.text = text;
    this.updateLine(section);
    this.scheduleSave();
  }

  // shortcut: one free-text progression per section, not chords placed over each line; upgrade to per-line chords if writers ask.
  setChords(section: Section, chords: string) {
    section.chords = chords.trim().split(/\s+/).filter(Boolean).join('  ') || undefined;
    this.scheduleSave();
  }

  renameSection(section: Section, name: string) {
    section.name = name.trim() || section.name;
    this.scheduleSave();
  }

  addSection() {
    const song = this.song();
    if (!song) return;
    const section: Section = { id: crypto.randomUUID(), name: `Section ${song.sections.length + 1}`, text: '' };
    song.sections.push(section);
    this.song.set({ ...song });
    this.updateLine(section);
    this.scheduleSave();
  }

  duplicateSection(index: number) {
    const song = this.song();
    if (!song) return;
    const copy: Section = { ...song.sections[index], id: crypto.randomUUID() };
    song.sections.splice(index + 1, 0, copy);
    this.song.set({ ...song });
    this.updateLine(copy);
    this.scheduleSave();
  }

  deleteSection(index: number) {
    const song = this.song();
    if (!song || song.sections.length <= 1) return;
    song.sections.splice(index, 1);
    this.song.set({ ...song });
    this.scheduleSave();
  }

  moveSection(index: number, dir: -1 | 1) {
    const song = this.song();
    if (!song) return;
    const target = index + dir;
    if (target < 0 || target >= song.sections.length) return;
    [song.sections[index], song.sections[target]] = [song.sections[target], song.sections[index]];
    this.song.set({ ...song });
    this.scheduleSave();
  }

  // FR-33: export .txt / PDF for this one song.
  async deleteSong() {
    const song = this.song();
    if (!song || !confirm(`Delete "${song.title || 'Untitled song'}" and its takes? This cannot be undone.`)) return;
    clearTimeout(this.saveTimer); // a pending autosave would bring the song back
    await this.storage.remove(song.id);
    await this.router.navigate(['/songs']);
  }

  exportText() {
    const song = this.song();
    if (!song) return;
    const text = `${song.title}\n\n${song.sections.map((s) => `${s.name}\n${s.chords ? s.chords + '\n' : ''}${s.text}`).join('\n\n')}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title || 'untitled song'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // The browser's own print dialog has a "Save as PDF" destination on every platform
  // this app ships to - no PDF library needed. .print-only in the stylesheet hides
  // everything but the title and lyrics for this.
  exportPdf() {
    window.print();
  }
}

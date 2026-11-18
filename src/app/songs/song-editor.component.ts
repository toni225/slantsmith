import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { onBeat, patternName, tempoFromTaps, type WordStress } from './meter';
import { songStats } from './stats';
import { chartLines, hasChords, maskChords, segments, usedChords } from './chordpro';
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
  private readonly settings = inject(SettingsService);
  readonly hideExplicit = this.settings.hideExplicit;
  readonly chordsOverWords = this.settings.chordsOverWords;
  protected readonly hasChords = hasChords;
  protected readonly segments = segments;
  // Chords over the words: chips of the chords this song already uses, for one-tap insert.
  // A method, not computed(): typing edits section.text in place, which a computed would not notice.
  songChords(): string[] {
    const song = this.song();
    if (!song) return [];
    const inline = usedChords(song.sections.map((s) => s.text).join('\n'));
    const rows = song.sections.flatMap((s) => (s.chords ?? '').split(/\s+/).filter(Boolean));
    return [...new Set([...inline, ...rows])];
  }
  readonly tapped = signal<TappedWord | null>(null);
  // Meter view (one section at a time) and song stats.
  readonly lineWords = signal<Record<string, WordStress[][]>>({});
  readonly meterFor = signal<string | null>(null);
  readonly meterPlaying = signal<{ line: number; syl: number } | null>(null);
  readonly bpm = signal(90);
  readonly stats = computed(() => {
    const song = this.song();
    if (!song) return null;
    const counts = Object.values(this.lineCounts()).flat().map((c) => c.syllables).filter((n) => n > 0);
    const letters = Object.values(this.lineSchemes()).flat();
    return {
      ...songStats(song.sections.map((s) => ({ ...s, text: s.text.split('\n').map(maskChords).join('\n') }))),
      avgSyllables: counts.length ? Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10 : 0,
      maxSyllables: counts.length ? Math.max(...counts) : 0,
      perfect: letters.filter((l) => l.type === 'perfect').length,
      slant: letters.filter((l) => l.type === 'slant').length,
    };
  });
  private taps: number[] = [];
  private meterTimer?: ReturnType<typeof setTimeout>;
  private audio?: AudioContext;

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
      clearTimeout(this.meterTimer);
      void this.audio?.close();
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
    const lines = section.text.split('\n').map(maskChords); // [Am] chords are not words; same length keeps flag positions
    Promise.all(lines.map((l) => this.models.checkGrammar(l))).then((perLine) => {
      this.lineGrammar.update((m) => ({ ...m, [section.id]: perLine }));
    });
  }

  private updateLineCounts(section: Section) {
    const lines = section.text.split('\n').map(maskChords);
    const words = lines.map((l) => l.match(WORD_RE) ?? []);
    const flat = words.flat();
    if (!flat.length) {
      this.lineCounts.update((m) => ({ ...m, [section.id]: lines.map(() => ({ syllables: 0, estimated: false })) }));
      this.lineWords.update((m) => ({ ...m, [section.id]: lines.map(() => []) }));
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
      at = 0;
      const stress = words.map((ws) => ws.map((word) => ({ word, stress: counts[at++].stress })));
      this.lineWords.update((m) => ({ ...m, [section.id]: stress }));
    });
  }

  private updateLineScheme(section: Section) {
    const endings = section.text.split('\n').map(maskChords).map((l) => (l.match(WORD_RE) ?? []).at(-1)?.toLowerCase() ?? '');
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
    const text = `${song.title}\n\n${song.sections.map((s) => `${s.name}\n${s.chords ? s.chords + '\n' : ''}${s.text.split('\n').flatMap(chartLines).join('\n')}`).join('\n\n')}\n`;
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

  // Puts [chord] at the caret. The chip's mousedown is cancelled, so the textarea keeps its caret;
  // execCommand keeps it on the browser's undo stack, like the rhyme swap.
  insertChord(textarea: HTMLTextAreaElement, chord: string) {
    chord = chord.trim().replace(/[[\]]/g, '');
    if (!chord) return;
    textarea.focus();
    document.execCommand('insertText', false, `[${chord}]`);
  }

  // Meter view: each line's syllables with their stress, and a tap-along player.
  meterLines(section: Section) {
    return (this.lineWords()[section.id] ?? []).map((ws) => {
      let start = 0;
      const words = ws.map((w) => ({ ...w, start: (start += w.stress.length) - w.stress.length })); // start: first syllable's place in the line
      const stress = ws.flatMap((w) => w.stress);
      return { words, stress, pattern: patternName(stress), beat: onBeat(stress) };
    });
  }

  toggleMeter(section: Section) {
    this.stopMeter();
    this.meterFor.set(this.meterFor() === section.id ? null : section.id);
  }

  tapTempo() {
    const now = performance.now();
    this.taps = [...this.taps.filter((t) => now - t < 8000), now];
    const bpm = tempoFromTaps(this.taps);
    if (bpm) this.bpm.set(bpm);
    this.click(true);
  }

  // One syllable every half beat, each line starting on a beat, a click on every beat.
  playMeter(section: Section) {
    if (this.meterPlaying()) return this.stopMeter();
    const steps: { line: number; syl: number }[] = [];
    this.meterLines(section).forEach((l, line) => {
      if (!l.stress.length) return;
      if (l.beat.offset) steps.push({ line, syl: -1 }); // a pickup line starts half a beat in
      l.stress.forEach((_, syl) => steps.push({ line, syl }));
      if (steps.length % 2) steps.push({ line, syl: -1 }); // pad to a whole beat
      steps.push({ line, syl: -1 }, { line, syl: -1 }); // one beat of rest between lines
    });
    let i = 0;
    const step = () => {
      if (i >= steps.length) return this.stopMeter();
      if (i % 2 === 0) this.click(false);
      this.meterPlaying.set(steps[i++]);
      this.meterTimer = setTimeout(step, 30000 / this.bpm());
    };
    step();
  }

  stopMeter() {
    clearTimeout(this.meterTimer);
    this.meterPlaying.set(null);
  }

  private click(accent: boolean) {
    this.audio ??= new AudioContext();
    void this.audio.resume();
    const t = this.audio.currentTime, osc = this.audio.createOscillator(), gain = this.audio.createGain();
    osc.frequency.value = accent ? 1320 : 880;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(this.audio.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}

import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SongStorageService } from '../songs/song-storage.service';
import { TabNavComponent } from '../shell/tab-nav.component';
import { DIATONIC, EXTENSIONS, chordFor, chordFrequencies, extend, numeralAt, type Extension, type Mode } from '../../engines/chords';
import { GENRES, type Preset } from './genres';

const KEYS: Record<Mode, string[]> = {
  major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  // D# not Eb: a minor key is spelled the way its chords are, and Eb minor's chords use sharps (see spelling()).
  minor: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
};
const STORE_KEY = 'slantsmith.chords';
const [BPM_MIN, BPM_MAX, BPM_STEP] = [60, 180, 10];

// What the page remembers between visits. Anything missing or broken falls back to the default.
// The sounds a chord can play in. All built from oscillators (no samples), so they work offline.
// partials: [frequency multiple, level] stacked per note. sustain: hold the note, then let go (organ, pad)
// instead of fading from the start (keys, piano, guitar). strum: seconds between notes. cutoff: low-pass Hz.
interface Sound { id: string; label: string; wave: OscillatorType; partials: number[][]; gain: number; attack: number; length: number; sustain?: boolean; strum?: number; cutoff?: number; detune?: number }
const SOUNDS: Sound[] = [
  { id: 'keys', label: 'Soft keys', wave: 'triangle', partials: [[1, 1]], gain: 1, attack: 0.02, length: 1.1 },
  { id: 'piano', label: 'Piano', wave: 'sine', partials: [[1, 1], [2, 0.45], [3, 0.2], [4, 0.08]], gain: 1.2, attack: 0.005, length: 1.5 },
  { id: 'organ', label: 'Organ', wave: 'sine', partials: [[1, 1], [2, 0.6], [3, 0.3], [4, 0.25]], gain: 0.9, attack: 0.03, length: 1.1, sustain: true },
  { id: 'guitar', label: 'Guitar', wave: 'sawtooth', partials: [[1, 1]], gain: 0.8, attack: 0.004, length: 1.4, strum: 0.035, cutoff: 1900 },
  { id: 'pad', label: 'Warm pad', wave: 'sawtooth', partials: [[1, 1]], gain: 0.7, attack: 0.25, length: 1.6, sustain: true, cutoff: 1100, detune: 7 },
];

function saved(): { root: number; mode: Mode; progression: string[]; bpm: number; loop: boolean; sound: string } {
  const fresh = { root: 0, mode: 'major' as Mode, progression: [] as string[], bpm: 100, loop: false, sound: 'keys' };
  try {
    const s = { ...fresh, ...JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') };
    if (!(s.root >= 0 && s.root < 12) || !(s.mode in KEYS) || !(s.bpm >= BPM_MIN && s.bpm <= BPM_MAX)) return fresh;
    s.progression.forEach((n: string) => chordFor(n, s.root, s.mode)); // throws on a numeral this version cannot read
    return { ...s, loop: !!s.loop, sound: SOUNDS.some((v) => v.id === s.sound) ? s.sound : 'keys' };
  } catch {
    return fresh;
  }
}

@Component({
  selector: 'app-chords-page',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './chords-page.component.html',
  styleUrl: './chords-page.component.css',
})
export class ChordsPageComponent {
  readonly genres = GENRES;
  readonly modes: Mode[] = ['major', 'minor'];
  readonly extensions = EXTENSIONS;

  private readonly start = saved();
  readonly root = signal(this.start.root);
  readonly mode = signal<Mode>(this.start.mode);
  readonly bpm = signal(this.start.bpm); // one chord lasts two beats
  readonly loop = signal(this.start.loop);
  readonly sounds = SOUNDS;
  readonly sound = signal(this.start.sound);
  readonly ext = signal<Extension>('triad'); // the colour the pad plays in
  readonly progression = signal<string[]>(this.start.progression); // roman numerals (with colour), so it follows the key
  readonly lit = signal<string | null>(null); // the chord just heard, "ruby = record light"
  readonly shown = signal<string | null>(null); // the last chord heard, for the notes readout
  readonly playing = signal(-1); // index in progression while Play runs
  readonly copied = signal(false);
  readonly keyOpen = signal(false);
  readonly selected = signal(-1); // index of the chord picked in the progression, to move or remove
  readonly sent = signal(''); // "Put into Verse 1", shown briefly after sending chords to a song
  private readonly storage = inject(SongStorageService);
  readonly song = computed(() => this.storage.songs()[0] ?? null); // the song edited last, same as the Songs list's continue card
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

  readonly keys = computed(() => KEYS[this.mode()]);
  readonly extNote = computed(() => EXTENSIONS.find((e) => e.id === this.ext())!.note);
  // Circle of fifths, C at the top: 12 major chords outside, their relative minors inside, the key's
  // diminished chord in the middle. Chords of the key are marked; the rest still play (borrowed chords).
  readonly wheel = computed(() => {
    const mode = this.mode();
    const cell = (i: number, minor: boolean) => {
      const pc = (i * 7 + (minor ? 9 : 0)) % 12;
      const base = numeralAt(pc - this.root(), minor, mode);
      const numeral = extend(base, this.ext(), mode);
      const [ro, ri] = minor ? [106, 62] : [158, 108];
      const pt = (r: number, deg: number) => {
        const a = (deg * Math.PI) / 180;
        return `${(160 + r * Math.sin(a)).toFixed(1)} ${(160 - r * Math.cos(a)).toFixed(1)}`;
      };
      const [a0, a1] = [i * 30 - 15, i * 30 + 15];
      const [tx, ty] = pt((ro + ri) / 2, i * 30).split(' ');
      return {
        numeral, symbol: this.symbol(numeral), minor, tx, ty,
        inKey: DIATONIC[mode].includes(base), home: pc === this.root() && minor === (mode === 'minor'),
        d: `M${pt(ro, a0)}A${ro} ${ro} 0 0 1 ${pt(ro, a1)}L${pt(ri, a1)}A${ri} ${ri} 0 0 0 ${pt(ri, a0)}Z`,
      };
    };
    const ring = Array.from({ length: 12 }, (_, i) => [cell(i, false), cell(i, true)]).flat();
    const dim = extend(DIATONIC[mode].find((n) => n.endsWith('°'))!, this.ext(), mode);
    return { ring, dim: { numeral: dim, symbol: this.symbol(dim) } };
  });
  readonly info = computed(() => {
    const n = this.shown();
    return n ? { numeral: n, ...chordFor(n, this.root(), this.mode()) } : null;
  });
  // Three octaves of piano keys (C to B), the notes of the chord just heard lit.
  readonly piano = computed(() => {
    const c = this.info();
    const on = new Set(c ? c.semitones.map((s) => c.root + s) : []);
    const white: { x: number; lit: boolean }[] = [];
    const black: { x: number; lit: boolean }[] = [];
    for (let o = 0; o < 3; o++) {
      [0, 2, 4, 5, 7, 9, 11].forEach((st, w) => white.push({ x: (o * 7 + w) * 10, lit: on.has(o * 12 + st) }));
      [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]].forEach(([st, w]) => black.push({ x: (o * 7 + w + 1) * 10 - 3, lit: on.has(o * 12 + st) }));
    }
    return { white, black };
  });
  readonly symbols = computed(() => this.progression().map((n) => this.symbol(n)));

  private ctx?: AudioContext;
  private timer?: ReturnType<typeof setTimeout>;
  private litTimer?: ReturnType<typeof setTimeout>;
  private tapTimer?: ReturnType<typeof setTimeout>;
  // Drag-to-reorder state. Nothing in the progression changes until the drop.
  private drag?: { startX: number; scroll0: number; centers: number[]; armed: boolean; hold?: ReturnType<typeof setTimeout> };
  readonly dragFrom = signal(-1); // index of the chord being dragged, -1 when none
  readonly dragTo = signal(-1); // where it would land
  readonly dragDx = signal(0); // how far it has been dragged, in px
  private dragW = 0; // its width plus the row gap: how far the others slide to make room

  constructor() {
    // Keep the newest chord in view as the progression grows.
    // Once a chord is lifted by touch, stop the browser scrolling the row under the finger.
    const hold = (ev: TouchEvent) => { if (this.dragFrom() >= 0) ev.preventDefault(); };
    effect(() => this.strip()?.nativeElement.addEventListener('touchmove', hold, { passive: false }));
    let count = this.progression().length;
    effect(() => {
      const n = this.progression().length;
      const el = this.strip()?.nativeElement;
      if (el && n > count) queueMicrotask(() => (el.scrollLeft = el.scrollWidth)); // only when one is added, not on reorder
      count = n;
    });
    effect(() => {
      const state = { root: this.root(), mode: this.mode(), progression: this.progression(), bpm: this.bpm(), loop: this.loop(), sound: this.sound() };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        // Storage can be full or blocked (private window); the page still works, it just forgets.
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
      clearTimeout(this.litTimer);
      clearTimeout(this.tapTimer);
      void this.ctx?.close();
    });
  }

  symbol(numeral: string, mode: Mode = this.mode()): string {
    return chordFor(numeral, this.root(), mode).symbol;
  }

  presetSymbols(p: Preset): string {
    return p.numerals.map((n) => this.symbol(n, p.mode)).join('  ');
  }

  presetNumerals(p: Preset): string {
    return p.numerals.join(' – ');
  }

  setKey(i: number) {
    this.root.set(i);
  }

  setExt(e: Extension) {
    this.ext.set(e);
  }

  setMode(m: Mode) {
    if (m === this.mode()) return;
    this.stop();
    this.mode.set(m);
    this.shown.set(null);
    this.selected.set(-1);
    this.progression.set([]); // numerals mean different chords in the other mode
  }

  // One tap only plays (hear); a double tap adds. The two clicks of a double tap have already played it.
  // A tap on the wheel waits a moment before it sounds, so a double tap (which adds the chord) stays silent.
  press(numeral: string, ev: MouseEvent) {
    clearTimeout(this.tapTimer);
    if (ev.detail < 2) this.tapTimer = setTimeout(() => this.hear(numeral), 220);
  }

  select(i: number) {
    this.selected.set(this.selected() === i ? -1 : i);
    this.hear(this.progression()[i]);
  }

  move(dir: 1 | -1) {
    const i = this.selected();
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.progression().length) return;
    this.stop();
    this.progression.update((p) => {
      const q = [...p];
      [q[i], q[j]] = [q[j], q[i]];
      return q;
    });
    this.selected.set(j);
  }

  // Drag any chord along the row to reorder it. Mouse: press and drag. Touch: hold a moment, then drag
  // (a quick swipe still scrolls the row). The chord follows the pointer; the others slide aside.
  dragStart(ev: PointerEvent) {
    const strip = this.strip()?.nativeElement;
    const li = (ev.target as HTMLElement).closest('li');
    if (!strip || !li || this.progression().length < 2) return;
    const items = Array.from(strip.children) as HTMLElement[];
    const from = items.indexOf(li);
    const drag = { startX: ev.clientX, scroll0: strip.scrollLeft, centers: items.map((e) => e.offsetLeft + e.offsetWidth / 2), armed: ev.pointerType !== 'touch', hold: undefined as ReturnType<typeof setTimeout> | undefined };
    const lift = () => {
      drag.armed = true;
      this.stop();
      this.dragW = li.offsetWidth + 8; // 8 = the row's gap
      this.dragFrom.set(from);
      this.dragTo.set(from);
      strip.setPointerCapture(ev.pointerId); // from here the release is a drop, not a tap
    };
    if (!drag.armed) drag.hold = setTimeout(() => { lift(); navigator.vibrate?.(10); }, 250);
    this.drag = Object.assign(drag, { lift });
  }

  dragMove(ev: PointerEvent) {
    const strip = this.strip()?.nativeElement;
    const d = this.drag as (typeof this.drag & { lift: () => void }) | undefined;
    if (!d || !strip) return;
    const moved = Math.abs(ev.clientX - d.startX) > 6;
    if (this.dragFrom() < 0) {
      if (!moved) return;
      if (!d.armed) return this.dragEnd(); // a touch that moves before the hold is a scroll
      d.lift();
    }
    // Near either end of the row, scroll it so a far-away spot can be reached.
    const box = strip.getBoundingClientRect();
    if (ev.clientX > box.right - 32) strip.scrollLeft += 12;
    else if (ev.clientX < box.left + 32) strip.scrollLeft -= 12;
    const dx = ev.clientX - d.startX + strip.scrollLeft - d.scroll0;
    const from = this.dragFrom();
    const at = d.centers[from] + dx;
    let to = from;
    d.centers.forEach((c, j) => {
      if (j > from && at > c) to = j;
      if (j < from && at < c && to >= from) to = j;
    });
    this.dragDx.set(dx);
    this.dragTo.set(to);
  }

  dragEnd() {
    clearTimeout(this.drag?.hold);
    this.drag = undefined;
    const [from, to] = [this.dragFrom(), this.dragTo()];
    this.dragFrom.set(-1);
    this.dragDx.set(0);
    if (from < 0) return;
    if (to !== from) {
      this.progression.update((p) => {
        const q = [...p];
        q.splice(to, 0, ...q.splice(from, 1));
        return q;
      });
    }
    this.selected.set(to);
  }

  // Where each chord sits while one is dragged: the dragged one follows the pointer, the ones it passes step aside.
  shift(i: number): string | null {
    const [from, to] = [this.dragFrom(), this.dragTo()];
    if (from < 0) return null;
    if (i === from) return `translateX(${this.dragDx()}px)`;
    if (i > from && i <= to) return `translateX(${-this.dragW}px)`;
    if (i < from && i >= to) return `translateX(${this.dragW}px)`;
    return 'translateX(0)';
  }

  // Writes the progression into a section's chord row of the song edited last.
  async sendTo(sectionId: string) {
    const song = this.song();
    if (!song) return;
    const chords = this.symbols().join('  ');
    const sections = song.sections.map((s) => (s.id === sectionId ? { ...s, chords } : s));
    await this.storage.save({ ...song, sections, updatedAt: Date.now() });
    this.sent.set(`Put into ${song.sections.find((s) => s.id === sectionId)?.name}`);
    setTimeout(() => this.sent.set(''), 1500);
  }

  add(numeral: string) {
    clearTimeout(this.tapTimer);
    this.progression.update((p) => [...p, numeral]);
  }

  remove(i: number) {
    this.stop();
    this.progression.update((p) => p.filter((_, j) => j !== i));
    this.selected.set(-1);
  }

  clear() {
    this.stop();
    this.selected.set(-1);
    this.progression.set([]);
  }

  load(p: Preset) {
    this.stop();
    this.mode.set(p.mode);
    this.selected.set(-1);
    this.progression.set([...p.numerals]);
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.symbols().join('  '));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard can be blocked (no permission, insecure context); the chords stay on screen to copy by hand.
    }
  }

  hear(numeral: string, mode: Mode = this.mode()) {
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    const notes = chordFrequencies(numeral, this.root(), mode);
    const v = SOUNDS.find((x) => x.id === this.sound()) ?? SOUNDS[0];
    let out: AudioNode = this.ctx.destination;
    if (v.cutoff) {
      const filter = this.ctx.createBiquadFilter(); // takes the buzz off the sawtooth
      filter.type = 'lowpass';
      filter.frequency.value = v.cutoff;
      filter.connect(out);
      out = filter;
    }
    const cents = v.detune ? [-v.detune, v.detune] : [0]; // two slightly detuned copies = a wider, warmer sound
    const total = v.partials.reduce((sum, p) => sum + p[1], 0) * cents.length * notes.length;
    notes.forEach((f, k) => {
      const t = now + k * (v.strum ?? 0);
      for (const [mult, level] of v.partials) for (const c of cents) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const peak = (0.36 * v.gain * level) / total; // same total loudness for a triad or a 13th
        osc.type = v.wave;
        osc.frequency.value = f * mult;
        osc.detune.value = c;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(peak, t + v.attack);
        if (v.sustain) gain.gain.setValueAtTime(peak, t + v.length * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + v.length);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + v.length + 0.1);
      }
    });
    this.lit.set(numeral);
    this.shown.set(numeral);
    clearTimeout(this.litTimer);
    this.litTimer = setTimeout(() => this.lit.set(null), 450);
  }

  play() {
    if (this.playing() >= 0) return this.stop();
    const run = (i: number) => {
      const p = this.progression();
      if (!p.length || (i >= p.length && !this.loop())) return this.stop();
      i %= p.length;
      this.playing.set(i);
      this.hear(p[i]);
      this.timer = setTimeout(() => run(i + 1), 120000 / this.bpm()); // two beats a chord
    };
    run(0);
  }

  // Picking a sound plays the last chord heard (or the home chord) in it, so the choice is heard at once.
  setSound(id: string) {
    this.sound.set(id);
    this.hear(this.shown() ?? DIATONIC[this.mode()][0]);
  }

  tempo(dir: 1 | -1) {
    this.bpm.update((b) => Math.min(BPM_MAX, Math.max(BPM_MIN, b + dir * BPM_STEP)));
  }

  stop() {
    clearTimeout(this.timer);
    this.playing.set(-1);
  }
}

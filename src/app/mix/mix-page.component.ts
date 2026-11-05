import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabNavComponent } from '../shell/tab-nav.component';
import { SongStorageService } from '../songs/song-storage.service';

export interface LoudnessRow { platform: string; lufs: string; peak: string }
export interface ChecklistItem { id: string; label: string }
export interface FaqEntry { q: string; a: string }

// Published loudness targets, checked 2026-11-05; platforms change these occasionally.
export const LOUDNESS: LoudnessRow[] = [
  { platform: 'Spotify', lufs: '−14 LUFS', peak: '−1 dBTP' },
  { platform: 'Apple Music', lufs: '−16 LUFS', peak: '−1 dBTP' },
  { platform: 'YouTube', lufs: '−14 LUFS', peak: '−1 dBTP' },
  { platform: 'Amazon Music', lufs: 'about −14 LUFS', peak: '−1 dBTP' },
  { platform: 'Tidal', lufs: '−14 LUFS', peak: '−1 dBTP' },
  { platform: 'Deezer', lufs: '−15 LUFS', peak: '−1 dBTP' },
];

export const EQ_GUIDE: { source: string; ranges: string }[] = [
  { source: 'Vocals', ranges: 'Low-cut below 80–100 Hz (rumble); body 150–500 Hz; presence 2–5 kHz; air above 10 kHz' },
  { source: 'Kick drum', ranges: 'Thump 40–80 Hz; beater click 2–4 kHz' },
  { source: 'Snare', ranges: 'Body 150–250 Hz; crack 2–5 kHz; snap/rattle 5–8 kHz' },
  { source: 'Bass', ranges: 'Fundamental 40–200 Hz; definition/finger noise 700 Hz–1 kHz' },
  { source: 'Guitar', ranges: 'Body 100–250 Hz; presence/pick attack 2–4 kHz' },
  { source: 'Keys / piano', ranges: 'Wide range, 30 Hz–5 kHz+; watch for buildup around 200–400 Hz with other instruments' },
  { source: 'Hi-hats / cymbals', ranges: 'Shimmer and air, mostly above 8 kHz; low-cut below 400 Hz to clear room for everything else' },
  { source: 'Strings / pads', ranges: 'Wide and sustained, 200 Hz–8 kHz; low-cut below 150 Hz so they sit behind the bass, not on top of it' },
];

export const BEFORE_MASTERING: ChecklistItem[] = [
  { id: 'gain-staged', label: 'Levels gain-staged, nothing clipping' },
  { id: 'balance-checked', label: 'Rough mix balance checked on headphones and speakers' },
  { id: 'silence-trimmed', label: 'Silence trimmed at the start and end' },
  { id: 'vocal-deessed', label: 'Harsh vocal sibilance tamed' },
  { id: 'mono-checked', label: 'Low end checked in mono' },
  { id: 'reference-matched', label: 'Compared against a reference track at matched loudness' },
  { id: 'fresh-bounce', label: 'Final bounce is a fresh, unprocessed stereo file' },
];

export const DELIVERY: ChecklistItem[] = [
  { id: 'format', label: 'WAV, 24-bit (or 16-bit if that’s all you have), 44.1 kHz or higher' },
  { id: 'true-peak', label: 'True peak at or below −1 dBTP' },
  { id: 'loudness', label: 'Loudness in range for where it’s going (see the table above)' },
  { id: 'metadata', label: 'Title, artist and any ISRC filled in' },
  { id: 'filename', label: 'File named clearly - artist - title, no special characters' },
  { id: 'clean-file', label: 'No reference track or click track bleeding into the file' },
  { id: 'backed-up', label: 'Project file and stems backed up somewhere other than this one device' },
];

export const FAQ: FaqEntry[] = [
  { q: 'How do I fix vocal harshness?', a: 'Harshness usually sits in the 2–5 kHz presence range, where the ear is most sensitive. Try a narrow dip there, or a de-esser if it’s specifically on S and T sounds (sibilance) rather than the whole vocal.' },
  { q: 'How loud should my song be?', a: 'Aim for the loudness column above for wherever it’s going. Most streaming services turn a louder master down to match their target anyway, so chasing extra loudness past that just loses dynamics for nothing.' },
  { q: 'What is LUFS?', a: 'Loudness Units Full Scale - a measure of how loud a track sounds over time, not just its peak level. It’s what streaming platforms use to set their playback volume.' },
  { q: 'Why does my mix sound different on phone speakers?', a: 'Phone speakers can’t reproduce much below 150–200 Hz and often boost the upper mids. Check a mix there and on headphones before calling it done - if the vocal and low end both hold up on both, you’re in good shape.' },
  { q: 'Should I master my own music?', a: 'You can, especially for a demo or a quick release. A second pair of ears (or an automated mastering service) on a track that really matters is still worth it, since it’s hard to hear your own mix objectively after hours in it.' },
  { q: 'What format should I export?', a: 'WAV for mastering and archiving. Most platforms accept WAV or high-bitrate MP3/AAC for upload and handle the final compression themselves.' },
  { q: 'Why is my mix muddy?', a: 'Usually too much buildup in the 200–500 Hz range across several instruments at once. Try a gentle cut there on anything that doesn’t need its own low-mid warmth, and check your low end in mono.' },
  { q: "What's the difference between EQ and compression?", a: 'EQ shapes which frequencies are louder or quieter. Compression shapes how loud the loudest and quietest moments are relative to each other, over time. Most mixes need both, in that rough order.' },
  { q: 'Do I need stems, or just the final mix?', a: 'For your own distribution, just the final stereo mix. Keep your project file and stems anyway - for a future remix, a sync license, or if mastering reveals something you want to fix in the mix.' },
  { q: 'What is a limiter, and when do I use one?', a: 'A limiter is a fast, hard compressor that stops a signal from going above a set ceiling - it’s the last thing in the chain, used to raise loudness and catch stray peaks without changing the overall balance underneath it.' },
  { q: 'How do I avoid clipping?', a: 'Leave headroom while mixing (keep your loudest moment a few dB under 0) and use a limiter, not raw gain, to bring the final level up. Clipping happens when a signal is pushed past 0 dBFS with nothing to catch it.' },
  { q: 'What’s the difference between mixing and mastering?', a: 'Mixing balances the individual tracks of one song against each other - levels, panning, EQ, compression. Mastering treats the finished mix as a single file, polishing and setting its final loudness so it holds up next to other songs.' },
  { q: 'Why does my vocal sound thin?', a: 'Often a missing low-mid body (150–500 Hz) or too much cut below 100 Hz. Check it’s not too quiet relative to the instruments either - a vocal sitting just under the mix reads as thin even with the EQ right.' },
  { q: 'How do I make my mix louder without clipping?', a: 'A limiter on the master bus, pushed gradually - watch the gain reduction, not just the loudness number, and stop once it starts audibly squashing the loudest hits. Loudness should be the last step, not something you mix toward.' },
  { q: 'What is a reference track, and how do I use one?', a: 'A finished, professionally mixed song in a similar style to yours, played at matched loudness alongside your mix so you’re comparing balance and tone on equal footing, not just "mine sounds quieter so something’s wrong."' },
  { q: 'Why do my kick and bass fight each other?', a: 'They usually overlap in the same low frequencies. Carve a small pocket for each - a slight cut in the bass where the kick’s thump peaks, or the reverse - so they take turns in that low-end space instead of masking each other.' },
  { q: 'Do I need expensive headphones or monitors to mix?', a: 'No - consistency matters more than price. Learn one set of headphones or speakers well, check mixes on a second device (phone speaker, car, earbuds), and a reference track will catch more problems than better hardware alone.' },
  { q: 'What is panning, and when should I use it?', a: 'Placing a sound left-to-right in the stereo field instead of dead center. Spreading out guitars, backing vocals or hi-hats gives the lead vocal and bass (usually kept centered) room to stand out instead of competing for the same space.' },
];

function matches(q: string, ...text: string[]): boolean {
  return text.some((t) => t.toLowerCase().includes(q));
}

@Component({
  selector: 'app-mix-page',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './mix-page.component.html',
  styleUrl: './mix-page.component.css',
})
export class MixPageComponent {
  private readonly storage = inject(SongStorageService);

  readonly loudness = LOUDNESS;
  readonly eqGuide = EQ_GUIDE;
  readonly delivery = DELIVERY;
  readonly beforeMastering = BEFORE_MASTERING;

  readonly search = signal('');

  // FR per Mix.dc.html: the checklist tracks the most recently edited song, same as Songs' "continue" card.
  readonly currentSong = computed(() => this.storage.songs()[0]);
  readonly checklistDone = computed(() => {
    const song = this.currentSong();
    if (!song) return 0;
    return BEFORE_MASTERING.filter((item) => song.checklist?.[item.id]).length;
  });

  readonly filteredFaq = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((f) => matches(q, f.q, f.a));
  });

  setSearch(q: string) {
    this.search.set(q);
  }

  isChecked(itemId: string): boolean {
    return !!this.currentSong()?.checklist?.[itemId];
  }

  async toggleChecklist(itemId: string) {
    const song = this.currentSong();
    if (!song) return;
    song.checklist = { ...song.checklist, [itemId]: !song.checklist?.[itemId] };
    song.updatedAt = Date.now();
    await this.storage.save(song);
  }
}

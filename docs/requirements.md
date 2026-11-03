# v1.0 requirements baseline (Phase 2)

20 functional and 9 non-functional requirements. Anything not listed is v1.1 (chord sheet, key helper, metronome, voice memos, prompts, cliché detector, song stats, custom words, related words, structure templates, split sheet, mix starting points and calculators).

## Users

| Persona | Main need |
| --- | --- |
| Hobby songwriter (phone + guitar, evenings) | Find a rhyme that keeps the meaning, fast |
| Rapper / lyricist | Multi-syllable and slant rhymes, syllable counts, slang |
| Bedroom producer | Trustworthy mixing and mastering references |

## Rhymes and words

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-01 | Perfect rhymes: same sounds from the last stressed vowel, different sound before it | "light" gives night, bright, fight in top 10; not "light" itself |
| FR-02 | Slant rhymes ranked by closeness, labelled assonance / consonance / family / additive / subtractive | "home" gives "alone" labelled assonance in top 50; "tree" gives "freeze" labelled additive |
| FR-03 | Rhyme a phrase on its last 2-3 stressed syllables | "falling apart": each stressed word's match in its top 20 |
| FR-04 | Syllable count and stress pattern for any word | "beautiful": 3 syllables, DA-da-da |
| FR-05 | Filters: syllables (1, 2, 3, 4+), word type, common only | 2-syllable filter shows only 2-syllable words |
| FR-06 | Estimate unknown words, tag results "estimated" | "Malibuzz" gives rhymes within 200 ms, tagged estimated |

## Grammar and spelling

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-09 | Spelling + confusables (their/there/they're, your/you're, its/it's, then/than, lose/loose, affect/effect, to/too), a/an by sound, doubled small words (the, a, an, to, of, in, at, for, and, is, was), lowercase "i" | "their going home": "their" flagged, fix "they're" |
| FR-10 | Lyric mode, on by default: no flags for fragments, missing punctuation, dropped letters (runnin'), ain't, double negatives, lowercase line starts, lyric spellings (gonna, wanna, 'cause, y'all…), repeats for effect (baby baby) | "runnin' through the night": nothing flagged |
| FR-11 | Ignore once, in this song, or add to personal dictionary | "ignore in song" persists after reload |

## Lyric editor

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-20 | Sections (Intro, Verse, Pre-chorus, Chorus, Bridge, Outro, custom): add, rename, reorder, duplicate, delete | Duplicated, moved chorus keeps text and order |
| FR-21 | Live syllable count per line; italic if estimated | Count updates within 100 ms |
| FR-22 | Rhyme letters A, B, C… per line ending; colour + underline style (dotted slant, solid perfect) | night/day/light/way reads A B A B |
| FR-23 | Tap a word: rhymes in bottom sheet (phone) / side panel; tap result replaces word | "heart" → "start", undo restores |
| FR-32 | Autosave within 2 s; auto snapshot every 10 min (keep 20); unlimited named takes; restore | Close mid-edit, lose ≤ 2 s of typing |
| FR-33 | Export .txt / PDF; full backup .json export and import | Backup on another device matches exactly |

## Mix help

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-40 | Searchable offline FAQ, 25+ entries (owner writes, audio advisor reviews) | "loudness spotify" offline: loudness entry first |
| FR-41 | Loudness table: LUFS, true peak, note, source link, last-checked date | Every row has all five |
| FR-42 | EQ guide by range and for vocals, kick, snare, bass, guitar, keys | "vocals" shows body, mud, presence, sibilance, air |
| FR-44 | Pre-mastering and delivery checklists, ticks saved per song | Song A ticks don't show on song B |

## Settings

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-50 | Theme (system, studio dark, paper light), text size (3), lyric-mode default, hide explicit words (off by default) | Choice persists after reload and offline |

## Non-functional

| ID | Requirement | Measure |
| --- | --- | --- |
| NFR-01 | Rhymes while typing | p95 < 100 ms on a 2021 mid-range Android |
| NFR-02 | Size | App code < 600 KB, model < 2 MB, first load < 3 MB (gzipped) |
| NFR-03 | Startup | First visit usable < 3 s on 4G; repeat < 1 s |
| NFR-04 | Offline | All v1.0 features work with no network after first visit |
| NFR-05 | Privacy | No requests with user text; no trackers; strict CSP |
| NFR-06 | Accessibility | WCAG 2.2 AA; no meaning by colour alone; 44 px targets |
| NFR-07 | Compatibility | Last 2 versions of Chrome, Safari (iOS/macOS), Firefox, Edge; from 360 px |
| NFR-08 | Reliability | Autosave, crash recovery, storage-full warning at 80% |
| NFR-09 | Language | English only; any Unicode text saves safely |

## Test sets (in test/)

- Rhyme set, 300 items: perfect 100 (top 10, need 95%), slant 120 (right type in top 50, need 80%), multi 40 (each word in top 20, need 70%), unknown 40 (guessed sound rhymes with expected, need 60%). Plus a human rating: top 10 slant results for 50 words, 70% usable.
- Grammar set, 200 lines: 100 must flag (need 90% with right fix), 100 lyric lines must not flag (≤ 5% flagged), incl. "I had had enough" and "that that".

## Data model (IndexedDB "slantsmith", v1)

songs (id, title, createdAt, updatedAt, lyricMode, sections[{id,type,label,lines[]}], ignored[{rule,text}]); versions (id, songId, kind auto|named, name, time, snapshot); checklists (songId+listId, ticks); dictionary (word, added); settings (key/value); meta (schema, model version). Backup: `{ app: 'slantsmith', format: 1, exportedAt, songs, versions, checklists, dictionary, settings }`; validate fully before writing, reject bad files whole.

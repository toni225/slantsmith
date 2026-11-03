# Phase 2: Requirements

Oct 30, 2026 · @Toni Ross Inot

Phase 2 runs 2026-11-16 to Nov 29, 2026 (2 weeks, about 20 hours) and baselines 20 functional and 9 non-functional requirements for v1.0; design (Phase 3) follows from 2026-11-30 to 2026-12-13.

## Users

v1.0 serves three kinds of writer; the first two drive the rhyme and editor requirements, the third drives Mix Helper.

| Persona | Who | Main need | Pain today |
| --- | --- | --- | --- |
| Hobby songwriter | Writes on phone and guitar, evenings and weekends | Find a rhyme that keeps the meaning, fast | Rhyme sites give perfect rhymes only, full of ads, need internet |
| Rapper / lyricist | Dense lines, multi-syllable and slant rhymes, slang | Multi-syllable and slant matches, syllable counts per bar | Tools miss slant rhymes and do not know slang |
| Bedroom producer | Writes and mixes their own songs at home | Quick, trustworthy mixing and mastering references | Advice is scattered across videos and forums and often conflicts |

## User stories

| ID | As a… | I want to… | So that… | Requirements |
| --- | --- | --- | --- | --- |
| US-01 | Songwriter | Type a word and see perfect rhymes | I finish a line without breaking flow | FR-01, FR-05 |
| US-02 | Lyricist | See slant rhymes, labelled by type | I avoid clichéd perfect rhymes | FR-02 |
| US-03 | Rapper | Rhyme a whole phrase on its last stressed syllables | I can build multi-syllable rhymes | FR-03 |
| US-04 | Rapper | Get rhymes for slang and made-up words | My own vocabulary still works | FR-06 |
| US-05 | Songwriter | See syllables per line as I write | Matching lines fit the same melody | FR-04, FR-21 |
| US-06 | Songwriter | Write in labelled verse and chorus sections | My song structure is clear | FR-20 |
| US-07 | Songwriter | See my rhyme scheme coloured and lettered | I spot weak or missing rhymes | FR-22 |
| US-08 | Songwriter | Tap a word in my lyrics to get rhymes | I don't retype it in a search box | FR-23 |
| US-09 | Songwriter | Have spelling and grammar checked without lyric style being flagged | My lyrics read cleanly but keep their voice | FR-09, FR-10, FR-11 |
| US-10 | Songwriter | Never lose a draft and go back to older versions | I can experiment freely | FR-32 |
| US-11 | Songwriter | Export and back up my songs | I can share, print or move them | FR-33 |
| US-12 | Producer | Look up loudness targets, EQ ranges and checklists offline | I mix and deliver with confidence | FR-40 to FR-42, FR-44 |
| US-13 | Any user | Choose light or dark theme and text size | The app is comfortable to use | FR-50 |

## Functional requirements baseline

These 20 requirements are the full v1.0 scope. IDs match the main tab; FR-50 is new. Anything not listed here is v1.1.

### Rhymes and words

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-01 | Show perfect rhymes for a word: same sounds from the last stressed vowel to the end, different sound before it | Given "light", then "night", "bright", "fight" are in the top 10, and "light" itself is not listed |
| FR-02 | Show slant rhymes, ranked by closeness, each labelled: assonance, consonance, family, additive or subtractive | Given "home", then "alone" is in the top 20 labelled assonance; given "tree", then "freeze" is labelled additive |
| FR-03 | Rhyme a phrase on its last 2 or 3 stressed syllables | Given "falling apart", then at least 5 two-syllable matches such as "calling your heart" patterns appear |
| FR-04 | Show syllable count and stress pattern for any word | Given "beautiful", then 3 syllables, stress shown as DA-da-da |
| FR-05 | Filter results by syllable count (1, 2, 3, 4+), word type (noun, verb, adjective, adverb) and commonness (common only / all) | Given filter 2 syllables, then every result has 2 syllables |
| FR-06 | Estimate pronunciation for words not in the model and mark results "estimated" | Given "Malibuzz", then rhymes appear within 200 ms, tagged "estimated" |

### Grammar and spelling

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-09 | Underline spelling errors and these confusables with a suggested fix: their/there/they're, your/you're, its/it's, then/than, lose/loose, affect/effect, to/too; plus a/an by sound, doubled small words (the, a, an, to, of, in, at, for, and, is, was), lowercase "i" | Given "their going home", then "their" is underlined with fix "they're" |
| FR-10 | Lyric mode, on by default: do not flag fragments, missing end punctuation, dropped letters (runnin'), ain't, double negatives, lowercase line starts, common lyric spellings (gonna, wanna, gotta, 'cause, 'til, y'all, kinda, outta, gimme, lemme) or words repeated for effect (baby baby, no no no) | Given lyric mode on and "runnin' through the night", then nothing is flagged |
| FR-11 | Ignore a flag once, for the whole song, or add the word to a personal dictionary | Given "ignore in song", then that flag stays hidden in that song after reload |

### Lyric editor

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-20 | Write in sections tagged Intro, Verse, Pre-chorus, Chorus, Bridge, Outro or custom; add, rename, reorder, duplicate, delete | Given a chorus duplicated and moved, then both copies keep their text and order is saved |
| FR-21 | Show a live syllable count beside every line; lines with estimated words show the count in italics | Given a line is edited, then its count updates within 100 ms |
| FR-22 | Label each line ending by rhyme family (A, B, C…) with colour plus underline style; slant matches dotted, perfect solid | Given 4 lines ending night / day / light / way, then labels read A B A B |
| FR-23 | Tap or click any word to open its rhymes in a side panel (phone: bottom sheet); tap a result to replace the word | Given tap on "heart" then on "start", then the lyric reads "start" and undo restores "heart" |
| FR-32 | Autosave within 2 s of a change; auto-snapshot every 10 minutes of editing (keep last 20); unlimited named versions; restore any version | Given the app is closed mid-edit and reopened, then no more than 2 s of typing is lost |
| FR-33 | Export a song as .txt or PDF; export and import a full backup file (.json) of all songs and settings | Given a backup imported on another device, then all songs, versions and settings match |

### Mix Helper

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-40 | Searchable, offline FAQ with at least 25 entries | Given search "loudness spotify" offline, then the loudness entry is the first result |
| FR-41 | Loudness table per platform: integrated LUFS, true peak, note, source link and "last checked" date | Every row shows all five fields |
| FR-42 | EQ guide by frequency range and for 6 sources: vocals, kick, snare, bass, guitar, keys | Given "vocals", then ranges for body, mud, presence, sibilance and air are shown |
| FR-44 | Pre-mastering and delivery checklists, ticks saved per song | Given ticks on song A, then song B's checklist is unticked |

### Settings

| ID | Requirement | Acceptance test |
| --- | --- | --- |
| FR-50 | Theme (system, light, dark), text size (3 steps), lyric mode default, explicit-word filter for suggestions (off by default, so explicit words show) | Given dark theme chosen, then it persists after reload and offline |

## Non-functional requirements

| ID | Category | Requirement | How measured |
| --- | --- | --- | --- |
| NFR-01 | Speed | Rhyme results appear while typing | p95 under 100 ms on a 2021 mid-range Android phone, timed in the Web Worker |
| NFR-02 | Size | App code under 600 KB and word model under 2 MB, both gzipped; under 3 MB total first load | CI bundle budget fails the build |
| NFR-03 | Startup | First visit usable in under 3 s on 4G; repeat visit under 1 s | Lighthouse, throttled |
| NFR-04 | Offline | Every v1.0 feature works with no network after the first visit | Playwright airplane-mode test plus one real phone |
| NFR-05 | Privacy | No lyrics, searches or personal data leave the device; no trackers or analytics | Network log shows zero requests after load; strict content security policy |
| NFR-06 | Accessibility | WCAG 2.2 AA: keyboard use, screen reader labels, contrast, no meaning by colour alone | axe scan plus manual VoiceOver and TalkBack pass |
| NFR-07 | Compatibility | Last 2 versions of Chrome, Safari (iOS and macOS), Firefox, Edge; screens from 360 px wide | Manual test matrix each release |
| NFR-08 | Reliability | No lost work: autosave, crash recovery, storage-full warning | Kill-tab test during typing |
| NFR-09 | Language | English only in v1.0; any Unicode text can be typed and saved without breaking | Paste test with accents, emoji and Tagalog text |

## Test sets

Two hand-built test sets turn "good rhymes" and "good grammar checks" into pass/fail numbers. Build them during Phase 2; CI runs them on every merge from Phase 4. Pronunciations follow US English, because the CMU dictionary does.

### Rhyme set (300 items)

| Group | Items | Pass rule |
| --- | --- | --- |
| Perfect rhymes | 100 | Expected word in top 10 for 95% or more |
| Slant: assonance, consonance, family, additive/subtractive | 120 (30 each) | Expected word in top 50 of its type for 80% or more (changed in Sprint 1, see Phase 4) |
| Multi-syllable phrases | 40 | Each stressed word's match in its top 20 for 70% or more |
| Unknown and slang words | 40 | At least one usable rhyme in top 10 for 60% or more |

Plus a human check: you and 2–3 songwriter friends rate the top 10 slant results for 50 words as usable or not; target 70% usable.

```csv
input,expected,type,in_top
light,night,perfect,10
money,honey,perfect,10
home,alone,assonance,20
lost,mist,consonance,20
cup,cut,family,20
tree,freeze,additive,20
falling apart,calling your heart,multi,20
skrrt,hurt,unknown,10
```

### Grammar set (200 lines)

| Group | Lines | Pass rule |
| --- | --- | --- |
| Should be flagged: spelling 25, confusables 35, a/an 15, doubled words 10, lowercase i 15 | 100 | 90% or more flagged with the right fix |
| Lyric lines that must not be flagged in lyric mode | 100 | 5% or fewer flagged |

```csv
line,mode,expect
their going home tonight,lyric,flag their>they're
i wanna be an hero,lyric,flag an>a
we was was dancing,lyric,flag doubled was
runnin' through the night,lyric,no flag
ain't nobody love me like you,lyric,no flag
heart on fire. no sleep.,lyric,no flag
```

### Findings and fixes

All three findings from building the test sets are fixed with a small rule file each; the files live in the repo's word model build folder once it exists.

| Finding | Fix | File |
| --- | --- | --- |
| The dictionary and top-60k lexicon contain misspellings (alot, wich, thier, goverment…) | The build drops 52 known misspellings from the lexicon, so the spell checker flags them | misspelling\_blocklist.txt |
| Lyric mode would flag normal lyric spellings | 70 lyric spellings and vocables (gonna, 'cause, y'all, ooh, whoa…) are never flagged in lyric mode, plus a dropped-g rule: runnin' is accepted when running is a known word | lyric\_allowlist.txt |
| "baby baby" and "had had" are fine; "the the" is not | Only repeats of 35 small words (the, a, to, of, is, was…) are flagged; "had", "that" and "do" are excluded because their repeats are often correct | doubled\_word\_rule.json |

The grammar set gained two must-not-flag lines to guard the last fix: "I had had enough of the rain" and "I know that that was a lie".

Licence note: the blocklist comes mostly from the codespell misspelling list, which is CC BY-SA 3.0. It is used only at build time and never shipped in the app; keep its credit line in the file.

Dropped-g forms such as goin, talkin and nothin are already in the dictionary and must not be added to the blocklist; they give rhymes for lyric spellings.

## Traceability

| Requirements | Design element (Phase 3) | Tests |
| --- | --- | --- |
| FR-01 to FR-05 | Rhyme engine + word model files, in the Web Worker | Rhyme set; unit tests TC-01 to TC-05 |
| FR-06 | Letter-to-sound rules | Rhyme set, unknown group; TC-06 |
| FR-09 to FR-11 | Grammar engine + rules file; personal dictionary in IndexedDB | Grammar set; TC-09 to TC-11 |
| FR-20 to FR-23 | Editor module, rhyme side panel | End-to-end TC-20 to TC-23 |
| FR-32, FR-33 | Storage service (IndexedDB), export service | TC-32 kill-tab test; TC-33 backup round trip |
| FR-40 to FR-42, FR-44 | Mix Helper module + content files | TC-40 to TC-44; audio advisor review |
| FR-50 | Settings service, design tokens | TC-50 |
| NFR-01 to NFR-09 | Whole app | CI budgets, Lighthouse, axe, offline and device tests |

## Open questions

- [x] Explicit words: shown by default; users can hide them in Settings. Slurs are always removed.
- [x] Pronunciation: US English only for v1.0.
- [x] Tagalog and Taglish rhyming: wanted for v1.1 or later. Phase 3 must design the word model as one file set per language so a Tagalog set can be added without rework.
- [x] FAQ entries: you write the 25+ entries; the audio advisor reviews them in April.

## Sign-off checklist (by 2026-11-29)

- [x] Users and user stories written
- [x] 20 functional requirements with acceptance tests
- [x] 9 non-functional requirements with measurable targets
- [x] Test set makeup and pass rules defined
- [x] Traceability drafted
- [x] Open questions answered
- [x] Rhyme set built and checked: 300 items, all expected words in the model, no flagged words, no duplicates
- [x] Grammar set built and checked: 200 lines; every must-not-flag line passes the lexicon and lyric allowlist, every misspelling is outside the lexicon
- [x] Baseline approved (on your instruction, 2026-10-30)

# Phase 3: Design

Oct 30, 2026 · @Toni Ross Inot

Phase 3 runs 2026-11-30 to Dec 13, 2026 (2 weeks, about 20 hours) and turns the Phase 2 baseline into specs you can code from, starting with the word model because everything depends on it.

## Design decisions

ADR-01 to ADR-04 from the main tab stand; ADR-05 to ADR-09 come from what Phase 2 settled. All nine approved by you on 2026-10-30.

| ID | Decision | Why | Status |
| --- | --- | --- | --- |
| ADR-01 | Angular PWA, not Flutter | Light, one codebase, offline, free hosting | Approved |
| ADR-02 | Own phoneme lexicon, not an ML model | Small, fast, explainable rhymes | Approved |
| ADR-03 | Rule-based grammar, not LanguageTool | Runs offline in the browser | Approved |
| ADR-04 | Engines in a Web Worker | Typing never lags | Approved |
| ADR-05 | One model folder per language with a manifest declaring its sound set | Tagalog can be added later without engine changes | Approved |
| ADR-06 | Build the rhyme index in the worker at load time instead of downloading it | Saves about 200 KB; prebuilt file is the fallback if it takes over 150 ms | Approved |
| ADR-07 | Store each song as one record, with versions in a separate store | Autosave is one atomic write; versions never slow the editor | Approved |
| ADR-08 | Treat some vowels as equal for slant matching (AA = AO; IH = IY and UH = UW before R) | The dictionary is inconsistent there, and most US speakers merge them | Approved |
| ADR-09 | Explicit words flagged at build time and shown by default; slurs removed at build time | Matches the Phase 2 decision | Approved |

## Word model spec

**The core model measures about 400 KB gzipped for 58,741 words**, a fifth of the 2 MB budget. Sizes below come from a test encode of the CMU dictionary against the top wordfreq words on 2026-10-30.

### Files (one folder per language)

| File | Contents | Encoding | Size, gzipped |
| --- | --- | --- | --- |
| manifest.json | Language code, model version, sound set, file list with sizes and SHA-256 hashes | JSON | <1 KB |
| lexicon.bin | All words, sorted; word ID = position | Front-coded in blocks of 16: shared-prefix length (1 byte), suffix length (1 byte), suffix bytes; block offset table for binary search | 129 KB (measured) |
| phones.bin | Sounds for each word | 1 length byte per word, then 1 byte per sound: low 6 bits = sound ID (39 sounds), high 2 bits = stress (0 none, 1 primary, 2 secondary) | 192 KB (measured) |
| meta.bin | Word type and flags | 1 byte per word: noun, verb, adjective, adverb, explicit, proper noun, 2 spare bits | \~30 KB (est.) |
| commonness.bin | Commonness rank, from wordfreq | 1 byte per word (0–255); separate file under CC BY-SA 4.0 | \~40 KB (est.) |
| g2p-rules.json | Letter-to-sound rules for unknown words | Ordered rules: letters, left context, right context, sounds; plus stress rules | \~40 KB (est.) |

Folder layout: `assets/model/en-us/`. A future `assets/model/tl/` brings its own sound set in its manifest; the engine reads sound features from the manifest, never hard-codes English.

### Build script (tools/build-word-model, Node)

1. Read the CMU dictionary; keep the first pronunciation of each word.
2. Keep words in the top 60k of wordfreq that are letters and apostrophes only.
3. Drop words in misspelling\_blocklist.txt and the slur list; flag words in the explicit list.
4. Tag word types and proper nouns (source to choose: see open items).
5. Sort, assign IDs, encode the files, write the manifest with hashes.
6. Fail the build if the model folder exceeds 2 MB gzipped or the rhyme test set drops below its pass rules.

The build must be reproducible: same inputs give byte-identical files, so the service worker only re-downloads a model when it truly changes.

### Loading

The service worker caches the model folder on first visit. The Web Worker fetches the files, decodes them, and builds two lookup maps in memory: by stressed vowel and by ending sounds (ADR-06). Targets: ready within 300 ms on a mid-range phone, under 30 MB memory. The editor works immediately; rhyme results show a short "warming up" state until the worker is ready.

## Rhyme engine

The engine splits each word at its last stressed vowel: the **onset** (sound before it), the **vowel**, and the **tail** (everything after). The same split already drives the 300-item test set, so the test set and engine agree by construction.

### Finding candidates

| Result type | Rule | Lookup map |
| --- | --- | --- |
| Perfect | Same vowel and tail, different onset | By vowel + tail |
| Assonance | Same vowel, tails of equal length ending in different sound types | By vowel |
| Family | Same vowel, one-sound tails of the same type and voicing (cup / cut) | By vowel |
| Additive / subtractive | Same vowel, one tail is the other plus one sound (tree / freeze) | By vowel |
| Consonance | Same tail, different vowel | By tail |
| Multi-syllable | Each stressed word of the phrase matches by the perfect rule, unstressed vowels treated as equal | Per word, then combined |

### Slant score (0–100)

Starting weights, tuned with beta testers:

```text
score = 100
      − 40 × vowelDistance      (0 to 1, from height, front/back, rounding)
      − 35 × tailDistance       (0 to 1, from place, manner, voicing of each sound)
      − 10 × extraSounds        (count of added or missing sounds)
      −  5 × syllableDifference
rank  = score + 10 × commonness / 255
```

Perfect rhymes score 100 and are listed first. The panel shows the top 50 per type, and each result carries a short reason ("same vowel, ending t → k"). Vowels in ADR-08 count as equal before scoring.

### Unknown words

If a word is not in the lexicon, the engine strips a dropped-g ending (runnin' → running) and retries, then falls back to the letter-to-sound rules. Rules are scored at build time against 2,000 dictionary words held out from rule writing; target: at least 70% produce the correct vowel and tail.

## Grammar engine

Runs in the same Web Worker, on the changed line only, 300 ms after typing pauses.

1. **Split** the line into words, keeping apostrophes (y'all, runnin').
2. **Skip** words that are capitalised mid-line (names), in the personal dictionary, or, in lyric mode, in lyric\_allowlist.txt or matching the dropped-g rule.
3. **Spelling:** words not in the lexicon get up to 3 fixes by edit distance, ranked by commonness.
4. **Rules:** confusables, a/an by first sound (from phones.bin), doubled words per doubled\_word\_rule.json, lowercase "i".
5. **Filter** out anything ignored for this song (FR-11).
6. **Return** flags: position, rule ID, message, fixes.

Rules live in `assets/rules/en-us/rules.json`, so adding a confusable pair is a data change, not a code change. Confusables use simple word-pattern checks (for example "their" followed by a verb ending in -ing suggests "they're"); the grammar test set decides which patterns stay.

## Data model

One IndexedDB database, `slantsmith`, schema version 1. Every change to the schema adds a migration and keeps old backups importable.

| Store | Key | Holds |
| --- | --- | --- |
| songs | id | Title, created and updated times, lyric-mode setting, sections (type, label, lines), ignored flags |
| versions | id; index on songId | Song ID, kind (auto or named), name, time, full song snapshot |
| checklists | songId + listId | Ticked item IDs for Mix Helper checklists |
| dictionary | word | Personal dictionary words and the date added |
| settings | key | Theme, text size, lyric-mode default, hide explicit words |
| meta | key | Schema version, model version |

```ts
interface Song {
  id: string;            // random UUID
  title: string;
  createdAt: number;     // ms since epoch
  updatedAt: number;
  lyricMode: boolean;
  sections: { id: string; type: 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'outro' | 'custom'; label: string; lines: string[] }[];
  ignored: { rule: string; text: string }[];
}
```

**Autosave:** the whole song record is written 2 s after the last keystroke (one atomic write). **Snapshots:** a version is added every 10 minutes of editing; only the newest 20 auto snapshots are kept, named versions are never deleted. **Backup file:** `{ app: 'slantsmith', format: 1, exportedAt, songs, versions, checklists, dictionary, settings }` as .json. **Storage full:** warn at 80% of the browser's quota and offer a backup export.

## Screens and flows

Phone-first screens, "studio at night" look: [Slantsmith phone screens](https://claude.ai/artifact/UfzHYZBQLamEBp5oVxNfG2), nine 390 px artboards.

- **Signature move, the lamp:** the section being written sits in a warm pool of light; other sections dim back. The rhyme sheet and the selected take sit under the same light.
- **Dark by default:** mahogany ground, chiffon lyrics, fawn labels, warm dim text (#B8936F, 5.8:1) for unlit sections. Ruby is kept for the record light: the tapped word, the saved dot, primary buttons.
- **Versions are called takes** in the interface, like a tape box sheet.
- **Rhyme families** use a letter badge plus underline style (dotted = slant, solid = perfect), never colour alone.
- Second row: songs list, first-visit empty state, editor in paper light (mahogany on chiffon, ruby labels, dim text #6A4B3A at 6.7:1), and the backup import error. Screens link to each other in play mode.

## Privacy and security

- **Nothing leaves the device:** no accounts, analytics, ads or third-party scripts; after load the app makes no network requests except service worker update checks for its own files.
- **Content security policy:** scripts and fonts from the app's own origin only; `connect-src 'self'`; no inline scripts.
- **Imports are data:** backup files are validated against the format before any write; bad files are rejected whole, never half-imported.
- **Lyrics are shown as text, never HTML**, so pasted content cannot run code.
- **Feedback is opt-in:** the "report this suggestion" link sends only the searched word.

## Open items

- [x] Word types: Open English WordNet (CC BY 4.0, credit Princeton WordNet and the Open English WordNet team) for nouns, verbs, adjectives and adverbs, with inflected forms mapped to their base word; a small hand list covers pronouns, prepositions and other small words WordNet leaves out. Words in neither are tagged "other" (names, slang); no separate proper-noun list in v1.0.
- [x] Explicit and slur lists: drafted from the LDNOOBW English list (CC BY 4.0, confirmed). explicit\_words.txt flags 43 vulgar words (shown by default); slur\_blocklist.txt removes 9 words at build time. Clinical, everyday and serious-topic words are deliberately not flagged. Both files need your review (two slur entries have harmless second meanings).

## Design traceability

Every v1.0 requirement now has a design element and a screen.

| Requirements | Engine or module | Screen |
| --- | --- | --- |
| FR-01 to FR-05 | Rhyme engine, word model files | Rhyme sheet; quick-rhyme bar in the editor |
| FR-06 | Letter-to-sound rules, dropped-g retry | Rhyme sheet ("estimated" tag) |
| FR-09 to FR-11 | Grammar engine, rules.json, lyric allowlist, doubled-word rule | Lyric editor (copper wavy underline) |
| FR-20, FR-21, FR-22 | Editor module | Lyric editor (sections, syllable column, rhyme letters) |
| FR-23 | Editor module + rhyme engine | Lyric editor tapped word, rhyme sheet |
| FR-32 | Storage service, versions store | Takes |
| FR-33 | Export and import service | Settings; backup import error |
| FR-40 to FR-42, FR-44 | Mix Helper content files | Mix help |
| FR-50 | Settings service, design tokens | Settings; paper light editor |
| NFR-06 Accessibility | DESIGN.md rules: 44 px targets, contrast table, letter + line style for rhyme families | All screens |

Visual rules for building these screens are in DESIGN.md (tokens, lamp card, ruby as record light only).

## Design review checklist (by 2026-12-13)

- [x] Word model files, formats and build steps specified
- [x] Rhyme engine rules and starting weights specified
- [x] Grammar pipeline specified
- [x] Data model, autosave, versions and backup format specified
- [x] Privacy and security design written
- [x] Open items resolved (word-type source, explicit and slur lists)
- [x] Wireframes for editor, rhyme panel, Mix Helper, Settings
- [x] Every requirement maps to a design element (update traceability)
- [x] ADR-01 to ADR-09 approved by you

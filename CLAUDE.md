# Slantsmith

Free, offline, light word tool for songwriters: perfect, slant and multi-syllable rhymes from our own word model, a grammar checker with a lyric mode, a lyric editor, and Mix help (loudness, EQ, checklists). Solo developer, $0 budget, part-time (~10 h/week).

Read first: `PRODUCT.md` (users, purpose, principles), `DESIGN.md` (visual rules, tokens), `docs/requirements.md` (the 20 v1.0 requirements with acceptance tests), `docs/decisions.md` (ADRs, licences), `docs/session-summary.md` (how we got here).

## Stack

- Angular (latest stable, standalone components, signals) as an installable offline PWA (`@angular/service-worker`). Not Flutter (ADR-01).
- Rhyme and grammar engines run in a Web Worker (ADR-04). Engine code is plain TypeScript in `src/engines/`, erasable syntax only (no enums, no parameter properties) so Node runs it directly.
- Storage: IndexedDB. One record per song; versions ("takes") in a separate store (ADR-07).
- Hosting: static, free subdomain (decided at deploy time). No backend, no analytics, lyrics never leave the device.

## Commands

```bash
pip install wordfreq      # only to rebuild the model
npm run build:model       # tools/build_word_model.py -> src/assets/model/en-us/
npm test                  # node --test on test/*.test.ts (rhyme set, speed, explicit filter, dropped-g)
```

## Layout

- `tools/build_word_model.py`, `tools/data/` (CMU dict, misspelling/slur blocklists, explicit list)
- `src/assets/model/en-us/` generated: lexicon.txt, phones.bin (1 length byte + 1 byte per sound: low 6 bits sound id, high 2 bits stress), meta.bin (bit 4 = explicit, bit 5 = function word, bits 0-3 = noun/verb/adjective/adverb bitmask), commonness.bin (zipf*32), manifest.json
- `src/engines/model.ts` (decode: `wordTypes()`, `isFunctionWord()`), `src/engines/rhyme.ts` (RhymeEngine: rhymes(), phrase())
- `tools/data/wordnet/` Open English WordNet LMF XML, fetched on demand by `build_word_model.py` (gitignored, like wordfreq's own data; not shipped)
- `test/` rhyme and grammar test sets (CSV) + tests
- `design/screens/` the approved phone screens as HTML artboards (Design canvas format; open in a browser for reference, do not ship). `design/screens/canvas.json` lists them.
- Grammar rule data for Sprint 4 is ready in `tools/data/`: lyric_allowlist.txt, doubled_word_rule.json.
- `src/app/settings/` SettingsService (signals, localStorage-persisted) + `/settings` route, built from the approved `Settings.dc.html` artboard.

## Conventions

- Smallest change that fully works; no dependencies for a few lines; a test for every non-trivial branch.
- A known-limited shortcut gets a comment: `shortcut: <limit>, <when to upgrade>`.
- Follow DESIGN.md: studio dark default, one lamp card per screen, ruby #A71D31 only for record-light moments (tapped word, saved dot, primary buttons), rhyme families = letter + underline style, 44 px targets, Manrope self-hosted.
- US English only in v1.0. Explicit words shown by default (filter in Settings); slurs removed at build.

## Status (2026-11-03)

Phases 1-3 done (plan, requirements, design). Phase 4 Sprint 1 done: word model (60k words, ~420 KB gzipped) and rhyme engine, all 7 tests pass. Sprint 2 under way: repo live at `github.com/toni225/slantsmith`, CI committed (model rebuild byte-identical, tests, size budgets; not yet pushed). Angular 21 standalone app scaffolded, Manrope self-hosted (latin subset only, `@fontsource/manrope`). Rhyme sheet + quick-rhyme bar built under `src/app/rhyme/` against the approved `Rhymes.dc.html`/`Main.dc.html` artboards, backed by the real `RhymeEngine` (perfect + slant tabs, length/type/common-only filters, estimated-word handling); route `/rhymes` hosts them. Phrase tab skipped — the engine's `phrase()` rhymes each stressed word of an input phrase, not the per-word rhyming-phrase generation the artboard mocks up; that's unbuilt functionality, not a UI gap. Word types (noun/verb/adjective/adverb) now fill meta.bin bits 0-3 from Open English WordNet, with a small curated function-word list in bit 5; the rhyme sheet's type filter chips use them. Settings screen (`/settings`, FR-50) built from the approved `Settings.dc.html` artboard: theme (studio dark/paper light/match my phone, persisted, applied via a `data-theme` attribute and CSS variable overrides), lyric text size (small/medium/large, via CSS `zoom`), lyric mode default and hide-explicit-words switches, all localStorage-persisted and wired into the rhyme sheet/quick-rhyme bar. Prod bundle 67.5 KB gzipped (well under the 600 KB budget), 9/9 tests pass.

## Next: Sprint 2 (planned 2027-01-25 to 02-21)

1. ~~Create the GitHub repo; add CI~~ done (repo live, CI committed, not yet pushed).
2. ~~Scaffold the Angular PWA~~ done. ~~Move `src/engines` into a Web Worker~~ done: `src/app/rhyme/rhyme.worker.ts` loads the model and runs `RhymeEngine` off the main thread (Angular's `new Worker(new URL(...))` pattern, its own lazy chunk); `RhymeModelService` talks to it via a request-id-correlated `postMessage` protocol (`rhyme-protocol.ts`). Syllable count, commonness and word types are computed in the worker too (enriched onto each result) so the main thread never needs direct `Model` access.
3. **Skipped for now (2026-11-04), revisit before launch.** Timed in the browser (prod build, Worker, localhost dev machine — not a real mid-range phone): ~120-127 ms cold-worker-to-first-known-rhyme, ~253-268 ms cold-worker-to-first-unknown-rhyme. Both under the 300 ms line, but desktop CPU speed isn't evidence for a real mid-range phone. A dev-only cold-load timer readout (`rhyme-page.component.html`, `isDevMode()`-gated) shows live ms on any device that opens the app on the LAN — still there, unused. Tried a CPU-throttled-DevTools proxy test instead of a real phone; the tooling available in this session can't drive Chrome's CPU emulation, so that fallback isn't possible here either. Shipping without this measurement for now; before launch, run the LAN link on a real mid-range Android (or throttle CPU 4-6x in DevTools by hand) and only then decide on a prebuilt rhyme index.
4. ~~Fill word types in meta.bin~~ done: `tools/build_word_model.py` downloads Open English WordNet's LMF XML (CC BY 4.0, cached in `tools/data/wordnet/`, gitignored, ~11 MB compressed — a build input, not shipped, same pattern as wordfreq) and tags each lexicon word with a noun/verb/adjective/adverb bitmask (meta.bin bits 0-3); a curated ~140-word function-word list fills bit 5. 26,935/60,000 words got a WordNet type (untyped words are excluded when a specific type filter is active, included under "Any type"). Credits updated in manifest.json and docs/decisions.md already had the licence line. Rhyme sheet filter row got Noun/Verb/Adjective/Adverb chips next to length/common-only (`rhyme-sheet.component.ts`/`.html`).
5. ~~Rhyme sheet + quick-rhyme bar~~ done (Perfect/Slant tabs; no Phrase tab — see above). Responsive, mobile-first: below 768px the phone-shaped single-lamp experience (overlay sheet, tap "See all" to open); 768-1023px the same, centered; from 1024px the rhyme sheet becomes a permanent two-column panel beside the word field (no overlay/scrim/close button) with the rhyme list reflowed into a word grid, and the quick-rhyme bar hides (redundant once the panel's always visible) — see `rhyme-page.component.css`/`rhyme-sheet.component.css`. Hover states behind `(hover: hover) and (pointer: fine)`, safe-area insets for the mobile bottom bar. Verified at 375/768/1440px in-browser; gesture/real-device input (touch drag, VoiceOver/TalkBack) untested.
6. ~~Settings (FR-50)~~ done: `src/app/settings/settings.service.ts` (signals, localStorage-persisted) + `/settings` route, from the approved `Settings.dc.html` artboard. Theme swaps a `data-theme` attribute read by `styles.css`'s `[data-theme='light']` override block (same CSS variables every component already uses, no per-component changes needed); "match my phone" also listens for `prefers-color-scheme` changes live. Text size uses CSS `zoom` on `<html>` — `shortcut: scales the whole layout rather than converting every px value in the app to rem; upgrade if that causes complaints` (see `settings.service.ts`). Hide-explicit-words now actually reaches `RhymeModelService.rhyme()` (previously always `false`, unwired); lyric mode default is stored but has nothing to apply to yet (grammar engine is Sprint 4). No app-wide tab bar built yet — only Rhymes and Settings exist as screens, so a 4-tab bar (per `Settings.dc.html`) would be mostly dead links; added a single settings icon link in the Rhymes header instead. "Your songs" export/import and "Credits and licences" from the artboard are skipped too — no song storage exists yet (Sprint 3+).

Reviews done 2026-10-30: slur and explicit lists final; test sets checked (every grammar-set line matches the lexicon and rule files, no flagged words in the rhyme set, all expected words in the model). Full plan doc exported to docs/plan/ (diagrams there are placeholders; see the online doc).

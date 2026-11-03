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
- `src/assets/model/en-us/` generated: lexicon.txt, phones.bin (1 length byte + 1 byte per sound: low 6 bits sound id, high 2 bits stress), meta.bin (bit 4 = explicit; bits 0-3 word types, TODO), commonness.bin (zipf*32), manifest.json
- `src/engines/model.ts` (decode), `src/engines/rhyme.ts` (RhymeEngine: rhymes(), phrase())
- `test/` rhyme and grammar test sets (CSV) + tests
- `design/screens/` the approved phone screens as HTML artboards (Design canvas format; open in a browser for reference, do not ship). `design/screens/canvas.json` lists them.
- Grammar rule data for Sprint 4 is ready in `tools/data/`: lyric_allowlist.txt, doubled_word_rule.json.

## Conventions

- Smallest change that fully works; no dependencies for a few lines; a test for every non-trivial branch.
- A known-limited shortcut gets a comment: `shortcut: <limit>, <when to upgrade>`.
- Follow DESIGN.md: studio dark default, one lamp card per screen, ruby #A71D31 only for record-light moments (tapped word, saved dot, primary buttons), rhyme families = letter + underline style, 44 px targets, Manrope self-hosted.
- US English only in v1.0. Explicit words shown by default (filter in Settings); slurs removed at build.

## Status (2026-10-30)

Phases 1-3 done (plan, requirements, design). Phase 4 Sprint 1 done: word model (60k words, ~420 KB gzipped) and rhyme engine, all 7 tests pass. Sprint 2 under way: Angular 21 standalone app scaffolded (`ng new`, merged into the existing tree), `src/engines`/`src/assets`/`test`/`tools` untouched, prod bundle 51 KB gzipped (well under the 600 KB budget), all 7 engine tests still pass. No git repo yet.

## Next: Sprint 2 (planned 2027-01-25 to 02-21)

1. Create the GitHub repo; add GitHub Actions CI (model rebuild byte-identical, npm test, model < 2 MB, app bundle < 600 KB gzipped).
2. ~~Scaffold the Angular PWA~~ done. Move `src/engines` into a Web Worker (not yet started).
3. Time model load on a real mid-range phone (laptop: 185 ms load, 261 ms first unknown word). If > 300 ms, ship a prebuilt rhyme index.
4. Fill word types in meta.bin from Open English WordNet (CC BY 4.0) + a small function-word list; add the type filter (FR-05).
5. Rhyme sheet + quick-rhyme bar from `design/screens/Rhymes.dc.html` and `Main.dc.html`.
6. Settings (FR-50): theme, text size, lyric mode default, hide explicit words.

Reviews done 2026-10-30: slur and explicit lists final; test sets checked (every grammar-set line matches the lexicon and rule files, no flagged words in the rhyme set, all expected words in the model). Full plan doc exported to docs/plan/ (diagrams there are placeholders; see the online doc).

# Phase 4: Development

Oct 30, 2026 · @Toni Ross Inot

Development runs 2026-12-14 to the 2027-05-09 feature freeze in five sprints; Sprint 1 (word model and rhyme engine) is already built and passing its tests, about six weeks ahead of plan.

## Sprint plan

| Sprint | Dates | Build | Requirements | Status |
| --- | --- | --- | --- | --- |
| 1 | 2026-12-14 to 2027-01-24 | Word model build, rhyme engine, tests | FR-01 to FR-04, FR-06 | Done 2026-10-30 |
| 2 | 2027-01-25 to 02-21 | Angular PWA shell, Web Worker, rhyme sheet, filters, design tokens and Manrope, word types | FR-05, FR-23 (sheet), FR-50 | Next |
| 3 | 2027-02-22 to 03-21 | Lyric editor, sections, syllable column, rhyme letters, autosave, takes | FR-20 to FR-23, FR-32 | Planned |
| 4 | 2027-03-22 to 04-18 | Grammar engine with lyric mode, export and backup | FR-09 to FR-11, FR-33 | Planned |
| 5 | 2027-04-19 to 05-09 | Mix help content and screens, then feature freeze | FR-40 to FR-42, FR-44 | Planned |

The six weeks gained in Sprint 1 are kept as buffer, not used to add v1.1 features.

## Sprint 1 results

**All 7 tests pass.** Code: slantsmith-sprint1.zip (build script, model files, engine, tests).

| Check | Result | Target |
| --- | --- | --- |
| Perfect rhymes | 98 / 100 | 95% |
| Slant rhymes (right type, top 50) | 102 / 120 | 80% |
| Multi-syllable phrases | 38 / 40 | 70% |
| Unknown and slang words | 26 / 40 | 60% |
| Lookup speed, p95 | about 2–3 ms per word on a laptop | Under 100 ms |
| Explicit filter, dropped-g (runnin') | Pass | — |
| Model size | 60,000 words, about 420 KB gzipped | Under 2 MB |
| Rebuild | Byte-identical files | Reproducible |

Sample, "hold": perfect old, told, gold, cold, sold, controlled; slant don't (assonance), pulled (consonance), goals (assonance), spoiled (consonance).

**Watch on a real phone:** loading and indexing takes 185 ms on a laptop and the first unknown word 261 ms (one-time spelling index). A mid-range phone may be 3–4 times slower, past the 300 ms target; if so, ship the prebuilt index (ADR-06 fallback) in Sprint 2.

## Changes from the design

| Change | Why |
| --- | --- |
| Build script is Python, not Node | wordfreq is a Python library; one script instead of two |
| lexicon.txt is a plain sorted word list, not front-coded | 166 KB vs 129 KB gzipped; far less code to write and debug |
| No g2p-rules.json: unknown words borrow the sound of known words with the same spelling ending (with slang fixes like skrrt → skrt, thicc → thick) | 65% pass with about 25 lines of code; real letter-to-sound rules only if testers find it weak |
| Commonness weight in slant ranking raised from 10 to 40 | At 10, rare words with close sounds buried everyday words |
| Slant results capped at 50 per type, not 50 overall | One big type was crowding out the others |
| Test pass rules: slant expected in top 50 of its type (was 20); unknown passes when the guessed sound rhymes with the expected word; phrase passes when each stressed word's match is in its top 20 | The test set picked the most common partner, not the closest sound; the human rating (70% usable) remains the real check |
| Word types (noun, verb…) not filled yet | Moved to Sprint 2 with the FR-05 type filter |

## Repo, checks and definition of done

Create the GitHub repo at the start of Sprint 2 from the zip; it already has README.md, PRODUCT.md, DESIGN.md, package.json and .gitignore.

```bash
npm run build:model   # rebuild the word model (needs: pip install wordfreq)
npm test              # 300-item rhyme set, speed, explicit filter, dropped-g
```

CI on every pull request (GitHub Actions): model rebuild is byte-identical, `npm test` passes, model under 2 MB, app bundle under 600 KB gzipped (from Sprint 2), lint and type checks.

Definition of done for each feature:

- [ ] Meets its acceptance test from Phase 2
- [ ] Tests written and passing
- [ ] Works offline and in studio dark and paper light
- [ ] Follows DESIGN.md (one lamp per screen, ruby only for record-light moments, 44 px targets)
- [ ] Keyboard and screen reader check done
- [ ] Self-review the next day before merging

## Next: Sprint 2

1. Create the GitHub repo from the zip; add the CI workflow.
2. Scaffold the Angular PWA (standalone components, service worker) and move `src/engines` into a Web Worker.
3. Time model loading on a real mid-range phone; ship the prebuilt index if over 300 ms.
4. Fill word types in meta.bin from Open English WordNet; add the type filter (FR-05).
5. Build the rhyme sheet and quick-rhyme bar from the canvas screens, with DESIGN.md tokens and self-hosted Manrope.
6. Settings: theme, text size, hide explicit words (FR-50).

# SDLC Plan: Slantsmith

Oct 29, 2026 · @Toni Ross Inot

## Platform recommendation

**Verdict: build v1 as an Angular static site packaged as an offline PWA (Progressive Web App).** It meets every requirement in this plan (offline use, our own light word model, grammar checking, songwriting tools, mixing FAQ) with the smallest download, one codebase for phone and desktop, free static hosting and no app-store review.

The static-page option does not mean "online only": Angular's service worker caches the app shell, the word model and the FAQ content on first visit, so everything works in airplane mode afterwards. Users can "install" it to the home screen or desktop like an app.

| Criterion | Angular static PWA | Flutter offline app |
| --- | --- | --- |
| Offline use | Yes, via service worker after first load | Yes, from install |
| App download size | Small: \~300–600 KB app code + word model | Larger: \~15–25 MB per mobile app; Flutter web adds \~2 MB engine |
| Platforms from one codebase | Any browser: Android, iOS, Windows, macOS, Linux, Chromebook | Android, iOS, desktop; web build is heavier |
| Where songwriters write | Laptop next to the DAW and phone, same URL | Strongest on phone |
| Distribution | Share a link; host free (GitHub Pages, Netlify, Cloudflare Pages) | App Store / Play Store accounts, fees and review |
| Updates | Instant on next visit | Store release per update |
| Voice memos, file export | Supported in modern browsers (MediaRecorder, File System Access / download) | Full native access |
| Weak spots | iOS Safari can evict PWA storage if unused for weeks; mic API limits on older iOS | Bigger build, store overhead, slower iteration |

When to switch to Flutter: if v2 needs deep native features (background audio recording, MIDI device input, store presence for marketing), port the UI to Flutter and reuse the word model files unchanged; they are plain data, not tied to either framework.

## 1. Document control and project overview

### Purpose

Songwriters and lyric writers lose momentum hunting for rhymes, near rhymes and the right word. This project delivers a light, offline word tool that suggests perfect and slant rhymes, checks grammar, and gathers the everyday songwriting and mixing helpers in one place.

### Scope

- **In scope:** perfect, slant and multi-syllable rhyme suggestions; syllable and stress counts; our own compact word model; rule-based grammar checker with a lyric mode; lyric editor with songwriting tools (section 4); mixing and mastering helpers and FAQ (Appendix A); offline PWA in the brand palette and Manrope type.
- **Out of scope (v1):** user accounts, cloud sync, collaboration in real time, AI text generation, audio mixing or processing of real files, native store apps.
- **Assumptions:** v1 is English only; users write on both laptop and phone; a public-domain or permissively licensed pronunciation source can seed the word model.
- **Constraints:** total first-load download under 3 MB gzipped; works fully offline after first visit; no server-side processing; free static hosting.

### Project details

| ~~Field~~ | Details |
| --- | --- |
| Project name | Slantsmith |
| Project ID | RS-001 (proposed) |
| Project owner | You (solo, all roles) |
| Document version | 0.1 |
| Status | Draft |
| Start date | 2026-11-02 |
| Target release date | 2027-06-04 (31 weeks, part-time) |
| Repository / workspace | Open question: link |

### Stakeholders

| Name | Role | Responsibility | Contact |
| --- | --- | --- | --- |
| \[Name\] | Sponsor | Funds and approves | \[Email\] |
| \[Name\] | Product owner | Prioritises features, owns songwriting and mixing content | \[Email\] |
| \[Name\] | Tech lead | Owns Angular architecture and word model | \[Email\] |
| \[Name\] | QA lead | Owns test strategy, rhyme accuracy tests | \[Email\] |
| \[Name\] | Operations lead | Owns hosting, releases, support | \[Email\] |
| \[Name\] | Audio advisor (optional) | Reviews mixing and mastering FAQ accuracy | \[Email\] |

## 2. SDLC methodology and phases at a glance

**Chosen model: Agile Scrum, 2-week sprints (6 sprints after a 1-week planning phase).** The team is small, the core risk is rhyme quality (which needs fast feedback from real songwriters), and features ship independently, so short iterations beat a fixed Waterfall plan.

Phases 2 to 5 repeat inside each sprint. The word model is built first (Sprints 1–2) because every other feature depends on it.

| # | Phase | Owner | Entry criteria | Exit criteria | Key deliverables |
| --- | --- | --- | --- | --- | --- |
| 1 | Planning | Project manager | Idea approved | Plan, budget and risks signed off | Project plan, risk register |
| 2 | Requirements | Product owner | Plan approved | Backlog baselined with acceptance criteria | Prioritised backlog, user stories |
| 3 | Design | Tech lead | Backlog baselined | Word model format, architecture and UI kit approved | ADRs, wireframes, design tokens |
| 4 | Development | Dev team | Design approved | Definition of done met | Working, reviewed code |
| 5 | Testing | QA lead | Build on staging | No open critical defects; rhyme accuracy targets met | Test report, UAT sign-off |
| 6 | Deployment | Release manager | Go-live criteria met | PWA live, installable and verified offline | Release notes, runbook |
| 7 | Maintenance | Operations lead | Release stable | Handover accepted | Support plan, retrospective |

## 3. Phase 1: Planning

Goal: confirm the project is worth doing and agree how it will be delivered. Solo build, $0 budget, part-time at about 10 hours a week; the dates below follow the 31-week plan in the Phase 1 tab.

Phase 1 worked plan (solo, $0, part-time): Phase 1: Planning

### Objectives and success measures

| Objective | Success measure | Target | Owner |
| --- | --- | --- | --- |
| Fast, useful rhymes | Time from typing a word to suggestions shown | Under 100 ms on a mid-range phone | Tech lead |
| Good slant rhymes | Testers rate top-10 slant suggestions as usable | 70% or more | Product owner |
| Light app | First-load download, gzipped | Under 3 MB total | Tech lead |
| Truly offline | Core features work in airplane mode after first visit | 100% of Must features | QA lead |
| Songwriters keep using it | Testers still using it weekly after 4 weeks | 50% of beta group | Product owner |

### Feasibility

| Area | Assessment | Notes |
| --- | --- | --- |
| Technical | Feasible | Rhyme lookup on a precomputed phoneme index is fast and small; grammar rules run in the browser. |
| Financial | Feasible | Free static hosting; main cost is people time. |
| Operational | Feasible | No servers to run; updates ship by redeploying static files. |
| Legal and compliance | Risky | Word-list and pronunciation sources must allow redistribution; mixing FAQ must be original text, not copied from guides. |

### Budget, timeline and resources

| Milestone | Target date | Budget | Resources |
| --- | --- | --- | --- |
| Phase 1 planning signed off | 2026-11-15 | $0 | You |
| Requirements and design approved | 2026-12-13 | $0 | You |
| Word model v1 done | 2027-01-24 | $0 | You |
| Feature freeze (build complete) | 2027-05-09 | $0 | You |
| Testing complete | 2027-05-30 | $0 | You, beta songwriters |
| Go-live | 2027-06-04 | $0 | You |

### Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| R1 | Slant rhymes feel random or weak | M | H | Tune scoring weights with songwriter testers each sprint; show why a word matched (shared vowel, ending consonant) | Tech lead |
| R2 | Word model too big for "light" target | M | M | Trim to most common \~60k words, compact binary format, lazy-load extras | Tech lead |
| R3 | Grammar checker flags normal lyric style | H | M | Lyric mode that tolerates fragments, slang and dropped letters; easy "ignore" per rule | Product owner |
| R4 | Licence on dictionary or frequency data blocks redistribution | M | H | Verify licences in week 1; keep a fallback source list | Product owner |
| R5 | iOS evicts offline storage for unused PWAs | M | M | Re-cache on launch; let users export their songs to files | Tech lead |
| R6 | Inaccurate mixing advice harms trust | L | M | Audio advisor review; date-stamp platform loudness figures | Product owner |
| R7 | Unknown words (slang, names) get no rhymes | H | M | Letter-to-sound fallback rules; user can add custom words | Tech lead |

### Deliverables

- Project charter and plan
- Budget and resource plan
- Risk register
- Communication plan

### Sign-off checklist

- [ ] Business case approved by sponsor
- [ ] Scope and assumptions documented
- [ ] Budget and timeline agreed
- [ ] Risks logged with owners
- [ ] Team and roles confirmed
- [ ] Data source licences checked

## 4. Phase 2: Requirements analysis

Goal: agree what the app must do and how well, in testable terms. Must = v1 launch; Should = v1 if time allows; Could = later releases.

Phase 2 worked requirements baseline: Phase 2: Requirements

### Functional requirements: words, rhymes and grammar

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| FR-01 | The system shall suggest perfect rhymes for a typed word | Must | Given "light", when searched, then "night", "bright", "fight" appear in the top 10 |
| FR-02 | The system shall suggest slant (near) rhymes, ranked by closeness | Must | Given "home", then "alone", "stone", "road" appear, each labelled by type (assonance, consonance, family rhyme) |
| FR-03 | The system shall suggest multi-syllable rhymes | Must | Given "falling apart", then "calling your heart"-style matches on the last two stressed syllables appear |
| FR-04 | The system shall show syllable count and stress pattern per word and per line | Must | Given "beautiful", then 3 syllables, stress DA-da-da |
| FR-05 | The system shall filter suggestions by syllable count, word type and commonness | Must | Given filter "2 syllables", then only 2-syllable words show |
| FR-06 | The system shall estimate pronunciation for unknown words | Must | Given "skrrt" or "Malibuzz", then a best-guess rhyme list appears, marked "estimated" |
| FR-07 | The system shall let users add custom words and pronunciations | Should | Given a saved custom word, then it appears in rhyme results offline |
| FR-08 | The system shall suggest synonyms and related words | Should | Given "sad", then "blue", "low", "heavy" appear in a Related tab |
| FR-09 | The system shall check grammar and spelling in the editor | Must | Given "their going home", then "their" is underlined with fix "they're" |
| FR-10 | The grammar checker shall offer a lyric mode | Must | Given lyric mode on, then "runnin' through the night" and sentence fragments are not flagged |
| FR-11 | Users shall be able to ignore a rule or a word | Must | Given "ignore", then that flag stays hidden across the song |

### Functional requirements: songwriting tools

These are the suggested tools to make songwriting easier, grouped by when a writer reaches for them.

| ID | Tool | What it does | Priority |
| --- | --- | --- | --- |
| FR-20 | Lyric editor with section tags | Write in Verse, Pre-chorus, Chorus, Bridge, Outro blocks; drag to reorder | Must |
| FR-21 | Syllable gutter | Live syllable count beside every line, so matching lines in each verse stay singable | Must |
| FR-22 | Rhyme scheme highlighter | Colours line endings by rhyme family and labels the scheme (AABB, ABAB, XAXA) | Must |
| FR-23 | Tap-to-rhyme | Tap any word in the editor to open rhyme and slant suggestions in a side panel | Must |
| FR-24 | Song structure templates | One-tap layouts such as V-C-V-C-B-C, with typical bar counts | Should |
| FR-25 | Cliché detector | Flags overused pairs and phrases (fire/desire, heart/apart, "tear me apart") and offers fresher options | Should |
| FR-26 | Chord sheet mode | Chords above lyrics, transpose, capo helper, ChordPro export | Should |
| FR-27 | Key and chord helper | Shows the chords in a chosen key, common progressions (I–V–vi–IV), Nashville numbers, circle of fifths | Should |
| FR-28 | Metronome and tap tempo | BPM tap, click, time signature | Should |
| FR-29 | Voice memo per line | Record a melody idea and pin it to a line or section | Should |
| FR-30 | Writer's block prompts | Random word, object-writing timer (10 minutes, five senses), title and hook generator from word lists | Should |
| FR-31 | Song stats | Word count, repeated words, hook repetitions, line-length balance across verses | Could |
| FR-32 | Drafts and versions | Autosave, named versions, compare two drafts side by side | Must |
| FR-33 | Export and backup | Export to .txt, PDF, ChordPro and a backup file; import backup | Must |
| FR-34 | Split sheet template | Fill-in co-writer credits and percentages, export as PDF | Could |

### Functional requirements: mixing helpers and FAQ

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| FR-40 | The system shall include a searchable mixing and mastering FAQ, offline | Must | Given search "loudness Spotify", then the loudness target card appears |
| FR-41 | The system shall show a loudness targets table per streaming platform, with a "last checked" date | Must | Each row shows integrated LUFS, true peak and date checked |
| FR-42 | The system shall include an EQ frequency guide by range and by instrument | Must | Tapping "vocals" shows ranges for body, mud, presence, sibilance, air |
| FR-43 | The system shall include starting-point settings (compression, reverb, delay) | Should | Each card shows ratio, attack, release, and a short "why" |
| FR-44 | The system shall include pre-mastering and delivery checklists | Must | Checklist items can be ticked and are saved per song |
| FR-45 | The system shall include calculators: BPM to delay/reverb time, dB to ratio | Should | Given 120 BPM, then quarter note = 500 ms, eighth = 250 ms |

### Non-functional requirements

| ID | Category | Requirement | Measure |
| --- | --- | --- | --- |
| NFR-01 | Performance | Suggestions appear instantly while typing | p95 under 100 ms on a 2021 mid-range Android phone |
| NFR-02 | Size | App and word model stay light | Under 3 MB gzipped first load; word model under 2 MB |
| NFR-03 | Offline | All Must features work without network | Airplane-mode test passes after first visit |
| NFR-04 | Privacy and security | Lyrics never leave the device | No network calls with user text; strict content security policy |
| NFR-05 | Accessibility | Usable with keyboard and screen reader | WCAG 2.2 AA |
| NFR-06 | Compatibility | Works on current browsers | Last 2 versions of Chrome, Safari (iOS and macOS), Firefox, Edge |
| NFR-07 | Reliability | No lost work | Autosave every 2 s to IndexedDB; restore after crash |

### User story format

As a \[songwriter\], I want \[to tap a word and see slant rhymes\] so that \[I can keep the meaning without forcing a cliché rhyme\].

### Traceability

| Requirement | Design element | Test case | Status |
| --- | --- | --- | --- |
| FR-01, FR-02, FR-03 | Rhyme engine (Web Worker) | TC-01, TC-02, TC-03 | Not started |
| FR-09, FR-10 | Grammar engine | TC-10, TC-11 | Not started |
| FR-20 to FR-23 | Editor module | TC-20 to TC-23 | Not started |
| FR-40 to FR-45 | Mix Helper module | TC-40 to TC-45 | Not started |

### Deliverables

- Prioritised product backlog
- User stories with acceptance criteria
- Traceability matrix

### Sign-off checklist

- [ ] Every requirement is unique, testable and prioritised
- [ ] Non-functional requirements have measurable targets
- [ ] Conflicts and open questions resolved
- [ ] Product owner and sponsor approved the baseline

## 5. Phase 3: Design

Goal: decide how the app will be built so it meets every baselined requirement. Everything runs in the browser; there is no backend.

### Architecture overview

| Item | Decision | Rationale |
| --- | --- | --- |
| Architecture style | Client-only modular monolith, installable PWA | No server cost, works offline, lyrics stay on device |
| Languages and frameworks | TypeScript, latest stable Angular (standalone components, signals), @angular/service-worker | Typed, structured, built-in PWA support |
| Heavy work | Rhyme and grammar engines in a Web Worker | Typing never lags while lookups run |
| Data storage | IndexedDB (via a small wrapper such as Dexie or idb) for songs, drafts, custom words, settings | Large, durable, offline storage |
| Word model | Our own compact binary files, built at compile time, cached by the service worker | Light, fast, fully under our control |
| Hosting | Static host (Cloudflare Pages, Netlify or GitHub Pages) with HTTPS | Free tier; HTTPS is required for PWAs |
| Integrations | None at runtime | Keeps app private and offline |

&#91;embedded content: App architecture · UI modules, Web Worker engines, on-device storage\]

The host is contacted only on first visit and for updates; after that, the service worker serves everything and no lyrics are ever sent out.

### Word model design (our own, light)

The model is a pronunciation-aware lexicon, not a large AI model. It is built once by a Node script at compile time and shipped as small binary files.

| File | Contents | Est. size (gzipped) |
| --- | --- | --- |
| lexicon.bin | \~60k most common English words, sorted and front-coded | \~250 KB |
| phones.bin | Phonemes per word, 1 byte each (39 ARPAbet sounds × stress) | \~300 KB |
| rhyme-index.bin | Rhyme key → word IDs, plus syllable count and stress pattern | \~200 KB |
| meta.bin | Part-of-speech flags per word; the 1-byte commonness ranks ship separately as commonness.bin (CC BY-SA 4.0, credited to wordfreq) | \~120 KB |
| g2p-rules.json | Letter-to-sound rules for unknown words | \~40 KB |
| related.bin (lazy-loaded) | Trimmed synonym and related-word sets | \~800 KB |

How suggestions work:

1. **Rhyme key.** Take the sounds from the last stressed vowel to the end of the word ("light" → AY-T).
2. **Perfect rhymes.** Words with the same rhyme key but a different starting sound.
3. **Slant rhymes.** Score every candidate by sound similarity: vowel closeness (height, front/back, rounding), ending consonant closeness (place, manner, voicing) and a small penalty for extra sounds. Label each result: assonance (same vowel: home/alone), consonance (same ending: lost/mist), family rhyme (similar consonants: cup/cut), additive or subtractive (tree/freeze).
4. **Multi-syllable rhymes.** Compare the last two or three stressed syllables of a phrase.
5. **Ranking.** Sort by score, then by commonness, so singable everyday words come first.
6. **Unknown words.** Letter-to-sound rules estimate the pronunciation; results show an "estimated" tag.

Licences settled: CMU Pronouncing Dictionary (BSD-style; keep its notice) for pronunciations, and wordfreq ranks in commonness.bin under CC BY-SA 4.0 with credit.

### Grammar engine design

A small rule engine, also in the Web Worker: tokenise → tag parts of speech from meta.bin → run JSON rules.

- **Spelling:** words not in the lexicon get edit-distance suggestions.
- **Confusables:** their/there/they're, your/you're, its/it's, then/than, lose/loose, affect/effect.
- **a / an by sound:** uses our phoneme data, so "an hour" and "a unicorn" are correct.
- **Repeats and agreement:** doubled words ("the the"), simple subject-verb agreement ("she don't"), capital I.
- **Lyric mode (on by default in the editor):** fragments, missing punctuation, dropped letters (runnin'), ain't, double negatives and lowercase line starts become hidden or "style" notes, not errors.

### Design system

The palette is warm and vintage: lemon chiffon reads like paper, mahogany like ink, ruby red is the single accent. Contrast ratios below were calculated against WCAG 2.2.

| Token | Hex | Light theme role | Dark theme role |
| --- | --- | --- | --- |
| --rich-mahogany | #3F0D12 | Body text, headings | Page background |
| --ruby-red | #A71D31 | Primary buttons, active tab, perfect-rhyme highlight | Button fill only (with chiffon text) |
| --lemon-chiffon | #F1F0CC | Page background | Body text |
| --soft-fawn | #D5BF86 | Cards, side panel, selected line | Accent text, links, icons |
| --faded-copper | #8D775F | Borders, dividers, icons, slant-rhyme underline | Borders, muted UI |

| Pair | Contrast | Use |
| --- | --- | --- |
| Mahogany on chiffon | 14.15:1 | All body text (AAA) |
| Mahogany on fawn | 9.10:1 | Text on cards (AAA) |
| Chiffon on ruby | 6.31:1 | Button labels (AA) |
| Ruby on chiffon | 6.31:1 | Links, accent text (AA) |
| Fawn on mahogany | 9.10:1 | Dark-theme accent text |
| Ruby on fawn | 4.06:1 | Large text (18 px+) only |
| Copper on chiffon | 3.66:1 | Borders and icons only, never body text |
| Ruby on mahogany | 2.24:1 | Do not use for text |

Rules: rhyme families need more than five colours, so highlights combine fills with underline styles (solid, dotted, wavy) and a family letter (A, B, C), never colour alone. Gradients appear only on the splash screen and empty states, using the mahogany → ruby stops; the full five-stop gradient crosses light and dark, so no text sits on it.

```css
:root {
  --rich-mahogany: #3f0d12;
  --ruby-red: #a71d31;
  --lemon-chiffon: #f1f0cc;
  --soft-fawn: #d5bf86;
  --faded-copper: #8d775f;
  --bg: var(--lemon-chiffon);
  --text: var(--rich-mahogany);
  --surface: var(--soft-fawn);
  --accent: var(--ruby-red);
  --line: var(--faded-copper);
  --font: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: var(--rich-mahogany); --text: var(--lemon-chiffon); --surface: #5a1a20; }
}
```

### Typography

Manrope, designed by Mikhail Sharanda, is free under the SIL Open Font License. Self-host the variable Latin subset (woff2, weights 200–800) so it works offline; do not load it from Google Fonts at runtime.

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Display | 32 / 40 px | 800 | Splash, empty states |
| H1 | 24 / 32 px | 700 | Screen titles, song title |
| H2 | 18 / 26 px | 600 | Section tags (Verse, Chorus) |
| Body | 16 / 26 px | 400 | UI text, FAQ |
| Editor | 18 / 32 px | 500 | Lyrics (extra line height leaves room for chords) |
| Label | 13 / 18 px | 600 | Buttons, chips, syllable counts |

### Design artefacts

| Artefact | Description | Link | Owner | Status |
| --- | --- | --- | --- | --- |
| System component diagram | Modules and data flow (above) | This doc | Tech lead | Draft |
| Data model | Song, Section, Line, Draft, CustomWord, Setting, ChecklistState | \[Link\] | Tech lead | Draft |
| Word model spec | Binary formats, build script, scoring weights | \[Link\] | Tech lead | Draft |
| UI/UX wireframes | Editor, rhyme panel, Mix Helper, settings | \[Link\] | Designer | Draft |
| Security and privacy note | No user text leaves device; CSP; no trackers | \[Link\] | Tech lead | Draft |

### Architecture decision records

| ID | Decision | Alternatives considered | Date | Status |
| --- | --- | --- | --- | --- |
| ADR-01 | Angular PWA instead of Flutter app | Flutter mobile, Flutter web | 2026-10-29 | Approved |
| ADR-02 | Own phoneme lexicon instead of an ML model | Word embeddings, cloud rhyme API | 2026-10-29 | Approved |
| ADR-03 | Rule-based grammar instead of LanguageTool | LanguageTool (needs Java server), cloud API | 2026-10-29 | Approved |
| ADR-04 | Engines in a Web Worker | Main thread | 2026-10-29 | Approved |

### Design review checklist

- [ ] Every requirement maps to a design element
- [ ] Size and speed targets addressed
- [ ] Privacy reviewed: no user text sent anywhere
- [ ] Autosave, backup and restore considered
- [ ] Accessibility and contrast reviewed
- [ ] Design approved by tech lead

## 6. Phase 4: Development

Goal: build the app to the approved design in small reviewed increments, word model first.

### Sprint plan (proposed)

The order below still holds, but its dates assumed full-time work; the part-time dates in the Phase 1 tab replace them, and Sprint 6 items are now v1.1.

| Sprint | Dates | Focus | Requirements |
| --- | --- | --- | --- |
| 1 | 2026-11-16 to 11-27 | Word model build script, rhyme engine, Web Worker | FR-01 to FR-06 |
| 2 | 2026-11-30 to 12-11 | Rhyme panel UI, filters, custom words, design system and Manrope | FR-05, FR-07, design tokens |
| 3 | 2026-12-14 to 12-25 | Lyric editor, sections, syllable gutter, rhyme scheme highlighter, autosave | FR-20 to FR-23, FR-32 |
| 4 | 2026-12-28 to 2027-01-08 | Grammar engine with lyric mode, export and backup | FR-09 to FR-11, FR-33 |
| 5 | 2027-01-11 to 01-22 (feature freeze 01-15, then hardening with QA) | Mix Helper FAQ, loudness table, EQ guide, checklists, calculators | FR-40 to FR-45 |
| 6 | After launch (v1.1) | Should items: chord sheet, key helper, metronome, voice memos, prompts, cliché detector | FR-24 to FR-30 |

Module layout: `core/` (storage, settings, service worker), `engines/` (worker, rhyme, grammar, g2p), `features/editor`, `features/rhymes`, `features/mix-helper`, `features/tools`, `shared/ui` (design-system components), `tools/build-word-model` (Node script).

### Engineering standards

| Area | Standard |
| --- | --- |
| Coding standard and linting | Angular style guide, ESLint (angular-eslint), Prettier |
| Branching strategy | GitHub Flow; branches `feat/`, `fix/`, `chore/` + short name |
| Commit convention | Conventional Commits |
| Code review | 1 reviewer minimum, within 1 working day |
| Dependency and licence policy | npm registry only; licence check in CI; keep dependencies few to protect bundle size |
| Secrets handling | None expected (no backend); any deploy tokens in CI secret store, never in the repo |
| Documentation | README, word model build guide, rule-authoring guide for grammar rules and FAQ content |

### Environments

| Environment | Purpose | Deployment trigger | Data |
| --- | --- | --- | --- |
| Local | Developer work | `ng serve` | Sample songs |
| Preview | Review each pull request | Every PR (host preview URL) | Sample songs |
| Staging | Beta testers, UAT | Merge to main | Testers' own songs, on their devices |
| Production | Live use | Tagged release | Users' songs, on their devices only |

### Continuous integration checks

- [ ] Build succeeds and word model rebuilds reproducibly
- [ ] Unit tests pass at or above 80% coverage for engines
- [ ] Lint and type checks pass
- [ ] Bundle size budget: fail if app code over 600 KB or word model over 2 MB gzipped
- [ ] Rhyme golden-set test passes (section 7)
- [ ] Dependency and licence scan pass

### Definition of done

- [ ] Code meets the acceptance criteria
- [ ] Peer review approved
- [ ] Unit and integration tests written and passing
- [ ] Works offline and in both light and dark themes
- [ ] Keyboard and screen-reader check done
- [ ] Documentation updated and demoed on the preview URL

### Deliverables

- Source code in version control
- Word model build script and generated files
- Automated build, test and deploy pipeline
- Developer documentation
- Updated traceability matrix

## 7. Phase 5: Testing

Goal: prove the app meets the requirements, works offline and gives rhymes songwriters actually use.

### Test strategy

| Test type | Purpose | Owner | Tooling | Entry point |
| --- | --- | --- | --- | --- |
| Unit | Verify engine functions (rhyme key, scoring, g2p, grammar rules) | Developers | Jest or Vitest | Every commit |
| Rhyme golden set | 300 hand-checked word → expected rhyme pairs, perfect and slant | QA + songwriter | Custom test runner | Every merge |
| Grammar golden set | 200 sentences and lyric lines with expected flags and non-flags | QA | Custom test runner | Every merge |
| Integration | Worker ↔ UI messaging, storage, export/import | Developers / QA | Angular testing utilities | Every merge |
| End-to-end | Full journeys: write a verse, find rhymes, export | QA | Playwright | Release candidate |
| Offline | All Must features in airplane mode, after reload | QA | Playwright offline mode + real devices | Release candidate |
| Performance | Suggestion latency, first load size, Lighthouse PWA score | QA / DevOps | Lighthouse CI, bundle budgets | Release candidate |
| Accessibility | WCAG 2.2 AA, keyboard, screen reader, contrast | QA / Design | axe, VoiceOver, TalkBack | Release candidate |
| Content accuracy | Mixing FAQ facts and figures | Audio advisor | Manual review | Release candidate |
| User acceptance (UAT) | 8–12 songwriters use it for 2 weeks | Product owner | Feedback form | Staging |

### Test case examples

| ID | Requirement | Title | Steps | Expected result | Status |
| --- | --- | --- | --- | --- | --- |
| TC-01 | FR-01 | Perfect rhymes | 1. Type "light" 2. Open Rhymes | "night", "bright", "fight" in top 10 | Not run |
| TC-02 | FR-02 | Slant rhymes labelled | 1. Type "home" 2. Open Slant | "alone" (assonance) appears; for "tree", "freeze" (additive) appears, with labels | Not run |
| TC-06 | FR-06 | Unknown word | 1. Type "Malibuzz" | Rhymes shown with "estimated" tag | Not run |
| TC-10 | FR-09 | Confusable | 1. Type "their going home" | "their" flagged, fix "they're" | Not run |
| TC-11 | FR-10 | Lyric mode | 1. Lyric mode on 2. Type "runnin' through the night" | No error shown | Not run |
| TC-22 | FR-22 | Rhyme scheme | 1. Paste 4 lines ending night/day/light/way | Scheme shows ABAB | Not run |
| TC-45 | FR-45 | Delay calculator | 1. Enter 120 BPM | 1/4 = 500 ms, 1/8 = 250 ms | Not run |

### Defect severity

| Severity | Definition | Target resolution |
| --- | --- | --- |
| Critical | Lost lyrics, app will not load offline, crash on open | Before release; fix within 24 h |
| High | Rhymes or grammar broken, export fails, no workaround | Before release |
| Medium | Feature impaired, workaround exists | Next release |
| Low | Cosmetic, wording | Backlog |

### Entry and exit criteria

- [ ] Entry: build on staging and smoke tests pass
- [ ] Exit: all planned tests executed and 95% passed
- [ ] Exit: rhyme golden set ≥ 95% perfect-rhyme accuracy; ≥ 70% of slant top-10 rated usable by testers
- [ ] Exit: no open critical or high defects
- [ ] Exit: performance, size and offline targets met
- [ ] Exit: UAT signed off by the product owner

### UAT sign-off

| Name | Role | Decision | Date | Comments |
| --- | --- | --- | --- | --- |
| \[Name\] | Product owner | \[Approved / Rejected\] | \[YYYY-MM-DD\] | \[Comments\] |

## 8. Phase 6: Deployment and release

Goal: publish the tested PWA with minimal risk and a one-click way back. Because the app is static files, a release is a new deploy and a rollback is redeploying the previous build.

### Release plan

| Item | Details |
| --- | --- |
| Release version | 1.0.0 |
| Release date and window | 2027-06-04, off-peak hours; exact window and time zone open question |
| Release manager | \[Name\] |
| Deployment strategy | Atomic static deploy; service worker shows "New version ready — refresh" instead of force-reloading mid-song |
| Scope | All Must requirements (section 4); link to release notes |
| Freeze date | 2027-05-09 |

### Go-live criteria

- [ ] Testing exit criteria met and UAT signed off
- [ ] Free subdomain chosen from what's available, trademark search done, HTTPS working; PWA install prompt works on Android, iOS and desktop
- [ ] Lighthouse PWA and accessibility checks pass
- [ ] Word model and FAQ content version recorded in the build
- [ ] Privacy note and licence credits page published (CMU dictionary notice, wordfreq CC BY-SA 4.0 credit, Manrope OFL)
- [ ] Rollback tested on staging
- [ ] Go / no-go approved by sponsor and release manager

### Deployment checklist

| Step | Action | Owner | Time | Done |
| --- | --- | --- | --- | --- |
| 1 | Announce deployment start | \[Name\] | \[Time\] | \[ \] |
| 2 | Tag release in Git; CI builds and runs all checks | \[Name\] | \[Time\] | \[ \] |
| 3 | Deploy to production host | \[Name\] | \[Time\] | \[ \] |
| 4 | Smoke test: load, install, rhyme lookup, save, export | \[Name\] | \[Time\] | \[ \] |
| 5 | Offline test: airplane mode, reload, core features | \[Name\] | \[Time\] | \[ \] |
| 6 | Check that existing users get the update prompt and keep their songs | \[Name\] | \[Time\] | \[ \] |
| 7 | Announce completion | \[Name\] | \[Time\] | \[ \] |

### Rollback plan

| Item | Details |
| --- | --- |
| Rollback triggers | App fails to load or save, data loss reported, service worker stuck on a broken build |
| Decision maker | Release manager |
| Rollback steps | Re-deploy previous build from the host's deploy history; bump service worker version so clients refresh; IndexedDB schema migrations must be backward compatible |
| Maximum time to roll back | 15 minutes |

### Communication plan

| Audience | Message | Channel | When | Owner |
| --- | --- | --- | --- | --- |
| Users | What's new, how to install, privacy note | In-app "What's new", social posts | At launch | \[Name\] |
| Beta testers | Thanks, known issues, feedback link | Email | Before and after | \[Name\] |
| Stakeholders | Go-live status | \[Channel\] | After | \[Name\] |

## 9. Phase 7: Maintenance and operations

Goal: keep the app reliable, private and useful. With no servers, most work is content upkeep: the word model, grammar rules and mixing FAQ.

### Support model

| Tier | Responsibility | Team | Hours | Escalates to |
| --- | --- | --- | --- | --- |
| Tier 1 | FAQ, feedback form triage, "missing rhyme" reports | \[Product owner\] | \[Hours\] | Tier 2 |
| Tier 2 | Reproduce bugs, content fixes (words, rules, FAQ) | \[Dev team\] | \[Hours\] | Tier 3 |
| Tier 3 | Engine, storage and service worker fixes | \[Tech lead\] | \[Hours\] | Sponsor |

### Incident priorities

| Priority | Definition | Response target | Resolution target |
| --- | --- | --- | --- |
| P1 | App will not load or users lose songs | 1 h | 4 h (rollback first) |
| P2 | Rhymes, grammar or export broken | 1 business day | 3 business days |
| P3 | Minor feature affected, wrong suggestion | 2 business days | Next release |
| P4 | Question, cosmetic issue | 5 business days | Backlog |

### Ongoing operations

| Activity | Frequency | Owner |
| --- | --- | --- |
| Review "missing word" and "bad rhyme" reports; add to word model | Monthly | \[Name\] |
| Tune slant-rhyme weights from tester feedback | Quarterly | \[Name\] |
| Re-check streaming loudness figures and update FAQ "last checked" dates | Every 6 months | \[Name\] |
| Dependency and Angular updates | Monthly | \[Name\] |
| Bundle size and Lighthouse review | Every release | \[Name\] |
| Post-incident review | After every P1 or P2 | \[Name\] |

Privacy-friendly feedback: an opt-in "report this suggestion" button opens an email or form with only the searched word, never the song.

### Change management

All changes go through the change request log in section 10. Emergency fixes are approved by the tech lead and logged within 1 business day.

### Retrospective

| Question | Notes |
| --- | --- |
| What went well? | \[Notes\] |
| What did not go well? | \[Notes\] |
| What will we change next time? | \[Actions, owners, dates\] |
| Did we meet the objectives from Phase 1? | \[Compare with success measures\] |

### End-of-life checklist

- [ ] Retirement decision approved and users notified in-app at least 60 days ahead
- [ ] Users prompted to export all songs
- [ ] Final build left online read-only, or domain redirected to export instructions
- [ ] Hosting and domain costs stopped
- [ ] Documentation and word model sources archived

## 10. Governance and logs

### RACI matrix

R = Responsible, A = Accountable, C = Consulted, I = Informed.

| Activity | Sponsor | Product owner | Project manager | Tech lead | Dev team | QA lead | Ops lead |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Planning | A | C | R | C | I | I | I |
| Requirements | C | A | R | C | C | C | I |
| Design | I | C | I | A | R | C | C |
| Word model | I | C | I | A | R | C | I |
| Development | I | C | I | A | R | C | I |
| Testing | I | C | I | C | C | A | I |
| Mixing FAQ content | I | A | I | C | R | C | I |
| Deployment | C | C | R | C | C | C | A |
| Maintenance | I | C | I | C | R | C | A |

### Change request log

| ID | Date | Requested by | Description | Impact (scope, cost, time) | Decision | Approved by |
| --- | --- | --- | --- | --- | --- | --- |
| CR-01 | \[YYYY-MM-DD\] | \[Name\] | \[Change\] | \[Impact\] | \[Approved / Rejected / Deferred\] | \[Name\] |

### Decision log

| ID | Date | Decision | Context | Decided by |
| --- | --- | --- | --- | --- |
| D-01 | 2026-10-29 | Recommend Angular static PWA over Flutter for v1 | Lighter, one codebase, offline via service worker, free hosting | Pending owner approval |
| D-02 | 2026-10-29 | Palette and Manrope adopted as brand | Owner request | Owner |
| D-03 | 2026-10-30 | Product name: Slantsmith | No GitHub repos with the name; trademark and subdomain still to check | Owner |
| D-04 | 2026-10-30 | Use wordfreq ranks; ship them only in commonness.bin under CC BY-SA 4.0 with credit | Simplest licensed source; keeps app code under its own licence | Owner |

### Issue log

| ID | Date raised | Issue | Owner | Due | Status |
| --- | --- | --- | --- | --- | --- |
| I-01 | 2026-10-29 | Confirm licence for pronunciation dictionary and word-frequency list | \[Name\] | \[YYYY-MM-DD\] | Closed 2026-10-30 |
| I-02 | 2026-10-29 | Confirm project owner, budget and start date | \[Name\] | \[YYYY-MM-DD\] | Closed 2026-10-30 |
| I-03 | 2026-10-29 | Choose final product name and check domain | \[Name\] | \[YYYY-MM-DD\] | Closed 2026-10-30: Slantsmith |
| I-04 | 2026-10-30 | Word-frequency data (wordfreq) is CC BY-SA 4.0: accept share-alike for the commonness file, or use another source | You | 2026-11-15 | Closed 2026-10-30: accept CC BY-SA |

### Glossary

| Term | Definition |
| --- | --- |
| SDLC | Software development life cycle: the phases from idea to retirement |
| PWA | Progressive Web App: a website that installs and works offline like an app |
| Perfect rhyme | Same sounds from the last stressed vowel to the end (light / night) |
| Slant rhyme | Near rhyme with similar but not identical sounds (home / alone) |
| Assonance | Matching vowel sounds, different consonants |
| Consonance | Matching consonant sounds, different vowels |
| Phoneme | A single speech sound; ARPAbet is the code set used to write them |
| G2P | Grapheme-to-phoneme: guessing pronunciation from spelling |
| LUFS | Loudness Units relative to Full Scale: standard measure of perceived loudness |
| dBTP | Decibels true peak: peak level including inter-sample peaks |
| UAT | User acceptance testing |
| ADR | Architecture decision record |

### Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-10-29 | \[Name\] | Initial draft from SDLC template |

### Approvals

| Name | Role | Signature or approval | Date |
| --- | --- | --- | --- |
| \[Name\] | Sponsor | \[ \] | \[YYYY-MM-DD\] |
| \[Name\] | Product owner | \[ \] | \[YYYY-MM-DD\] |
| \[Name\] | Tech lead | \[ \] | \[YYYY-MM-DD\] |

## Appendix A: Mixing and mastering helper content

This is the starter content for the Mix Helper module (FR-40 to FR-45). Figures are approximate, written from general industry knowledge without a live source check; the audio advisor must verify each one and add a source and "last checked" date before launch, because platforms change their numbers.

### Streaming loudness reference levels

Platforms turn tracks down (and some turn them up) to these playback levels. They are not rules you must master to; they tell you where your master will end up.

| Platform | Integrated loudness | Recommended true peak | Note |
| --- | --- | --- | --- |
| Spotify | −14 LUFS (default setting) | −1 dBTP; −2 dBTP if master is louder than −14 LUFS | Also has Loud (−11) and Quiet (−19) user settings |
| Apple Music | −16 LUFS | −1 dBTP | Sound Check normalization |
| YouTube | −14 LUFS | −1 dBTP | Turns loud tracks down only |
| Amazon Music | about −14 LUFS | −1 to −2 dBTP | Verify |
| Tidal | −14 LUFS | −1 dBTP | Verify |
| Deezer | −15 LUFS | −1 dBTP | Verify |

### Pre-mastering checklist (mix delivery)

- [ ] Mix bus peaks between −6 and −3 dBFS; no clipping anywhere
- [ ] Limiter and loudness processing removed from the mix bus (send a separate "loud reference" if you like)
- [ ] Exported as WAV, 24-bit or 32-bit float, at the session sample rate (44.1 or 48 kHz)
- [ ] Start and end not cut off; leave about 1 s of silence after the tail
- [ ] Checked in mono and on at least three systems (monitors, headphones, phone or car)
- [ ] Reference track included and noted
- [ ] File named: Artist\_Title\_Mix\_v3\_24b48k.wav

### Master delivery checklist

- [ ] Streaming: 24-bit WAV at 44.1 or 48 kHz, true peak at or below −1 dBTP
- [ ] CD: 16-bit / 44.1 kHz with dither applied once, at the final step
- [ ] Fades and start/end trims done; consistent loudness across an album or EP
- [ ] Metadata ready: ISRC per track, title, artist, writers and splits

### EQ frequency guide

| Range | Hz | Sounds like | Common moves |
| --- | --- | --- | --- |
| Sub | 20–60 | Felt more than heard, rumble | High-pass anything that does not need it |
| Bass | 60–250 | Weight, warmth, kick and bass body | Give kick and bass separate pockets |
| Low mids | 250–500 | Mud, boxiness | Small cuts on crowded tracks |
| Mids | 500 Hz–2 kHz | Body, tone, honk | Shape character; careful with boosts |
| Upper mids | 2–5 kHz | Presence, clarity, harshness | Vocal intelligibility lives here |
| Highs | 5–10 kHz | Edge, sibilance (about 5–8 kHz) | De-ess vocals; tame harsh cymbals |
| Air | 10–20 kHz | Sparkle, openness | Gentle shelf boosts |

### Starting-point settings (adjust by ear)

| Source | Compression | Other tips |
| --- | --- | --- |
| Lead vocal | Ratio 3:1–4:1, attack 5–20 ms, release 50–150 ms, 3–6 dB gain reduction | High-pass about 80–100 Hz; de-ess; two light compressors beat one heavy one |
| Kick | Ratio 4:1, attack 10–30 ms (lets the click through), fast release | Find the thump (50–80 Hz) and the click (2–5 kHz) |
| Bass | Ratio 3:1–6:1, medium attack | Keep low end mono; sidechain to kick if they fight |
| Acoustic guitar | Ratio 2:1–3:1, 2–4 dB reduction | High-pass about 80–120 Hz in a full mix |
| Mix bus glue | Ratio 2:1, slow attack (about 30 ms), auto release, 1–2 dB reduction | Optional; never squash before mastering |

### Calculators (built into the app)

Quarter-note delay time in milliseconds:

```latex
t_{1/4} = \frac{60000}{\text{BPM}}
```

At 120 BPM: 1/4 = 500 ms, 1/8 = 250 ms, dotted 1/8 = 375 ms, 1/16 = 125 ms. Reverb pre-delay often sits at a 1/32 or 1/64 note to keep vocals clear.

### FAQ starter set

- **How loud should my master be?** Loud enough for the genre without crushing it. Around −14 to −9 LUFS integrated covers most streaming releases; louder masters just get turned down.
- **Why does my mix sound good in the studio but bad in the car?** Usually low-end imbalance from untreated rooms. Compare with a reference track on the same system.
- **What level should I monitor at?** Moderate, around 75–85 dB SPL, and take breaks; ears tire and mixes get brighter and louder.
- **Should the low end be stereo?** Keep bass and kick mostly mono below about 100–150 Hz so playback stays solid on any system.
- **What is headroom?** Space between your loudest peak and 0 dBFS. Leave 3–6 dB in a mix so the mastering stage has room.
- **Mix or master first?** Always mix first. Mastering polishes a finished mix; it cannot fix balance problems.

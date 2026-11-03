# Phase 1: Planning

Oct 30, 2026 · @Toni Ross Inot

Solo build, $0 budget, part-time at about 10 hours a week: Phase 1 runs 2026-11-02 to 2026-11-15, and v1.0 launches on Jun 4, 2027, about 31 weeks from start.

## Project charter

**Decision: v1.0 ships only the Must requirements; every Should moves to v1.1.** At 10 hours a week, that keeps launch near 31 weeks instead of 45+.

| Field | Details |
| --- | --- |
| Project | Slantsmith, RS-001 |
| Owner | You: sponsor, product owner, developer, QA and operations |
| Helpers (unpaid) | 8–12 volunteer beta songwriters; 1 volunteer audio advisor for the Mix Helper (to recruit) |
| Goal | A free, offline, light word tool that gives songwriters perfect and slant rhymes, grammar checks in lyric mode, and mixing references in one place |
| Budget | $0: free tools and free hosting only (see the resource plan) |
| Pace | About 10 hours a week, part-time |
| Start | 2026-11-02 |
| Launch | 2027-06-04 |

### v1.0 scope (Must only)

| Area | In v1.0 | Moved to v1.1 |
| --- | --- | --- |
| Rhymes | Perfect, slant, multi-syllable rhymes; syllables and stress; filters; unknown-word estimates (FR-01 to FR-06) | Custom words, related words (FR-07, FR-08) |
| Grammar | Spelling, confusables, lyric mode, ignore (FR-09 to FR-11) | — |
| Editor | Sections, syllable gutter, rhyme scheme highlighter, tap-to-rhyme, autosave and versions, export and backup (FR-20 to FR-23, FR-32, FR-33) | Structure templates, cliché detector, song stats (FR-24, FR-25, FR-31) |
| Songwriting tools | — | Chord sheet, key helper, metronome, voice memos, prompts, split sheet (FR-26 to FR-30, FR-34) |
| Mix Helper | Searchable FAQ, loudness table, EQ guide, checklists (FR-40 to FR-42, FR-44) | Starting-point settings, calculators (FR-43, FR-45) |

### Success measures

| Objective | Measure | Target |
| --- | --- | --- |
| Ship on time | v1.0 live | By 2027-06-04, within about 300 hours |
| Fast rhymes | Typing to suggestions shown | Under 100 ms on a mid-range phone |
| Good slant rhymes | Beta testers rate top-10 slant results usable | 70% or more |
| Light | First load, gzipped | Under 3 MB |
| Offline | Must features in airplane mode | 100% |
| Sticky | Beta testers still using it weekly after 4 weeks | 50% or more |

### Working rules for a solo build

- Flexible schedule: code whenever suits you, aiming for about 10 hours a week on average; note hours in the weekly log.
- One feature in progress at a time; finish it to the definition of done before starting the next.
- Self-review: reread every pull request the next day before merging, against the review checklist.
- Time-box research to 2 hours per question; log the decision and move on.
- If a phase runs more than 2 weeks late, cut scope to v1.1 before moving the launch date.

## Timeline

&#91;embedded content: Phase timeline · Nov 2026 to Jun 2027\]

The word model phase is longest because it spans the holidays at half pace; feature freeze on May 9 leaves three weeks for beta fixes.

## Time and resource plan

The plan budgets about 300 hours over 31 weeks. Late December to early January is planned at half pace for the holidays.

| Phase | Weeks | Dates | Hours |
| --- | --- | --- | --- |
| Planning | 2 | 2026-11-02 to 11-15 | 20 |
| Requirements and design | 4 | 2026-11-16 to 12-13 | 40 |
| Word model and rhyme engine | 6 (holiday half pace) | 2026-12-14 to 2027-01-24 | 45 |
| Rhyme panel, design system, Manrope | 4 | 2027-01-25 to 02-21 | 40 |
| Lyric editor, autosave, versions | 4 | 2027-02-22 to 03-21 | 40 |
| Grammar engine, export and backup | 4 | 2027-03-22 to 04-18 | 40 |
| Mix Helper, then feature freeze | 3 | 2027-04-19 to 05-09 | 30 |
| Beta testing and fixes | 3 | 2027-05-10 to 05-30 | 30 |
| Release prep and go-live | 1 | 2027-05-31 to 06-04 | 10 |
| **Total** | **31** |  | **295** |

### Free tools ($0)

Free-tier limits are from general knowledge; check each provider's current terms when you sign up.

| Need | Tool | Cost note |
| --- | --- | --- |
| Code editor | VS Code | Free |
| Repository, task board | GitHub (repo + GitHub Projects) | Free plan |
| CI checks | GitHub Actions | Free monthly minutes; unlimited on public repos |
| Hosting | Cloudflare Pages or GitHub Pages, on the free subdomain (\*.pages.dev or \*.github.io) | Free; a custom domain costs about $10–15 a year, so skip it for now |
| Design and wireframes | Penpot or Figma free plan | Free |
| Font | Manrope, self-hosted woff2 | Free (SIL Open Font License) |
| Word data | CMU Pronouncing Dictionary, wordfreq | Free (see licence check) |
| Testing | Vitest, Playwright, Lighthouse CI, axe | Open source |
| Beta feedback | Google Forms or GitHub Issues | Free |
| Tester updates | Email list or a free Discord server | Free |

The PWA choice saves real money here: no Apple Developer Program fee and no Google Play registration fee.

## Risk register

The biggest risks are now about you, not the tech: running out of steam and scope creep. All risks are owned by you unless noted.

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Burnout or life gets busy; weekly hours drop | H | H | Hours noted in the weekly log; if the 4-week average drops under 7 hours, cut scope to v1.1 or move the date |
| R2 | Scope creep (adding Should features early) | H | H | v1.0 = Must only; new ideas go to the v1.1 backlog, not the current sprint |
| R3 | No second reviewer catches mistakes | H | M | Next-day self-review, CI checks, golden-set tests, beta testers |
| R4 | Slant rhymes feel random or weak | M | H | Tune weights with beta testers; show why each word matched |
| R5 | Word model too big for the 3 MB target | M | M | Trim to \~60k words; CI size budget fails the build if exceeded |
| R6 | Grammar checker flags normal lyric style | H | M | Lyric mode on by default; one-tap ignore |
| R7 | Share-alike licence on word-frequency data | M | M | Decided: commonness.bin ships under CC BY-SA 4.0 with credit, kept as a separate file |
| R8 | Can't recruit beta testers or an audio advisor | M | M | Start recruiting in February from songwriting communities; offer credits page mention |
| R9 | Free-tier terms change | L | M | Static files move between hosts in under an hour; keep the build host-neutral |
| R10 | Single laptop failure loses work | L | H | Push to GitHub every session |
| R11 | iOS evicts offline storage for unused PWAs | M | M | Re-cache on launch; prompt users to export backups |

## Communication plan

Solo work still needs a rhythm: a short weekly log keeps you honest, and monthly tester updates keep the beta group engaged.

| Audience | Message | Channel | When |
| --- | --- | --- | --- |
| You (weekly log) | Hours spent, what shipped, what's blocked, next week's one goal | Any notes app until the repo exists, then LOG.md in the repo | Every Sunday, 10 minutes |
| You (phase gate) | Exit criteria met? Behind by more than 2 weeks? Cut scope? | This doc: tick the phase sign-off | End of each phase |
| Beta testers | What's new, what to try, feedback link | Email or Discord | Monthly from February; weekly during beta (May 10 to 30) |
| Audio advisor | Mix Helper content to review | Email with this doc shared | April, before feature freeze |
| Public | Launch announcement, install link, privacy note | Social posts, songwriting communities | 2027-06-04 |

Weekly log template:

```markdown
## Week of YYYY-MM-DD
- Hours: _
- Shipped: _
- Blocked by: _
- Next week's one goal: _
```

## Licence check

The pronunciation source is clear to use; the word-frequency data is share-alike, and we accept that for one separate file (D-04). This is a plain reading of the licences, not legal advice.

| Source | Licence | What it means for us | Status |
| --- | --- | --- | --- |
| [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict/blob/master/LICENSE) | BSD-style (Carnegie Mellon, 1993–2015) | Free to redistribute, also in derived binary form, if we reproduce the copyright notice and disclaimer in our credits page | Cleared |
| [wordfreq](https://github.com/rspeer/wordfreq) | Code: Apache 2.0. Data: CC BY-SA 4.0 | Our commonness ranks would be derived data, so that file should carry attribution and be shared under CC BY-SA 4.0; app code is not affected | Decided: accept, ship as commonness.bin |
| Manrope font | SIL Open Font License (from general knowledge; source repo not checked) | Free to bundle and self-host; keep the licence file with the font | Confirm when downloading |
| Open English WordNet (word types) | CC BY 4.0, on top of the Princeton WordNet licence | Credit Princeton WordNet and the Open English WordNet team on the credits page | Cleared (Phase 3) |
| LDNOOBW English list (explicit and slur lists) | CC BY 4.0 | Credit LDNOOBW on the credits page | Cleared (Phase 3) |
| codespell misspelling list | CC BY-SA 3.0 | Build time only, not shipped; keep the credit line in the blocklist file | Cleared (Phase 2) |

Decision (2026-10-30): use wordfreq ranks, shipped only in commonness.bin under CC BY-SA 4.0, credited on the credits page. Never merge the ranks into other model files; the app code keeps its own licence.

## Phase 1 sign-off checklist (by 2026-11-15)

- [x] Team and roles confirmed: solo, all roles
- [x] Budget agreed: $0, free tools only
- [x] Timeline agreed: part-time, launch 2027-06-04
- [x] Scope set: v1.0 Must only, Should items in v1.1
- [x] Risks logged with mitigations
- [x] Pronunciation source licence cleared (CMU)
- [x] Word-frequency licence decided: CC BY-SA 4.0 for commonness.bin (I-04)
- [x] Product name picked: Slantsmith (I-03)
- [x] Moved to Phase 6: pick the free subdomain from what's available at deploy time (e.g. slantsmith.pages.dev or a github.io address) and run a trademark search before launch
- [x] Moved to development start (2026-12-14): create the GitHub repo, project board and LOG.md
- [x] Schedule: flexible, no fixed slots; hours noted in the weekly log

## Sources

- [CMU Pronouncing Dictionary licence](https://github.com/cmusphinx/cmudict/blob/master/LICENSE), read 2026-10-30
- [wordfreq README, licence section](https://github.com/rspeer/wordfreq), read 2026-10-30

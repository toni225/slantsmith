# Decisions (all approved by the owner, 2026-10-30)

| ID | Decision | Why |
| --- | --- | --- |
| ADR-01 | Angular PWA, not Flutter | Light, one codebase for phone + laptop, offline via service worker, free hosting, no store fees |
| ADR-02 | Own phoneme lexicon, not an ML model | Small, fast, explainable rhymes |
| ADR-03 | Rule-based grammar, not LanguageTool | Runs offline in the browser |
| ADR-04 | Engines in a Web Worker | Typing never lags |
| ADR-05 | One model folder per language with its own manifest/sound set | Tagalog/Taglish later without engine changes |
| ADR-06 | Build the rhyme index in the worker at load; prebuilt file is the fallback if > 150-300 ms | Smaller download |
| ADR-07 | One record per song; versions in a separate store | Atomic autosave |
| ADR-08 | Vowel merges for matching: AA = AO; IH = IY and UH = UW before R | CMU dictionary inconsistency; US speakers merge them |
| ADR-09 | Explicit words flagged at build, shown by default; slurs removed at build | Owner decision |

## Changes made while building Sprint 1

- Build script is Python (wordfreq is Python). lexicon.txt is a plain sorted list (not front-coded).
- Unknown words: borrow the sound of known words with the same spelling ending (+ vowel/consonant-before marker, slang fixes skrrt→skrt, thicc→thick); dropped-g retry (runnin' → running). No g2p-rules.json yet.
- Slant rank = score + 40 × commonness/255 (was 10); results capped at 50 per type.
- Slant score = 100 − 40·vowelDistance − 35·tailDistance − 10·extra sounds. Starting weights; tune with beta testers.

## Other product decisions

- Name: Slantsmith. Platform: web PWA, phone-first (390 px). Default theme: studio dark ("lamp on the music stand").
- v1.0 = Must requirements only; Should items are v1.1.
- US English only in v1.0. Tagalog/Taglish wanted later.
- Explicit words shown by default (Settings can hide). Owner writes the Mix help FAQ; volunteer audio advisor reviews it in April.
- Schedule: solo, flexible hours (~10 h/week avg); if the 4-week average drops under 7 h, cut scope or move the date. Launch target 2027-06-04, feature freeze 2027-05-09.
- Domain: pick a free subdomain at deploy time; trademark search before launch.

## Licences (plain reading, not legal advice)

| Source | Licence | Use |
| --- | --- | --- |
| CMU Pronouncing Dictionary | BSD-style | Pronunciations; keep its notice on the credits page |
| wordfreq | Code Apache 2.0, data CC BY-SA 4.0 | Ranks only in commonness.bin, shipped under CC BY-SA 4.0 with credit |
| Open English WordNet | CC BY 4.0 (+ Princeton WordNet licence) | Word types (Sprint 2) and part of the word list; credit both |
| ENABLE word list | Public domain | Which words are English (vocabulary); build input, fetched on demand |
| g2p_en | Apache 2.0 | Build-time only: predicts pronunciations in tools/data/estimated.dict; code not shipped |
| LDNOOBW English list | CC BY 4.0 | explicit_words.txt, slur_blocklist.txt; credit |
| codespell list | CC BY-SA 3.0 | Build-time misspelling blocklist only, not shipped |
| Manrope (Mikhail Sharanda) | SIL Open Font License | Self-hosted font; keep the licence file |

## Mix help loudness figures (from memory; verify and date before launch)

Spotify −14 LUFS (Loud −11, Quiet −19), Apple Music −16, YouTube −14, Amazon Music about −14, Tidal −14, Deezer −15; true peak −1 dBTP (−2 if louder than −14 LUFS).

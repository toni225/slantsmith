# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular (latest stable, standalone components, signals) as an installable offline PWA; static hosting on a free subdomain. Chosen in the SDLC plan (ADR-01).

## Users

- Hobby songwriters writing on phone and guitar in the evening; job: find a rhyme that keeps the meaning, fast.
- Rappers and lyricists writing dense lines; job: multi-syllable and slant rhymes, syllable counts per bar, slang.
- Bedroom producers who mix their own songs; job: quick, trustworthy mixing and mastering references.

## Product Purpose

Slantsmith is a free, offline, light word tool for songwriting: perfect, slant and multi-syllable rhymes from its own compact word model, a grammar checker with a lyric mode that respects lyric style, a lyric editor with section tags, syllable counts and rhyme-scheme highlighting, and a Mix Helper of loudness, EQ and delivery references. Success: songwriters keep using it weekly; rhymes appear in under 100 ms.

## Positioning

Slant rhymes labelled by type (assonance, consonance, family, additive) with a reason for each match, a grammar checker that knows lyrics are not prose, all running offline with lyrics never leaving the device.

## Operating Context

Used mid-writing, often on a phone beside an instrument, or on a laptop next to a DAW. Sessions are short bursts inside a creative flow; interruptions cost the idea.

## Capabilities and Constraints

- v1.0 scope: 20 Must requirements (Phase 2 baseline); chords, metronome, voice memos and prompts are v1.1.
- Fully offline after first visit; first load under 3 MB; no accounts, analytics or network calls with user text.
- US English only in v1.0; Tagalog/Taglish later.
- Explicit words shown by default, hideable; slurs removed.

## Brand Commitments

- Name: Slantsmith.
- Palette (binding): rich mahogany #3F0D12, ruby red #A71D31, lemon chiffon #F1F0CC, soft fawn #D5BF86, faded copper #8D775F.
- Typeface (binding): Manrope (Mikhail Sharanda), self-hosted.

## Evidence on Hand

No users, testimonials or metrics yet. Do not fabricate any.

## Product Principles

1. Never break the writer's flow: suggestions come to the word, not the other way round.
2. Explain the match: every slant rhyme says why it fits.
3. Respect lyric voice: style is not an error.
4. Private by default: lyrics stay on the device.

## Accessibility & Inclusion

WCAG 2.2 AA; keyboard and screen reader use; rhyme families never shown by colour alone; touch targets at least 44 px.

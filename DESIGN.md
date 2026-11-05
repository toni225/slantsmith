---
name: Slantsmith
description: Offline rhyme, slant and grammar helper for songwriters. Studio at night.
colors:
  rich-mahogany: "#3F0D12"
  ruby-red: "#A71D31"
  lemon-chiffon: "#F1F0CC"
  soft-fawn: "#D5BF86"
  faded-copper: "#8D775F"
  booth-dark: "#29080C"
  lamp-lit: "#512220"
  dim-warm: "#B8936F"
  paper-chrome: "#E9E2B8"
  paper-lit: "#E7DFB4"
  paper-dim: "#6A4B3A"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.29
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.4
  lyric:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.78
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.53
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  badge: "6px"
  control: "12px"
  button: "14px"
  card: "20px"
  sheet: "26px"
  pill: "22px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ruby-red}"
    textColor: "{colors.lemon-chiffon}"
    rounded: "{rounded.button}"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.lemon-chiffon}"
    rounded: "{rounded.control}"
    height: "44px"
  chip-rhyme:
    backgroundColor: "transparent"
    textColor: "{colors.lemon-chiffon}"
    rounded: "{rounded.pill}"
    height: "44px"
  lamp-card:
    backgroundColor: "{colors.lamp-lit}"
    textColor: "{colors.lemon-chiffon}"
    rounded: "{rounded.card}"
    padding: "14px 12px"
  sheet:
    backgroundColor: "{colors.lamp-lit}"
    rounded: "{rounded.sheet}"
  active-word:
    backgroundColor: "{colors.ruby-red}"
    textColor: "{colors.lemon-chiffon}"
    rounded: "{rounded.badge}"
    padding: "1px 5px"
---

## Overview

Creative north star: **the lamp on the music stand**. A dark studio at night; the part you are working on sits in a warm pool of light and everything else steps back. Operate-mode app: standard phone patterns (bottom tabs, bottom sheets, real buttons and inputs), with the world showing only through palette, type, density and the lamp. Phone first, 390 px.

## Colors

Studio dark is the default. Mahogany is the page, booth-dark the chrome (tab bar, quick-rhyme bar, inputs), lamp-lit the one focused surface. Chiffon is lyric and body text (14.2:1 on mahogany); fawn is labels, counts and secondary text (9.1:1); dim-warm is unlit lyrics (5.8:1). Faded copper is for borders and icons only (3.9:1, never text).

Ruby is the record light, and only that: the tapped word, the saved dot, primary buttons, the selected tab. Never ruby text on mahogany (2.2:1).

Paper light swaps the ground to chiffon, text to mahogany, labels to ruby (6.3:1) and dim text to paper-dim (6.7:1).

## Typography

One family, Manrope, self-hosted. Lyrics are the largest running text (18/32, weight 600 when lit, 500 when dim). Syllable counts and take numbers use tabular figures. Sentence case everywhere; no all-caps labels, no labels above headings.

## Layout

Single column at 390 px. 20–24 px side margins for lists and dim sections; the lamp card insets to 12 px so it reads as lifted. Lyric rows are a three-column grid: 28 px rhyme letter, text, 28 px syllable count. Touch targets at least 44 px.

## Responsive

Phone is the reference design (390 px); everything above it is that same world using the room it's been given, never just a wider gutter around an unchanged phone screen.

- **< 768 px (phone):** the baseline above. Overlay sheets, a single stacked list, bottom tab bar.
- **768–1023 px (tablet):** the phone-shaped screen, centred, with a soft drop shadow (`0 0 60px` mahogany-black at 50%) so it reads as a lit object on a bigger surface rather than a stretched app. Nothing reflows yet.
- **≥ 1024 px (desktop):** a screen with two logical parts — something you pick or type plus its result — becomes a real two-column layout instead of staying centred. A screen that's one linear task stays one column; give it room, not a split. The page itself grows with the window (`min(1600px, 94vw)`) on screens whose content can actually use it (Rhymes, Songs list) — a fixed 1100px cap left a visibly empty band on anything wider than a laptop, which looked unfinished rather than considered. Anything that would otherwise float disconnected in that reclaimed space (a status readout, a stray label) gets an explicit position near what it's about, not left to auto-placement.
  - **Rhymes** (built, the reference case): word field in a left column, a permanent rhyme panel beside it (no overlay, no scrim, no close button); the rhyme list itself reflows from a single column into a word grid (`repeat(auto-fill, minmax(240px, 1fr))`) — more columns as the window grows, not more empty margin.
  - **Songs list:** the "continue" lamp card stays full width at the top of the content column — it's the one lit thing on the screen, splitting it would fight the lamp-card rule. "Earlier" reflows from a thin row list into a card grid (`repeat(auto-fill, minmax(280px, 1fr))`), each card carrying the same title / first line / section count / date a row carries now.
  - **Lyric editor:** stays one column — long lyric text needs a steady reading measure, and splitting the page defeats the point of an editor. Widen the max content width modestly (480 px → about 640 px) with more side padding, so it reads as a considered page rather than a narrow phone column adrift in a big window. Section action buttons may sit a little tighter since a mouse doesn't need the full 44 px, but never below it.
  - **Tap-to-rhyme (FR-23), inside the editor:** on phone/tablet, the usual bottom sheet. From 1024 px it becomes a centred modal dialog (640 px wide, rounded on all four corners, no drag grabber) instead of the same narrow bottom-sheet card just floating mid-screen — the editor has no second column to dock a side panel into, unlike Rhymes' own permanent panel, so a dialog is the honest desktop shape for a one-off lookup. Triggered by double-click (or double-tap), not a single click/tap — a single click has to stay a plain caret placement, or normal editing breaks.
  - **Settings:** two columns at desktop — appearance (theme) on the left, size and behaviour (text size, lyric mode, hide explicit) on the right, grouped by what they affect, not split arbitrarily to fill space.
  - **Mix help:** two columns at desktop, same grouping principle as Settings — reference material you look up (the loudness table, EQ guide, delivery checklist) on the left, the two things you work through or search (the song-specific before-mastering checklist, the FAQ) on the right. The page widens to 880 px. The FAQ (the one row that can run long once expanded) shares a grid row with Delivery rather than EQ, so its extra height becomes trailing space at the bottom of the shorter column instead of a gap partway down it. Phone and tablet keep the artboard's single-column row order (EQ, Before mastering, Delivery, Q&A) unchanged.
  - **Tab bar:** stays docked at the bottom at every width, on every screen. This is deliberate, not an unfinished desktop nav — the Overview's "standard phone patterns" is the identity, expressed through palette/type/density, not swapped out for desktop chrome (a sidebar, a top menu bar) once there's room for one.
- **Hover:** every hover state sits behind `(hover: hover) and (pointer: fine)` so touch devices never get a stuck `:hover` state. A tablet in tablet mode gets none; a desktop with a mouse gets all of them.

## Elevation & Depth

Two levels only. The lamp card and sheets: a soft radial light from the top (fawn at about 16%) over lamp-lit, a neutral dark drop shadow (0 14px 36px, mahogany-black at 60%) and a faint top highlight. Everything else is flat. No coloured glows.

## Shapes

Radii grow with size: 6 px badges, 12 px controls, 14 px primary buttons, 20 px cards, 26 px sheet tops, full pills for rhyme chips. Rhyme families are encoded by letter plus line style: dotted for slant, solid for perfect, dashed badge border for a second dim family.

## Components

- **Lamp card**: the one focused thing on a screen (active section, last song, selected take, loudness table). One per screen.
- **Rhyme chip**: outlined pill; slant chips use a dotted fawn border and a small "slant" word.
- **Rhyme sheet**: bottom sheet over a dimmed screen; tabs Perfect / Slant / Phrase, each result has word, type and a plain reason.
- **Tab bar**: four tabs (Songs, Rhymes, Mix help, Settings) on booth-dark; active tab fawn and bold.
- **Switch**: ruby track when on, chiffon knob.
- **Grammar flag**: copper wavy underline, never ruby.
- **Checkbox**: 22×22, 6px radius (the badge token), copper border; checked fills ruby with a lemon-chiffon checkmark (the fixed off-white token, not the `chiffon` role - it must stay light on ruby in both themes).
- **Progress fill**: a 4px rounded track (faded copper at low opacity), ruby fill - Mix help's before-mastering checklist is the first use, under its disclosure-row subtitle.
- **Scrollbar**: a copper pill inset from a booth-dark track (both swap with the theme), not the OS default - styled once, globally.

## Do's and Don'ts

- Do keep one lamp per screen. Don't light two things.
- Do use ruby only for record-light moments. Don't use it for decoration or text on dark.
- Do pair every colour cue with a letter, line style or word. Don't encode rhyme families by colour alone.
- Don't add glows, gradient text, eyebrow labels, or emoji icons.

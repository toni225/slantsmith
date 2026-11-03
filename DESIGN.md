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

## Do's and Don'ts

- Do keep one lamp per screen. Don't light two things.
- Do use ruby only for record-light moments. Don't use it for decoration or text on dark.
- Do pair every colour cue with a letter, line style or word. Don't encode rhyme families by colour alone.
- Don't add glows, gradient text, eyebrow labels, or emoji icons.

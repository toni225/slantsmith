// FR-09/FR-10: grammar checker. Rule-based, not a full English spellchecker or parser
// (ADR-03's offline/no-dependency constraint), tuned against test/slantsmith_grammar_test_set.csv.
//
// shortcut: spelling catches only the curated MISSPELLINGS list below, not arbitrary typos.
// A blocklist (flag only known-bad spellings) means lyric slang and dropped-g forms are never
// flagged, without needing src/app/songs' lyric_allowlist.txt or a dropped-g check at all -
// upgrade to a lexicon-based unknown-word + edit-distance checker (using those files to avoid
// false positives) if users report real typos going uncaught.
//
// shortcut: FR-10's lyric-mode exemptions (fragments, missing punctuation, dropped letters,
// ain't, double negatives, lowercase line starts, repeats-for-effect) need no active handling -
// none of the rules below check for them in the first place, so there's nothing to suppress.
// There is no "strict mode" to fall back to either; lyricModeDefault stays unused here.

export interface GrammarFlag {
  rule: string;
  start: number;
  end: number;
  word: string;
  suggestion: string;
  /** Stable id for this issue (rule + wrong word), used for ignore-in-song / personal dictionary. */
  key: string;
}

interface Token { text: string; lower: string; start: number; end: number }

const WORD_RE = /[A-Za-z']+/g;

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  for (const m of line.matchAll(WORD_RE)) {
    tokens.push({ text: m[0], lower: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

function flag(rule: string, t: Token, suggestion: string): GrammarFlag {
  return { rule, start: t.start, end: t.end, word: t.text, suggestion, key: `${rule}|${t.lower}` };
}

// --- spelling: curated list of common lyric-writing misspellings (test/slantsmith_grammar_test_set.csv "spelling" group) ---
const MISSPELLINGS: Record<string, string> = {
  recieve: 'receive', definately: 'definitely', seperate: 'separate', untill: 'until',
  tommorow: 'tomorrow', beleive: 'believe', wierd: 'weird', alot: 'a lot', occured: 'occurred',
  neccessary: 'necessary', begining: 'beginning', freind: 'friend', truely: 'truly', wich: 'which',
  becuase: 'because', embarass: 'embarrass', calender: 'calendar', rythm: 'rhythm', accross: 'across',
  realy: 'really', finaly: 'finally', remeber: 'remember', beautifull: 'beautiful', heartbrake: 'heartbreak',
  dissapear: 'disappear',
};

function checkSpelling(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (const t of tokens) {
    const fix = MISSPELLINGS[t.lower];
    if (fix) out.push(flag('spelling', t, fix));
  }
  return out;
}

// --- doubled small words: tools/data/doubled_word_rule.json ---
const DOUBLED_FLAG_WORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'from', 'with', 'by', 'into',
  'and', 'or', 'but', 'nor', 'is', 'are', 'was', 'were', 'be', 'been', 'am',
  'will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'must',
]);

function checkDoubled(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const a = tokens[i - 1], b = tokens[i];
    if (a.lower === b.lower && DOUBLED_FLAG_WORDS.has(b.lower)) {
      out.push({ rule: 'doubled', start: b.start, end: b.end, word: b.text, suggestion: '', key: `doubled|${b.lower}` });
    }
  }
  return out;
}

// --- lowercase "i": standalone "i", or "i" leading a contraction like "i'm"/"i've" ---
function checkLowercaseI(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (const t of tokens) {
    if (t.text === 'i' || /^i'/.test(t.text)) {
      out.push({ rule: 'lowercase_i', start: t.start, end: t.start + 1, word: 'i', suggestion: 'I', key: 'lowercase_i|i' });
    }
  }
  return out;
}

// --- a/an by sound: letter-based default, overridden by small silent-h / y-glide exception lists ---
// Vowel letter but consonant sound (needs "a"): unicorn, one-way, European, etc.
const CONSONANT_SOUND = new Set(['one', 'once', 'unicorn', 'unicycle', 'union', 'unique', 'unit', 'united', 'university', 'usual', 'useful', 'use', 'used', 'user', 'uniform', 'european', 'europe']);
// Consonant letter but vowel sound (needs "an"): silent h.
const VOWEL_SOUND = new Set(['hour', 'hours', 'honest', 'honestly', 'honor', 'honour', 'honorable', 'heir', 'herb']);

function wantsAn(word: string): boolean {
  const bare = word.split('-')[0].toLowerCase();
  if (CONSONANT_SOUND.has(bare)) return false;
  if (VOWEL_SOUND.has(bare)) return true;
  return /^[aeiou]/i.test(bare);
}

function checkAAn(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const article = tokens[i];
    if (article.lower !== 'a' && article.lower !== 'an') continue;
    const next = tokens[i + 1];
    const an = wantsAn(next.text);
    if (an && article.lower === 'a') out.push(flag('a_an', article, 'an'));
    else if (!an && article.lower === 'an') out.push(flag('a_an', article, 'a'));
  }
  return out;
}

// --- confusables: each pair/triple decided by what word follows (or, for then/than, precedes) ---

// Words that cannot directly follow a possessive determiner (your/their/its) - a strong signal
// the writer meant the contraction (you're/they're/it's) instead. Covers articles/determiners
// (can't say "your my book"), common adverbs/auxiliaries, and -ing verbs.
const CONTRACTION_SIGNAL = new Set([
  'a', 'an', 'the', 'my', 'our', 'his', 'her', 'their', 'its', 'this', 'that', 'these', 'those',
  'never', 'always', 'just', 'still', 'already', 'finally', 'so', 'too', 'not', 'really',
  'probably', 'definitely', 'going', 'gonna', 'here', 'there', 'been', 'over',
  'is', 'was', 'are', 'were',
]);
function nextSignalsContraction(next: string | undefined): boolean {
  if (!next) return false;
  return CONTRACTION_SIGNAL.has(next) || next.endsWith('ing');
}

function checkYourYoure(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'your' && t.lower !== "you're") continue;
    const want = nextSignalsContraction(tokens[i + 1]?.lower) ? "you're" : 'your';
    if (t.lower !== want) out.push(flag('confusable', t, want));
  }
  return out;
}

function checkItsIts(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'its' && t.lower !== "it's") continue;
    const want = nextSignalsContraction(tokens[i + 1]?.lower) ? "it's" : 'its';
    if (t.lower !== want) out.push(flag('confusable', t, want));
  }
  return out;
}

// their/there/they're is three-way: a following noun wants "their" (possessive), a following
// verb/adverb wants "they're" (contraction), "is"/"was"/end-of-line wants "there" (existential/location).
function checkTheirThereTheyre(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!['their', 'there', "they're"].includes(t.lower)) continue;
    const next = tokens[i + 1]?.lower;
    let want: string;
    if (!next || next === 'is' || next === 'was' || next === 'are' || next === 'were') want = 'there';
    else if (nextSignalsContraction(next)) want = "they're";
    else want = 'their';
    if (t.lower !== want) out.push(flag('confusable', t, want));
  }
  return out;
}

// then/than: a comparative marker (more/rather/better/-er word) within 3 words before wants "than";
// otherwise (sequence, "and then...") wants "then".
const COMPARATIVE_MARKERS = new Set(['more', 'most', 'rather', 'better', 'worse', 'less', 'other', 'further']);
function checkThenThan(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'then' && t.lower !== 'than') continue;
    const window = tokens.slice(Math.max(0, i - 3), i).map((w) => w.lower);
    const comparative = window.some((w) => COMPARATIVE_MARKERS.has(w) || w.endsWith('er'));
    const want = comparative ? 'than' : 'then';
    if (t.lower !== want) out.push(flag('confusable', t, want));
  }
  return out;
}

// lose/loose: "to lose" (infinitive) is the verb; a subject pronoun/modal right before "lose" also
// keeps it a verb. Anything else before "lose" (a linking verb, a noun) means "loose" was meant.
const LOSE_VERB_BEFORE = new Set(['to', 'i', 'you', 'we', 'they', 'he', 'she', 'it', "don't", "won't", "can't", 'never', 'always', 'just', 'still', 'will', 'would', 'could', 'should', 'might', 'must', 'may', 'gonna']);
function checkLoseLoose(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'lose' && t.lower !== 'loose') continue;
    const before = tokens[i - 1]?.lower;
    if (before === 'to') { if (t.lower !== 'lose') out.push(flag('confusable', t, 'lose')); continue; }
    if (t.lower === 'lose' && !LOSE_VERB_BEFORE.has(before ?? '')) out.push(flag('confusable', t, 'loose'));
  }
  return out;
}

// affect/effect: a subject pronoun before wants the verb "affect"; a determiner/quantifier before
// wants the noun "effect".
const AFFECT_VERB_BEFORE = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they']);
const EFFECT_NOUN_BEFORE = new Set(['a', 'an', 'the', 'no', 'some', 'any', 'this', 'that', 'its', 'their', 'your', 'my', 'our', 'his', 'her']);
function checkAffectEffect(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'affect' && t.lower !== 'effect') continue;
    const before = tokens[i - 1]?.lower ?? '';
    if (AFFECT_VERB_BEFORE.has(before) && t.lower !== 'affect') out.push(flag('confusable', t, 'affect'));
    else if (EFFECT_NOUN_BEFORE.has(before) && t.lower !== 'effect') out.push(flag('confusable', t, 'effect'));
  }
  return out;
}

// to/too: "too" is meant when "to" sits before a common intensifiable adjective, or ends the line.
const TOO_ADJECTIVES = new Set(['late', 'much', 'many', 'far', 'close', 'long', 'hard', 'easy', 'loud', 'soft', 'slow', 'fast', 'young', 'old', 'big', 'small', 'short', 'tired', 'busy', 'bad', 'good', 'high', 'low', 'deep', 'hot', 'cold', 'dark', 'bright', 'quiet', 'tight', 'loose', 'heavy', 'light']);
function checkToToo(tokens: Token[]): GrammarFlag[] {
  const out: GrammarFlag[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.lower !== 'to') continue;
    const next = tokens[i + 1]?.lower;
    if (!next || TOO_ADJECTIVES.has(next)) out.push(flag('confusable', t, 'too'));
  }
  return out;
}

/** FR-09/FR-10: check one line, returning flags in left-to-right order. */
export function checkLine(line: string): GrammarFlag[] {
  const tokens = tokenize(line);
  return [
    ...checkSpelling(tokens),
    ...checkDoubled(tokens),
    ...checkLowercaseI(tokens),
    ...checkAAn(tokens),
    ...checkYourYoure(tokens),
    ...checkItsIts(tokens),
    ...checkTheirThereTheyre(tokens),
    ...checkThenThan(tokens),
    ...checkLoseLoose(tokens),
    ...checkAffectEffect(tokens),
    ...checkToToo(tokens),
  ].sort((a, b) => a.start - b.start);
}

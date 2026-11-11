"""Predict pronunciations for dictionary words the CMU dictionary lacks.

Usage: python3 tools/estimate_pronunciations.py   (needs: pip install wordfreq g2p_en)
Output: tools/data/estimated.dict (CMU format), read by build_word_model.py and committed,
so the model build itself never needs g2p_en.

Most words are built from real CMU entries: walk + -ing, un- + broken, heart + strings.
g2p_en (a small letter-to-sound model trained on CMU) predicts whatever is left.
"""
import re, sys
from wordfreq import iter_wordlist, zipf_frequency
from build_word_model import DATA, SOUNDS, WORD_RE, dictionary_words, load_dict, load_word_types, word_list

SIBILANT = {"S", "Z", "SH", "ZH", "CH", "JH"}
VOICELESS = {"P", "T", "K", "F", "TH", "S", "SH", "CH"}
VOWELS = {"AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"}


def bare(p):
    return p.rstrip("012")


def s_end(p):
    return ["IH0", "Z"] if bare(p[-1]) in SIBILANT else ["S"] if bare(p[-1]) in VOICELESS else ["Z"]


def ed_end(p):
    return ["IH0", "D"] if bare(p[-1]) in ("T", "D") else ["T"] if bare(p[-1]) in VOICELESS else ["D"]


def ly_end(p):
    return ["IY0"] if bare(p[-1]) == "L" else ["L", "IY0"]  # abnormal+ly has one L sound


# (spelling, starts with a vowel letter, phones to add). Only affixes that don't move the stress,
# measured by check(): -y, -ist, -ism, -ize and re- often do (academy, cubism, resistor), so g2p_en
# gets those. Prefixes that take the main stress in CMU (over-, out-, under-) are real words, so the
# compound rule handles them the CMU way.
SUFFIXES = sorted([
    ("s", False, s_end), ("es", True, s_end), ("ed", True, ed_end), ("ing", True, "IH0 NG"),
    ("er", True, "ER0"), ("est", True, "AH0 S T"), ("ly", False, ly_end), ("ness", False, "N AH0 S"),
    ("less", False, "L AH0 S"), ("ful", False, "F AH0 L"), ("ment", False, "M AH0 N T"),
    ("ish", True, "IH0 SH"), ("able", True, "AH0 B AH0 L"), ("hood", False, "HH UH2 D"),
    ("ship", False, "SH IH2 P"), ("like", False, "L AY2 K"), ("wise", False, "W AY2 Z"),
    ("ward", False, "W ER0 D"), ("dom", False, "D AH0 M"), ("some", False, "S AH0 M"), ("ette", True, "EH1 T"),
], key=lambda s: -len(s[0]))

PREFIXES = sorted([
    ("un", "AH0 N"), ("mis", "M IH0 S"), ("dis", "D IH0 S"), ("non", "N AA2 N"), ("pre", "P R IY0"),
    # Added 2026-11-11: each keeps CMU's rhyme for 87%+ of CMU's own words. Tried and left to g2p_en
    # (under 85%): anti-, sub-, super-, micro-, co-, de-, in-, -y, -ist, -ism, -al, -ic, -ity, -ous, -ive.
    ("re", "R IY0"), ("ex", "EH2 K S"), ("em", "EH0 M"), ("il", "IH0 L"), ("ir", "IH0 R"), ("semi", "S EH2 M IY0"),
    ("trans", "T R AE0 N Z"), ("ultra", "AH2 L T R AH0"), ("extra", "EH2 K S T R AH0"),
], key=lambda p: -len(p[0]))


def stems(stem, vowel_suffix):
    """Spellings the base word may have had: walk(ing), mak(e)ing, run(n)ing, happ(y)->happi(ness)."""
    out = [stem]
    if stem.endswith("i"):
        out.append(stem[:-1] + "y")
    if vowel_suffix:
        doubled = len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "aeiou"
        # A single consonant before -ed/-ing/-er means the base had a silent e: dined = dine + d,
        # dinned = din + ed. Same after s, c, g, v, z (cursing = curse, not curs). So try the e-form
        # first there; elsewhere (modernest, visited) the plain stem comes first.
        silent_e = not doubled and len(stem) > 1 and stem[-1] not in "aeiouwxy" and (stem[-2] in "aeiouy" or stem[-1] in "scgvz")
        out.insert(0, stem + "e") if silent_e else out.append(stem + "e")
        if doubled:
            out.append(stem[:-1])
    return out


# British spellings of words CMU lists the American way. The respelled word must be a real CMU entry.
BRITISH = [(r"is(?=e|ing|ation|abl)", "iz"), (r"ys(?=e|ing)", "yz"), ("our", "or"), ("re$", "er"), ("ence", "ense")]


def respell(w, cmu):
    """A spelling CMU does list for the same word: colour -> color, realise -> realize, dont -> don't."""
    for pat, sub in BRITISH:
        for m in re.finditer(pat, w):
            if (v := w[: m.start()] + sub + w[m.end():]) in cmu:
                return v
    for i in range(1, len(w)):
        if (v := w[:i] + "'" + w[i:]) in cmu:
            return v
    return None


def demote(p):
    return [x[:-1] + "2" if x.endswith("1") else x for x in p]


class Deriver:
    def __init__(self, cmu, dictionary):
        self.cmu = cmu
        # Parts must be dictionary words: CMU is full of names ("abus", "ach") that make bad bases.
        self.real = {w for w in cmu if w in dictionary}
        # Compound parts: 4+ letters and common, so "heartstrings" splits but "psychotic" doesn't.
        self.common = {w for w in self.real if len(w) >= 4 and zipf_frequency(w, "en") >= 4}

    def derive(self, w, depth=0):
        """Phones for w built from CMU entries, or None. Never uses w's own entry (depth 0)."""
        if depth and w in self.real:
            return self.cmu[w]
        if depth == 3:
            return None
        for suf, vowel_suffix, add in SUFFIXES:
            if w.endswith(suf):
                for base in stems(w[: -len(suf)], vowel_suffix):
                    if len(base) >= 3 and (p := self.derive(base, depth + 1)):
                        return p + (add(p) if callable(add) else add.split())
        for pre, ph in PREFIXES:
            if w.startswith(pre) and len(w) - len(pre) >= 3 and (p := self.derive(w[len(pre):], depth + 1)):
                pre_ph = ph.split()
                return (pre_ph[:-1] if pre_ph[-1] == p[0] else pre_ph) + p  # il + legal has one L sound
        for i in range(len(w) - 4, 3, -1):
            if w[:i] in self.common and w[i:] in self.common:
                return self.cmu[w[:i]] + demote(self.cmu[w[i:]])
        return None


def rhyme_start(p):
    """Index of the last stressed vowel: where the rhyme part starts."""
    stress = [int(x[-1]) if x[-1].isdigit() else -1 for x in p]
    i = max((j for j, s in enumerate(stress) if s == 1), default=None)
    return i if i is not None else max((j for j, s in enumerate(stress) if s == 2), default=0)


def rhyme_key(p):
    """Same rhyme part the engine uses (src/engines/rhyme.ts split()): last stressed vowel onward."""
    stress = [int(x[-1]) if x[-1].isdigit() else -1 for x in p]
    i = rhyme_start(p)
    return " ".join(["AA" if bare(p[i]) == "AO" else bare(p[i])] + ["AH" if s == 0 else bare(x) for x, s in zip(p[i + 1:], stress[i + 1:])])


class Analogy:
    """Rhyme by look-alike endings: words spelled -ography almost all rhyme with photography.
    For a word g2p_en had to guess, take the longest ending (3-10 letters) that at least MIN CMU words
    share and SHARE of them rhyme the same way, and give the word that rhyme. Measured by leaving each
    CMU word out and predicting it from the rest (check_analogy): right ~92% of the time where it
    applies, against 47% for g2p_en alone on the one set that can grade it (British spellings)."""
    MIN, SHARE, LONGEST = 3, 0.9, 10

    def __init__(self, cmu):
        self.keys, self.tails = {}, {}
        for w, p in cmu.items():
            if not w.isalpha():
                continue
            k, tail = rhyme_key(p), tuple(p[rhyme_start(p):])
            for n in range(3, min(len(w), self.LONGEST) + 1):
                self.keys.setdefault(w[-n:], {}).setdefault(k, 0)
                self.keys[w[-n:]][k] += 1
                t = self.tails.setdefault((w[-n:], k), {})
                t[tail] = t.get(tail, 0) + 1

    def tail(self, w, leave_out=None):
        """(phones of the rhyme part w most likely has, how many end letters spell it), or None when
        its ending is rare or disputed. The ending must start with a vowel letter, so the stressed vowel
        is inside it: -ntured would hand "jointured" the EH of ventured."""
        for n in range(min(len(w) - 1, self.LONGEST), 2, -1):
            if w[-n] not in "aeiouy":
                continue
            counts = dict(self.keys.get(w[-n:], {}))
            if leave_out in counts:
                counts[leave_out] -= 1
            total = sum(counts.values())
            if total >= self.MIN:
                k = max(sorted(counts), key=counts.get)
                if counts[k] / total >= self.SHARE:
                    t = self.tails[(w[-n:], k)]
                    return list(max(sorted(t), key=t.get)), n
        return None

    def fix(self, w, guess):
        """guess with its rhyme part replaced by the look-alike one, when they differ."""
        found = self.tail(w)
        if found is None or rhyme_key(found[0]) == rhyme_key(guess):
            return guess
        tail = found[0]
        vowels = [i for i, x in enumerate(guess) if bare(x) in VOWELS]
        need = sum(bare(x) in VOWELS for x in tail)
        before = len(re.findall("[aeiouy]+", w)) - need  # syllables the spelling shows before the rhyme part
        # Keep that many syllables of the guess; if the guess is too short for that, let the tail
        # replace as many of its last syllables as the tail has.
        cut = vowels[before] if 0 <= before < len(vowels) else vowels[-need] if need <= len(vowels) else vowels[0] if vowels else 0
        return demote(guess[:cut]) + tail


def check_analogy(analogy, deriver):
    """Leave each CMU word out, predict its rhyme from the others. Graded on dictionary words the
    word-building rules cannot make: the same kind of word g2p_en has to guess."""
    pool = sorted(w for w in deriver.real if w.isalpha() and len(w) >= 6)[::8]
    tried = right = 0
    for w in pool:
        if deriver.derive(w) is None and (t := analogy.tail(w, rhyme_key(deriver.cmu[w]))):
            tried += 1
            right += rhyme_key(t[0]) == rhyme_key(deriver.cmu[w])
    print(f"look-alike endings: {right}/{tried} ({right / tried:.1%}) of left-out CMU words get CMU's own rhyme")
    assert right / tried >= 0.89, "look-alike rule got worse; fix it before regenerating"
    assert rhyme_key(analogy.tail("xylography")[0]) == rhyme_key(deriver.cmu["photography"])
    fixed = analogy.fix("polygenesis", "P AA2 L IY0 G EH1 N S IY0 Z".split())  # a real g2p_en guess
    assert fixed[:4] == ["P", "AA2", "L", "IY0"] and fixed[-3:] == ["S", "AH0", "S"], fixed  # keeps its start, fixes its end


def check(deriver):
    """Self-check: rebuild CMU's own words from their parts; the rhyme part must match CMU's real one."""
    tried = right = 0
    for w in deriver.real:
        p = deriver.cmu[w]
        if (d := deriver.derive(w)) is not None:
            tried += 1
            right += rhyme_key(d) == rhyme_key(p)
    print(f"self-check: {right}/{tried} derived CMU words ({right / tried:.1%}) get CMU's own rhyme")
    assert right / tried >= 0.90, "word-building rules got worse; fix them before regenerating"
    assert deriver.derive("walking") == ["W", "AO1", "K", "IH0", "NG"]
    assert deriver.derive("heartstrings")[-1] == "Z"
    assert deriver.derive("dined") == ["D", "AY1", "N", "D"] and deriver.derive("dinned") == ["D", "IH1", "N", "D"]
    assert respell("colonisation", deriver.cmu) == "colonization" and respell("colour", {"color"}) == "color"
    assert respell("aint", deriver.cmu) == "ain't"


def main():
    cmu = load_dict(DATA / "cmudict.dict")
    dictionary = dictionary_words(load_word_types())
    deriver = Deriver(dict(cmu), dictionary)
    check(deriver)
    analogy = Analogy(cmu)
    check_analogy(analogy, deriver)
    drop = word_list(DATA / "misspelling_blocklist.txt") | word_list(DATA / "slur_blocklist.txt")
    # Dictionary words, plus words people actually write (names, slang, "dont") that no dictionary lists.
    # shortcut: zipf >= 2.5 and 3+ letters keeps most abbreviations/typos out; lower it for more names/slang.
    common = {w for w in iter_wordlist("en") if len(w) >= 3 and re.search("[aeiouy]", w) and zipf_frequency(w, "en") >= 2.5}
    # Rarer written words (zipf 1.5-2.5) are mostly names, foreign words and typos, so they only get in
    # when they can be built from known words (bassline, firetruck, rantings): never on a g2p_en guess.
    rare = {w for w in iter_wordlist("en") if len(w) >= 3 and 1.5 <= zipf_frequency(w, "en") < 2.5} - dictionary - common
    todo = sorted(w for w in dictionary | common | rare if w not in cmu and w not in drop and WORD_RE.fullmatch(w))

    from g2p_en import G2p  # build-time only
    g2p = G2p()
    out, guessed, respelled, fixed = {}, 0, 0, 0
    # Shortest first, and each new word becomes a base: "cartographers" = guessed "cartographer" + s,
    # so a plural always rhymes like its singular.
    for w in sorted(todo, key=lambda w: (len(w), w)):
        p = cmu[v] if (v := respell(w, cmu)) else deriver.derive(w)
        respelled += v is not None
        if p is None and w in rare:
            continue
        if p is None:
            guessed += 1
            guess = [x for x in g2p.predict(w) if bare(x) in SOUNDS]
            p = analogy.fix(w, guess) if w.isalpha() and guess else guess
            fixed += p != guess
        if any(bare(x) in VOWELS for x in p):
            out[w] = deriver.cmu[w] = p
            deriver.real.add(w)

    lines = ["# Estimated pronunciations for dictionary words missing from cmudict.dict.",
             "# Generated by tools/estimate_pronunciations.py; do not edit by hand."]
    lines += [f"{w} {' '.join(out[w])}" for w in sorted(out)]
    (DATA / "estimated.dict").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(out)} words: {respelled} respelled to a CMU entry, {len(out) - guessed - respelled} built from known words, "
          f"{guessed} predicted by g2p_en ({fixed} of them given the rhyme of look-alike words); {len(todo) - len(out)} left out (rare and not buildable, or no vowel)")


if __name__ == "__main__":
    sys.exit(main())

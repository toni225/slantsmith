"""Predict pronunciations for dictionary words the CMU dictionary lacks.

Usage: python3 tools/estimate_pronunciations.py   (needs: pip install wordfreq g2p_en)
Output: tools/data/estimated.dict (CMU format), read by build_word_model.py and committed,
so the model build itself never needs g2p_en.

Most words are built from real CMU entries: walk + -ing, un- + broken, heart + strings.
g2p_en (a small letter-to-sound model trained on CMU) predicts whatever is left.
"""
import sys
from wordfreq import zipf_frequency
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
    ("ward", False, "W ER0 D"),
], key=lambda s: -len(s[0]))

PREFIXES = sorted([
    ("un", "AH0 N"), ("mis", "M IH0 S"), ("dis", "D IH0 S"), ("non", "N AA2 N"), ("pre", "P R IY0"),
], key=lambda p: -len(p[0]))


def stems(stem, vowel_suffix):
    """Spellings the base word may have had: walk(ing), mak(e)ing, run(n)ing, happ(y)->happi(ness)."""
    out = [stem]
    if stem.endswith("i"):
        out.append(stem[:-1] + "y")
    if vowel_suffix:
        out.append(stem + "e")
        if len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "aeiou":
            out.append(stem[:-1])
    return out


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
                return ph.split() + p
        for i in range(len(w) - 4, 3, -1):
            if w[:i] in self.common and w[i:] in self.common:
                return self.cmu[w[:i]] + demote(self.cmu[w[i:]])
        return None


def rhyme_key(p):
    """Same rhyme part the engine uses (src/engines/rhyme.ts split()): last stressed vowel onward."""
    stress = [int(x[-1]) if x[-1].isdigit() else -1 for x in p]
    i = max((j for j, s in enumerate(stress) if s == 1), default=None)
    if i is None:
        i = max((j for j, s in enumerate(stress) if s == 2), default=0)
    return " ".join(["AA" if bare(p[i]) == "AO" else bare(p[i])] + ["AH" if s == 0 else bare(x) for x, s in zip(p[i + 1:], stress[i + 1:])])


def check(deriver):
    """Self-check: rebuild CMU's own words from their parts; the rhyme part must match CMU's real one."""
    tried = right = 0
    for w in deriver.real:
        p = deriver.cmu[w]
        if (d := deriver.derive(w)) is not None:
            tried += 1
            right += rhyme_key(d) == rhyme_key(p)
    print(f"self-check: {right}/{tried} derived CMU words ({right / tried:.1%}) get CMU's own rhyme")
    assert right / tried >= 0.88, "word-building rules got worse; fix them before regenerating"
    assert deriver.derive("walking") == ["W", "AO1", "K", "IH0", "NG"]
    assert deriver.derive("heartstrings")[-1] == "Z"


def main():
    cmu = load_dict(DATA / "cmudict.dict")
    dictionary = dictionary_words(load_word_types())
    deriver = Deriver(dict(cmu), dictionary)
    check(deriver)
    drop = word_list(DATA / "misspelling_blocklist.txt") | word_list(DATA / "slur_blocklist.txt")
    todo = sorted(w for w in dictionary if w not in cmu and w not in drop and WORD_RE.fullmatch(w))

    from g2p_en import G2p  # build-time only
    g2p = G2p()
    out, guessed = {}, 0
    # Shortest first, and each new word becomes a base: "cartographers" = guessed "cartographer" + s,
    # so a plural always rhymes like its singular.
    for w in sorted(todo, key=lambda w: (len(w), w)):
        p = deriver.derive(w)
        if p is None:
            guessed += 1
            p = [x for x in g2p.predict(w) if bare(x) in SOUNDS]
        if any(bare(x) in VOWELS for x in p):
            out[w] = deriver.cmu[w] = p
            deriver.real.add(w)

    lines = ["# Estimated pronunciations for dictionary words missing from cmudict.dict.",
             "# Generated by tools/estimate_pronunciations.py; do not edit by hand."]
    lines += [f"{w} {' '.join(out[w])}" for w in sorted(out)]
    (DATA / "estimated.dict").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(todo)} words: {len(todo) - guessed} built from known words, {guessed} predicted by g2p_en, "
          f"{len(todo) - len(out)} skipped (no vowel)")


if __name__ == "__main__":
    sys.exit(main())

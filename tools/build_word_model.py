"""Build the en-us word model: every dictionary word, plus every common word the CMU dictionary knows.

Usage: python3 tools/build_word_model.py   (needs: pip install wordfreq)
Output: src/assets/model/en-us/{lexicon.txt,phones.bin,meta.bin,commonness.bin,manifest.json}
Pronunciations come from the CMU dictionary, or from tools/data/estimated.dict (made by
tools/estimate_pronunciations.py) for dictionary words CMU lacks; those are flagged estimated.
Same inputs give byte-identical files.
"""
import gzip, hashlib, html, json, re, sys, urllib.request
from pathlib import Path
from wordfreq import iter_wordlist, zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "data"
OUT = ROOT / "src" / "assets" / "model" / "en-us"

# ARPAbet; order is part of the format: sound id = index.
SOUNDS = "AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M N NG OW OY P R S SH T TH UH UW V W Y Z ZH".split()
SID = {s: i for i, s in enumerate(SOUNDS)}
FLAG_EXPLICIT = 1 << 4
FLAG_FUNCTION = 1 << 5  # closed-class word, see FUNCTION_WORDS
FLAG_ESTIMATED = 1 << 6  # pronunciation predicted, not from the CMU dictionary
# bits 0-3: word-type bitmask (noun/verb/adjective/adverb), from Open English WordNet
TYPE_BIT = {"n": 1, "v": 2, "a": 4, "s": 4, "r": 8}  # 's' = satellite adjective, folds into adjective
WORD_RE = re.compile(r"[a-z']+")

WORDNET_URL = "https://en-word.net/downloads/english-wordnet-2025.xml.gz"
WORDNET_GZ = DATA / "wordnet" / "english-wordnet-2025.xml.gz"
LEMMA_RE = re.compile(r'<Lemma writtenForm="([^"]*)" partOfSpeech="([nvasr])"\s*/?>')
# ENABLE: public-domain English word list (172,823 words, inflected forms included), pinned to a commit.
ENABLE_URL = "https://raw.githubusercontent.com/dolph/dictionary/233d25a56b9ac8bef906916ccf091a976995cce0/enable1.txt"
ENABLE_TXT = DATA / "enable" / "enable1.txt"
ENABLE_SHA256 = "3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89"

# WordNet only tags base/lemma forms ("walk", not "walking" or "walked"), so a direct
# lookup alone misses most inflected words. These are WordNet's own documented
# morphological-exception suffix rules (the same ones its "morphy" lookup uses) - strip
# the suffix, check the result against that same part of speech's lemma set.
POS_SUFFIXES = {
    "n": [("s", ""), ("ses", "s"), ("ves", "f"), ("xes", "x"), ("zes", "z"), ("ches", "ch"), ("shes", "sh"), ("men", "man"), ("ies", "y")],
    "v": [("s", ""), ("ies", "y"), ("es", "e"), ("es", ""), ("ed", "e"), ("ed", ""), ("ing", "e"), ("ing", "")],
    "a": [("er", ""), ("est", ""), ("er", "e"), ("est", "e")],
    "s": [("er", ""), ("est", ""), ("er", "e"), ("est", "e")],
    "r": [],
}

# Small, closed-class list: pronouns, prepositions, conjunctions, determiners, auxiliaries/modals,
# and particles. WordNet doesn't tag these usefully as a "type" for a rhyme filter.
FUNCTION_WORDS = set("""
    i you he she it we they me him her us them this that these those who whom whose which what
    my your his its our their mine yours hers ours theirs myself yourself himself herself itself
    ourselves yourselves themselves
    in on at by for with about against between into through during before after above below to
    from up down over under again further out off of
    and but or nor so yet although because if while unless since
    a an the some any no every each either neither all both few many much most other another such
    am is are was were be been being have has had do does did will would shall should may might
    must can could
    not as than then there here very too also just only
""".split())


def word_list(path):
    return {l.split("->")[0].strip() for l in path.read_text().splitlines() if l.strip() and not l.startswith("#")}


def fetch(url, path):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {url} ...")
        urllib.request.urlretrieve(url, path)


def load_dict(path):
    """CMU-format file -> word: phones (first pronunciation only)."""
    pron = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        w, *ph = line.split()
        if "(" not in w and w not in pron:
            pron[w] = ph
    return pron


def load_custom():
    """tools/data/custom.dict: words added by hand, same format as CMU. They win over CMU and over
    the estimates, and count as real (not estimated) pronunciations. Checked so a typo fails loudly."""
    pron = load_dict(DATA / "custom.dict")
    for w, ph in pron.items():
        bad = [p for p in ph if p.rstrip("012") not in SID]
        if not WORD_RE.fullmatch(w) or not ph or bad:
            sys.exit(f"custom.dict: bad line for '{w}' {' '.join(bad)} (word must be lowercase a-z or ', sounds must be ARPAbet)")
        if not any(p[-1] in "12" for p in ph):
            sys.exit(f"custom.dict: '{w}' needs a stressed vowel (a 1 or 2 on a vowel, like AY1)")
    return pron


def dictionary_words(by_pos):
    """ENABLE (public domain) plus every WordNet lemma: what counts as an English word."""
    fetch(ENABLE_URL, ENABLE_TXT)
    data = ENABLE_TXT.read_bytes()
    if hashlib.sha256(data).hexdigest() != ENABLE_SHA256:
        sys.exit(f"{ENABLE_TXT} does not match the pinned ENABLE list; delete it and rebuild")
    return set(data.decode().split()).union(*by_pos.values())


def load_word_types():
    """part-of-speech letter -> set of WordNet lemmas for that POS (CC BY 4.0, Sprint 2)."""
    fetch(WORDNET_URL, WORDNET_GZ)
    by_pos = {"n": set(), "v": set(), "a": set(), "s": set(), "r": set()}
    with gzip.open(WORDNET_GZ, "rt", encoding="utf-8") as f:
        for line in f:
            m = LEMMA_RE.search(line)
            if not m:
                continue
            word = html.unescape(m.group(1))
            if re.fullmatch(r"[a-z']+", word):
                by_pos[m.group(2)].add(word)
    return by_pos


def load_phrases(lexicon):
    """Multi-word WordNet entries (heart of gold, catch cold, all told) for the Phrase tab: 2-4 words,
    every word in the lexicon, not ending on a function word (in on, get to). Most common first,
    using wordfreq's estimate for the phrase (it combines the words' own frequencies).
    shortcut: WordNet's phrases are dictionary entries, not lyrics (many are biology terms); the
    common-first order keeps those low. Upgrade to a real phrase list if writers find them dull."""
    phrases = set()
    with gzip.open(WORDNET_GZ, "rt", encoding="utf-8") as f:
        for line in f:
            m = LEMMA_RE.search(line)
            if m and " " in (p := html.unescape(m.group(1))) and re.fullmatch(r"[a-z' ]+", p):
                words = p.split()
                if 2 <= len(words) <= 4 and all(w in lexicon for w in words) and words[-1] not in FUNCTION_WORDS:
                    phrases.add(" ".join(words))
    ranked = sorted(phrases, key=lambda p: (-round(zipf_frequency(p, "en"), 2), p))
    return [p for p in ranked if zipf_frequency(p, "en") >= PHRASE_MIN_ZIPF]


PHRASE_MIN_ZIPF = 2.5  # below this they are mostly species and medical terms

SENSE_RE = re.compile(r'<Sense [^>]*?synset="([^"]*)"')  # verb senses carry extra attributes first
SYNSET_RE = re.compile(r'<Synset id="([^"]*)"')
RELATION_RE = re.compile(r'<SynsetRelation relType="(similar|also|hyponym|hypernym)" target="([^"]*)"')


def load_thesaurus(lexicon):
    """Synonyms from WordNet for the thesaurus tab: for each word, one group per meaning (WordNet's
    own order, commonest meaning first), each group the other words sharing that meaning. Adjectives
    also take their "similar"/"also" meanings (WordNet keeps adjective groups tiny: cold -> icy, chilly).
    For the two commonest meanings, two more groups: kinds of it (kiss -> peck, smooch) and what it is
    a kind of (kiss -> touch). WordNet's verb and noun groups are often a word or two, so these carry
    most of the useful words. Only common headwords (zipf >= 2.5) and words (>= 1.5), at most 8 groups
    of 8, commonest first. Lines: word|=syn,syn;<kind,kind;>broader (= same meaning, < kinds of, > broader)."""
    senses, members, rel = {}, {}, {}
    lemma = synset = None
    with gzip.open(WORDNET_GZ, "rt", encoding="utf-8") as f:
        for line in f:
            if m := LEMMA_RE.search(line):
                lemma = html.unescape(m.group(1))
                senses.setdefault(lemma, []).append([])  # one list per part of speech (lexical entry)
            elif (m := SENSE_RE.search(line)) and lemma is not None:
                senses[lemma][-1].append(m.group(1))
                members.setdefault(m.group(1), []).append(lemma)
            elif "</LexicalEntry>" in line:
                lemma = None
            elif m := SYNSET_RE.search(line):
                synset = m.group(1)
            elif synset and (m := RELATION_RE.search(line)):
                rel.setdefault((synset, m.group(1)), []).append(m.group(2))
    zipf = lambda w: zipf_frequency(w, "en")
    lines = []
    for w in sorted(senses):
        if w not in lexicon or zipf(w) < 2.5:
            continue
        groups, seen = [], {w}

        def add(mark, words):
            g = sorted({x for x in words if x in lexicon and x not in seen and zipf(x) >= 1.5}, key=lambda x: (-zipf(x), x))[:8]
            seen.update(g)
            if g:
                groups.append(mark + ",".join(g))

        linked = lambda s, kind: [x for t in rel.get((s, kind), []) for x in members.get(t, [])]
        # Take each part of speech's meanings in turn (noun 1, verb 1, noun 2, verb 2...), so "run" the
        # verb is not buried under eight noun meanings.
        by_pos = senses[w]
        order = [p[i] for i in range(max(map(len, by_pos))) for p in by_pos if i < len(p)]
        for i, s in enumerate(order):
            add("=", members[s] + linked(s, "similar") + linked(s, "also"))
            if i < 2:  # each of the two commonest meanings brings its kinds and broader words with it
                add("<", linked(s, "hyponym"))
                add(">", linked(s, "hypernym"))
        if groups:
            lines.append(w + "|" + ";".join(groups[:8]))
    return lines


DEFINITION_RE = re.compile(r"<Definition>(.*)</Definition>")


def b36(n):
    s = ""
    while True:
        n, r = divmod(n, 36)
        s = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + s
        if not n:
            return s


def load_dictionary(lexicon):
    """Definitions from WordNet for the Meaning tab: every lexicon word WordNet lists, all its meanings,
    grouped by part of speech in WordNet's order. A meaning shared by several words (a synset) is
    written once. Two blocks split by a blank line: meanings (pos|definition), then words
    (word|meaning,meaning in base 36, the meaning's line number in the first block), or word|@base for
    WordNet's irregular forms (ran|@run). Regular forms (kissed, happier) are not listed; the app
    finds their base.
    shortcut: no example sentences (+500 KB gzipped); add WordNet's <Example>s if writers want them."""
    senses, defs, forms = {}, {}, {}
    lemma = synset = None
    with gzip.open(WORDNET_GZ, "rt", encoding="utf-8") as f:
        for line in f:
            if m := LEMMA_RE.search(line):
                lemma = html.unescape(m.group(1))
                senses.setdefault(lemma, [])
            elif (m := re.search(r'<Form writtenForm="([^"]*)"', line)) and lemma is not None:
                forms.setdefault(html.unescape(m.group(1)), lemma)  # irregular forms: ran -> run, geese -> goose
            elif (m := SENSE_RE.search(line)) and lemma is not None:
                senses[lemma].append(m.group(1))
            elif "</LexicalEntry>" in line:
                lemma = None
            elif m := re.search(r'<Synset id="([^"]*)"[^>]*partOfSpeech="(\w)"', line):
                synset = m.group(1)
                defs[synset] = [m.group(2), ""]
            elif synset and (m := DEFINITION_RE.search(line)):
                defs[synset][1] = html.unescape(m.group(1))
    index, meanings, words = {}, [], []
    for w in sorted(senses):
        if w not in lexicon:
            continue
        ids = []
        for s in senses[w]:
            if s not in index:
                index[s] = len(meanings)
                pos, d = defs[s]
                meanings.append(("a" if pos == "s" else pos) + "|" + d.replace("\n", " "))
            ids.append(b36(index[s]))
        words.append(w + "|" + ",".join(ids))
    listed = {w.split("|")[0] for w in words}
    # An irregular form that is not a word of its own points at its base: ran|@run.
    words += sorted(f"{f}|@{b}" for f, b in forms.items() if f in lexicon and f not in senses and b in listed)
    return "\n".join(meanings) + "\n\n" + "\n".join(words) + "\n"


def word_type_bits(word, by_pos):
    """Bitmask of TYPE_BIT for word: a direct WordNet lemma match, or (since WordNet only
    tags base forms) a suffix-stripped match against the same part of speech's lemmas."""
    bits = 0
    for pos, lemmas in by_pos.items():
        if word in lemmas:
            bits |= TYPE_BIT[pos]
            continue
        for suf, rep in POS_SUFFIXES[pos]:
            if suf and word.endswith(suf):
                candidate = word[: -len(suf)] + rep
                if candidate != word and candidate in lemmas:
                    bits |= TYPE_BIT[pos]
                    break
    return bits


def main():
    cmu = {**load_dict(DATA / "cmudict.dict"), **load_custom()}  # hand-added words win
    estimated = load_dict(DATA / "estimated.dict")
    pron = {**estimated, **cmu}
    drop = word_list(DATA / "misspelling_blocklist.txt") | word_list(DATA / "slur_blocklist.txt")
    explicit = word_list(DATA / "explicit_words.txt")
    by_pos = load_word_types()
    # Dictionary words, plus common non-dictionary words CMU knows (names, slang like "gonna").
    # Also every other CMU word (real pronunciations: 'bout, 'til, 'twas, place and family names),
    # except possessives like ross's and guys' (they only repeat each word, and crowd out real rhymes) and dropped-g forms like runnin', which the
    # engine already rhymes as the full word (running).
    extra = {w for w in cmu if not w.endswith(("'s", "s'")) and not (w.endswith("in'") and w[:-1] + "g" in cmu)}
    wanted = dictionary_words(by_pos) | set(iter_wordlist("en")) | extra
    words = sorted(
        w for w in wanted
        if w in pron and WORD_RE.fullmatch(w) and w not in drop and any(p[-1].isdigit() for p in pron[w])
    )

    phones, meta, common = bytearray(), bytearray(), bytearray()
    for w in words:
        ph = pron[w]
        phones.append(len(ph))
        for p in ph:
            stress = int(p[-1]) if p[-1].isdigit() else 0
            phones.append(SID[p.rstrip("012")] | (stress << 6))
        flags = word_type_bits(w, by_pos)
        if w in explicit:
            flags |= FLAG_EXPLICIT
        if w in FUNCTION_WORDS:
            flags |= FLAG_FUNCTION
        if w not in cmu:
            flags |= FLAG_ESTIMATED
        meta.append(flags)
        common.append(min(255, round(zipf_frequency(w, "en") * 32)))

    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "lexicon.txt": ("\n".join(words) + "\n").encode(),
        "phones.bin": bytes(phones),
        "meta.bin": bytes(meta),
        "commonness.bin": bytes(common),
        "phrases.txt": ("\n".join(load_phrases(set(words))) + "\n").encode(),
        "thesaurus.txt": ("\n".join(load_thesaurus(set(words))) + "\n").encode(),
        "dictionary.txt.gz": load_dictionary(set(words)).encode(),
    }
    for name, data in files.items():
        # Stored gzipped (2 MB, 5.5 MB raw) so it is small on disk, in git and in the offline cache;
        # the worker unzips it. The manifest's sha256 is of the unzipped text: zlib builds differ, so
        # the .gz bytes are not identical across machines and CI skips diffing them.
        (OUT / name).write_bytes(gzip.compress(data, 9, mtime=0) if name.endswith(".gz") else data)
    manifest = {
        "lang": "en-us",
        "format": 1,
        "words": len(words),
        "sounds": SOUNDS,
        "files": {n: {"bytes": len(d), "sha256": hashlib.sha256(d).hexdigest()} for n, d in files.items()},
        "credits": [
            "CMU Pronouncing Dictionary (BSD-style licence)",
            "wordfreq commonness ranks (CC BY-SA 4.0, commonness.bin only)",
            "LDNOOBW English word list (CC BY 4.0)",
            "Open English WordNet (CC BY 4.0) and Princeton WordNet, word types and word list",
            "ENABLE word list (public domain)",
            "Phrases, thesaurus and definitions: Open English WordNet (CC BY 4.0)",
            "Estimated pronunciations: built from CMU entries, the rest predicted by g2p_en (Apache 2.0)",
        ],
    }
    # newline="\n": on Windows write_text() turns each \n into \r\n, so CI (Linux) saw a byte difference.
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    total = sum(len(d) for d in files.values())
    zipped = sum(len(gzip.compress(d, 9, mtime=0)) for d in files.values())
    print(f"{len(words)} words ({sum(w not in cmu for w in words)} estimated), {total:,} bytes raw, {zipped:,} gzipped")


if __name__ == "__main__":
    main()

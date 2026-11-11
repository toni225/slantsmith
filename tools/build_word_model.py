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
    cmu = load_dict(DATA / "cmudict.dict")
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
    }
    for name, data in files.items():
        (OUT / name).write_bytes(data)
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

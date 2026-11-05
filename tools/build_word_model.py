"""Build the en-us word model from the CMU dictionary and wordfreq.

Usage: python3 tools/build_word_model.py   (needs: pip install wordfreq)
Output: src/assets/model/en-us/{lexicon.txt,phones.bin,meta.bin,commonness.bin,manifest.json}
Same inputs give byte-identical files.
"""
import gzip, hashlib, html, json, re, sys, urllib.request
from pathlib import Path
from wordfreq import top_n_list, zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "data"
OUT = ROOT / "src" / "assets" / "model" / "en-us"
MAX_WORDS = 100000  # the real ceiling is ~97,875 (every wordfreq "en" word with a CMU pronunciation); this just needs to clear it
BUDGET_BYTES = 2_000_000  # NFR-02, checked on raw size (hosts compress it further)

# ARPAbet; order is part of the format: sound id = index.
SOUNDS = "AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M N NG OW OY P R S SH T TH UH UW V W Y Z ZH".split()
SID = {s: i for i, s in enumerate(SOUNDS)}
FLAG_EXPLICIT = 1 << 4
FLAG_FUNCTION = 1 << 5  # closed-class word, see FUNCTION_WORDS
# bits 0-3: word-type bitmask (noun/verb/adjective/adverb), from Open English WordNet
TYPE_BIT = {"n": 1, "v": 2, "a": 4, "s": 4, "r": 8}  # 's' = satellite adjective, folds into adjective

WORDNET_URL = "https://en-word.net/downloads/english-wordnet-2025.xml.gz"
WORDNET_GZ = DATA / "wordnet" / "english-wordnet-2025.xml.gz"
LEMMA_RE = re.compile(r'<Lemma writtenForm="([^"]*)" partOfSpeech="([nvasr])"\s*/?>')

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


def load_word_types():
    """part-of-speech letter -> set of WordNet lemmas for that POS (CC BY 4.0, Sprint 2)."""
    if not WORDNET_GZ.exists():
        WORDNET_GZ.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {WORDNET_URL} ...")
        urllib.request.urlretrieve(WORDNET_URL, WORDNET_GZ)
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
    pron = {}
    for line in (DATA / "cmudict.dict").read_text(encoding="utf-8").splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        w, *ph = line.split()
        if "(" not in w and w not in pron:  # first pronunciation only
            pron[w] = ph

    drop = word_list(DATA / "misspelling_blocklist.txt") | word_list(DATA / "slur_blocklist.txt")
    explicit = word_list(DATA / "explicit_words.txt")
    by_pos = load_word_types()
    words = []
    # wordfreq's "en" list tops out around 320k words; ask for all of it so the
    # candidate pool isn't the bottleneck - MAX_WORDS (and the byte budget below)
    # are what actually cap the vocabulary.
    for w in top_n_list("en", 400_000):
        if re.fullmatch(r"[a-z']+", w) and w in pron and w not in drop and any(p[-1].isdigit() for p in pron[w]):
            words.append(w)
            if len(words) == MAX_WORDS:
                break
    words.sort()

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
            "Open English WordNet (CC BY 4.0) and Princeton WordNet, word types only",
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(len(d) for d in files.values())
    print(f"{len(words)} words, {total:,} bytes raw")
    if total > BUDGET_BYTES:
        sys.exit("model over the 2 MB budget")


if __name__ == "__main__":
    main()

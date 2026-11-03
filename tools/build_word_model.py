"""Build the en-us word model from the CMU dictionary and wordfreq.

Usage: python3 tools/build_word_model.py   (needs: pip install wordfreq)
Output: src/assets/model/en-us/{lexicon.txt,phones.bin,meta.bin,commonness.bin,manifest.json}
Same inputs give byte-identical files.
"""
import hashlib, json, re, sys
from pathlib import Path
from wordfreq import top_n_list, zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "data"
OUT = ROOT / "src" / "assets" / "model" / "en-us"
MAX_WORDS = 60000
BUDGET_BYTES = 2_000_000  # NFR-02, checked on raw size (hosts compress it further)

# ARPAbet; order is part of the format: sound id = index.
SOUNDS = "AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M N NG OW OY P R S SH T TH UH UW V W Y Z ZH".split()
SID = {s: i for i, s in enumerate(SOUNDS)}
FLAG_EXPLICIT = 1 << 4  # bits 0-3 are word types, filled in Sprint 2


def word_list(path):
    return {l.split("->")[0].strip() for l in path.read_text().splitlines() if l.strip() and not l.startswith("#")}


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
    words = []
    for w in top_n_list("en", MAX_WORDS * 2):
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
        meta.append(FLAG_EXPLICIT if w in explicit else 0)
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
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(len(d) for d in files.values())
    print(f"{len(words)} words, {total:,} bytes raw")
    if total > BUDGET_BYTES:
        sys.exit("model over the 2 MB budget")


if __name__ == "__main__":
    main()

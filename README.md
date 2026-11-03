# Slantsmith

Offline rhyme, slant and grammar helper for songwriters. Sprint 1: word model and rhyme engine.

## Run

```bash
pip install wordfreq        # only to rebuild the model
npm run build:model         # writes src/assets/model/en-us/
npm test                    # rhyme test set + speed, explicit filter, dropped-g checks
```

Node 22.6+ runs the TypeScript engine directly; the Angular app (Sprint 2) imports the same files into a Web Worker.

## Layout

- `tools/build_word_model.py`: builds the model from `tools/data/` (CMU dictionary, blocklists).
- `src/assets/model/en-us/`: lexicon.txt, phones.bin, meta.bin, commonness.bin, manifest.json.
- `src/engines/model.ts`: decodes the files. `src/engines/rhyme.ts`: perfect, slant, phrase and unknown-word rhymes.
- `test/`: the 300-item rhyme set and 200-line grammar set.
- `docs/`: requirements, decisions and licences, session summary. `design/screens/`: approved phone screens (HTML artboards, reference only).
- `CLAUDE.md`: project memory for Claude Code.

## Credits

CMU Pronouncing Dictionary (BSD-style). wordfreq commonness ranks (CC BY-SA 4.0, `commonness.bin` only). LDNOOBW English list (CC BY 4.0). codespell misspelling list (CC BY-SA 3.0, build time only).

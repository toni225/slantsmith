/// <reference lib="webworker" />
import { loadModel } from '../../engines/model';
import { RhymeEngine, type Rhyme } from '../../engines/rhyme';
import { syllableCount } from './syllables';
import type { RhymeRequest, RhymeResponse, UiRhyme } from './rhyme-protocol';

async function load() {
  const base = 'assets/model/en-us/';
  const [manifest, lexicon, phones, meta, commonness] = await Promise.all([
    fetch(base + 'manifest.json').then((r) => r.json()),
    fetch(base + 'lexicon.txt').then((r) => r.text()),
    fetch(base + 'phones.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'meta.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'commonness.bin').then((r) => r.arrayBuffer()),
  ]);
  const model = loadModel(lexicon, new Uint8Array(phones), new Uint8Array(meta), new Uint8Array(commonness), manifest.sounds);
  return { engine: new RhymeEngine(model), model };
}

const ready = load();

function enrich(model: Awaited<ReturnType<typeof load>>['model'], r: Rhyme): UiRhyme {
  const id = model.ids.get(r.word);
  return {
    ...r,
    syllables: syllableCount(model, r.word),
    commonness: id === undefined ? 0 : model.commonness[id],
    types: id === undefined ? [] : model.wordTypes(id),
  };
}

addEventListener('message', async ({ data }: MessageEvent<RhymeRequest>) => {
  const { id, word, hideExplicit } = data;
  try {
    const { engine, model } = await ready;
    const r = engine.rhymes(word, hideExplicit);
    const response: RhymeResponse = {
      id,
      result: {
        word: r.word,
        estimated: r.estimated,
        syllables: syllableCount(model, r.word),
        perfect: r.perfect.map((x) => enrich(model, x)),
        slant: r.slant.map((x) => enrich(model, x)),
      },
    };
    postMessage(response);
  } catch (e) {
    postMessage({ id, error: String(e) } satisfies RhymeResponse);
  }
});

/// <reference lib="webworker" />
import { loadModel } from '../../engines/model';
import { RhymeEngine, type Rhyme } from '../../engines/rhyme';
import { checkLine } from '../../engines/grammar';
import { Dictionary, Thesaurus, type Definitions } from '../../engines/thesaurus';
import { detectScheme } from './scheme';
import { syllableCount } from './syllables';
import type { BrowseResponse, DefineResponse, RandomWordResponse,GrammarResponse, RhymeResponse, SchemeResponse, SyllablesResponse, SynonymsResponse, UiRhyme, WorkerRequest } from './rhyme-protocol';

async function load() {
  const base = 'assets/model/en-us/';
  const [manifest, lexicon, phones, meta, commonness, phrases] = await Promise.all([
    fetch(base + 'manifest.json').then((r) => r.json()),
    fetch(base + 'lexicon.txt').then((r) => r.text()),
    fetch(base + 'phones.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'meta.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'commonness.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'phrases.txt').then((r) => r.text()),
  ]);
  const model = loadModel(lexicon, new Uint8Array(phones), new Uint8Array(meta), new Uint8Array(commonness), manifest.sounds);
  return { engine: new RhymeEngine(model, phrases.split('\n').filter(Boolean)), model };
}

const ready = load();
// Fetched on the first synonyms request only, so rhymes never wait for it.
let thesaurus: Promise<Thesaurus> | undefined;
let dictionary: Promise<Dictionary> | undefined; // same, for the Meaning tab

function enrich(model: Awaited<ReturnType<typeof load>>['model'], r: Rhyme): UiRhyme {
  if (r.type === 'phrase') {
    // A phrase counts its words' syllables and is as common as its rarest word.
    const ids = r.word.split(' ').map((w) => model.ids.get(w) ?? -1);
    const counts = r.word.split(' ').map((w) => syllableCount(model, w));
    return { ...r, syllables: counts.every((c) => c !== undefined) ? counts.reduce((a, b) => a! + b!, 0) : undefined, commonness: Math.min(...ids.map((i) => (i < 0 ? 0 : model.commonness[i]))), types: [] };
  }
  const id = model.ids.get(r.word);
  return {
    ...r,
    syllables: syllableCount(model, r.word),
    commonness: id === undefined ? 0 : model.commonness[id],
    types: id === undefined ? [] : model.wordTypes(id),
  };
}

// Stress per syllable (1 main, 2 secondary, 0 none) for the editor's meter view. The dictionary
// stresses every one-syllable word, but in a sung line "the", "on", "and" fall weak, so function words read 0.
const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);
function stressOf(model: Awaited<ReturnType<typeof load>>['model'], id: number): number[] {
  const stress = Array.from(model.phones[id]).filter((b) => VOWELS.has(model.sounds[b & 63])).map((b) => b >> 6);
  return stress.length === 1 && model.isFunctionWord(id) ? [0] : stress;
}

addEventListener('message', async ({ data }: MessageEvent<WorkerRequest>) => {
  const { id } = data;
  try {
    const { engine, model } = await ready;
    if (data.kind === 'syllables') {
      const result = data.words.map((w) => {
        const id = model.ids.get(w.toLowerCase());
        return { count: syllableCount(model, w), estimated: id === undefined || model.isEstimated(id), stress: id === undefined ? [] : stressOf(model, id) };
      });
      postMessage({ id, result } satisfies SyllablesResponse);
      return;
    }
    if (data.kind === 'scheme') {
      const result = detectScheme(engine, data.words);
      postMessage({ id, result } satisfies SchemeResponse);
      return;
    }
    if (data.kind === 'synonyms') {
      thesaurus ??= fetch('assets/model/en-us/thesaurus.txt').then((r) => r.text()).then((t) => new Thesaurus(t));
      const found = (await thesaurus).lookup(data.word);
      const items: UiRhyme[] = [];
      found?.groups.forEach((group, g) => group.words.forEach((word) => {
        const wid = model.ids.get(word);
        if (data.hideExplicit && wid !== undefined && model.explicit(wid)) return;
        const like = group.words.filter((w) => w !== word).slice(0, 3);
        const why = group.kind === 'kinds' ? `A kind of ${found.base}` : group.kind === 'broader' ? `Broader: ${found.base} is a kind of ${word}` : `Same meaning${like.length ? ', like ' + like.join(', ') : ''}`;
        items.push(enrich(model, { word, type: 'synonym', score: 100 - g, why }));
      }));
      postMessage({ id, result: { base: found?.base ?? null, items } } satisfies SynonymsResponse);
      return;
    }
    if (data.kind === 'define' || data.kind === 'random' || data.kind === 'browse') {
      dictionary ??= fetch('assets/model/en-us/dictionary.txt.gz').then((r) => r.arrayBuffer()).then(async (buf) => {
        const bytes = new Uint8Array(buf);
        // A host may already have unzipped it (Content-Encoding: gzip); only unzip real gzip bytes.
        const text = bytes[0] === 0x1f && bytes[1] === 0x8b
          ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
          : new TextDecoder().decode(bytes);
        return new Dictionary(text);
      });
      const dict = await dictionary;
      const entry = (d: Definitions | null) => d && { ...d, syllables: syllableCount(model, d.base) };
      if (data.kind === 'random') {
        // Fairly common words only (zipf >= 3): a random pick from all 65k is mostly obscure terms.
        const keep = (w: string) => {
          const wid = model.ids.get(w);
          return wid !== undefined && model.commonness[wid] >= 96 && !(data.hideExplicit && model.explicit(wid));
        };
        postMessage({ id, result: entry(dict.lookup(dict.random(keep)))! } satisfies RandomWordResponse);
      } else if (data.kind === 'browse') {
        postMessage({ id, result: dict.browse(data.letter, data.word ? dict.pageOf(data.word) : data.page) } satisfies BrowseResponse);
      } else {
        postMessage({ id, result: entry(dict.lookup(data.word)) } satisfies DefineResponse);
      }
      return;
    }
    if (data.kind === 'grammar') {
      const result = checkLine(data.line);
      postMessage({ id, result } satisfies GrammarResponse);
      return;
    }
    const { word, hideExplicit } = data;
    const r = engine.rhymes(word, hideExplicit);
    const response: RhymeResponse = {
      id,
      result: {
        word: r.word,
        estimated: r.estimated,
        syllables: syllableCount(model, r.word),
        perfect: r.perfect.map((x) => enrich(model, x)),
        slant: r.slant.map((x) => enrich(model, x)),
        phrases: r.phrases.map((x) => enrich(model, x)),
      },
    };
    postMessage(response);
  } catch (e) {
    postMessage({ id, error: String(e) } satisfies RhymeResponse);
  }
});

// Decodes the word model files (see tools/build_word_model.py for the format).

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb';

export interface Model {
  words: string[];
  ids: Map<string, number>;
  phones: Uint8Array[]; // per word: low 6 bits = sound id, high 2 bits = stress
  sounds: string[];
  explicit: (id: number) => boolean;
  commonness: Uint8Array; // 0-255, higher = more common
  wordTypes: (id: number) => WordType[]; // from Open English WordNet, [] if untyped
  isFunctionWord: (id: number) => boolean;
  isEstimated: (id: number) => boolean; // predicted pronunciation, not from the CMU dictionary
}

const FLAG_EXPLICIT = 1 << 4;
const FLAG_FUNCTION = 1 << 5;
const FLAG_ESTIMATED = 1 << 6;
// bits 0-3: see tools/build_word_model.py TYPE_BIT
const TYPE_FLAG: [number, WordType][] = [[1, 'noun'], [2, 'verb'], [4, 'adjective'], [8, 'adverb']];

export function loadModel(lexicon: string, phonesBin: Uint8Array, meta: Uint8Array, commonness: Uint8Array, sounds: string[]): Model {
  const words = lexicon.split('\n').filter(Boolean);
  const phones: Uint8Array[] = [];
  for (let at = 0; at < phonesBin.length; ) {
    const n = phonesBin[at];
    phones.push(phonesBin.subarray(at + 1, at + 1 + n));
    at += 1 + n;
  }
  if (phones.length !== words.length || meta.length !== words.length || commonness.length !== words.length) {
    throw new Error('Word model files do not match each other');
  }
  return {
    words,
    ids: new Map(words.map((w, i) => [w, i])),
    phones,
    sounds,
    explicit: (id) => (meta[id] & FLAG_EXPLICIT) !== 0,
    commonness,
    wordTypes: (id) => TYPE_FLAG.filter(([bit]) => (meta[id] & bit) !== 0).map(([, t]) => t),
    isFunctionWord: (id) => (meta[id] & FLAG_FUNCTION) !== 0,
    isEstimated: (id) => (meta[id] & FLAG_ESTIMATED) !== 0,
  };
}

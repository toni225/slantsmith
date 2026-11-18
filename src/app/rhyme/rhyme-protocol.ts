import type { Rhyme } from '../../engines/rhyme';
import type { WordType } from '../../engines/model';
import type { GrammarFlag } from '../../engines/grammar';
import type { BrowsePage, Definitions } from '../../engines/thesaurus';

// The engine (and the Model it needs for syllable counts / commonness) lives in
// the worker (ADR-04); these are the enriched, structured-cloneable shapes it posts back.
export interface UiRhyme extends Rhyme {
  syllables: number | undefined;
  commonness: number;
  types: WordType[];
}

export interface UiRhymeResult {
  word: string;
  estimated: boolean;
  syllables: number | undefined;
  perfect: UiRhyme[];
  slant: UiRhyme[];
  phrases: UiRhyme[]; // multi-word phrases whose last word rhymes (Phrase tab)
}

export interface RhymeRequest { id: number; kind: 'rhyme'; word: string; hideExplicit: boolean }
export type RhymeResponse = { id: number; result: UiRhymeResult } | { id: number; error: string };

// FR-21: live syllable count per line in the lyric editor.
export interface SyllablesRequest { id: number; kind: 'syllables'; words: string[] }
export interface WordSyllables { count: number | undefined; estimated: boolean; stress: number[] } // stress: per syllable, [] if unknown
export interface SyllablesResponse { id: number; result: WordSyllables[] }

// FR-22: rhyme-letter scheme (A, B, C...) per line ending in the lyric editor.
export interface SchemeRequest { id: number; kind: 'scheme'; words: string[] }
export interface SchemeResponse { id: number; result: SchemeLetter[] }

// FR-09/10: grammar flags for one line in the lyric editor.
export interface GrammarRequest { id: number; kind: 'grammar'; line: string }
export interface GrammarResponse { id: number; result: GrammarFlag[] }

// Thesaurus tab: synonyms grouped by meaning. base: the dictionary form found (kissed -> kiss), null if none.
export interface SynonymsRequest { id: number; kind: 'synonyms'; word: string; hideExplicit: boolean }
export interface SynonymsResult { base: string | null; items: UiRhyme[] }
export interface SynonymsResponse { id: number; result: SynonymsResult }

// Meaning tab: definitions, null if the dictionary does not list the word (or a base form of it).
export interface DefineRequest { id: number; kind: 'define'; word: string }
export type WordEntry = Definitions & { syllables: number | undefined }; // syllables of the base, from the word model
export interface DefineResponse { id: number; result: WordEntry | null }
// Dictionary page: a random fairly common word (looked up), and one A-Z page of words.
export interface RandomWordRequest { id: number; kind: 'random'; hideExplicit: boolean }
export interface RandomWordResponse { id: number; result: WordEntry }
export interface BrowseRequest { id: number; kind: 'browse'; letter: string; page: number; word?: string } // word: open the page it is on
export interface BrowseResponse { id: number; result: BrowsePage }

export type WorkerRequest = RhymeRequest | SyllablesRequest | SchemeRequest | GrammarRequest | SynonymsRequest | DefineRequest | RandomWordRequest | BrowseRequest;

export interface SchemeLetter { letter: string | null; type: 'perfect' | 'slant' | null }

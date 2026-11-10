import type { Rhyme } from '../../engines/rhyme';
import type { WordType } from '../../engines/model';
import type { GrammarFlag } from '../../engines/grammar';

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
}

export interface RhymeRequest { id: number; kind: 'rhyme'; word: string; hideExplicit: boolean }
export type RhymeResponse = { id: number; result: UiRhymeResult } | { id: number; error: string };

// FR-21: live syllable count per line in the lyric editor.
export interface SyllablesRequest { id: number; kind: 'syllables'; words: string[] }
export interface WordSyllables { count: number | undefined; estimated: boolean }
export interface SyllablesResponse { id: number; result: WordSyllables[] }

// FR-22: rhyme-letter scheme (A, B, C...) per line ending in the lyric editor.
export interface SchemeRequest { id: number; kind: 'scheme'; words: string[] }
export interface SchemeResponse { id: number; result: SchemeLetter[] }

// FR-09/10: grammar flags for one line in the lyric editor.
export interface GrammarRequest { id: number; kind: 'grammar'; line: string }
export interface GrammarResponse { id: number; result: GrammarFlag[] }

export type WorkerRequest = RhymeRequest | SyllablesRequest | SchemeRequest | GrammarRequest;

export interface SchemeLetter { letter: string | null; type: 'perfect' | 'slant' | null }

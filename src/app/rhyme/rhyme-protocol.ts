import type { Rhyme } from '../../engines/rhyme';
import type { WordType } from '../../engines/model';

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

export interface RhymeRequest { id: number; word: string; hideExplicit: boolean }
export type RhymeResponse = { id: number; result: UiRhymeResult } | { id: number; error: string };

// "Compare with now" on the Takes screen: what changed between a take and the current draft.
// Plain functions, erasable syntax only, so test/compare.test.ts runs them in Node.
import type { Section } from './song.model';

export type LineKind = 'same' | 'removed' | 'added';
export interface DiffLine { kind: LineKind; text: string }
export interface SectionDiff { name: string; was?: string; status: 'same' | 'changed' | 'added' | 'removed'; lines: DiffLine[] }

// Line diff by longest common subsequence: lines only in `before` are removed, only in `after` added.
export function diffLines(before: string[], after: string[]): DiffLine[] {
  const n = before.length, m = after.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    lcs[i][j] = before[i] === after[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && before[i] === after[j]) { out.push({ kind: 'same', text: before[i] }); i++; j++; }
    // On a tie, the old line goes first: "let go" then "hold tight" reads as a replacement.
    else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) out.push({ kind: 'removed', text: before[i++] });
    else out.push({ kind: 'added', text: after[j++] });
  }
  return out;
}

// A section's lines, with its chord row first so chord changes show too.
const lines = (s: Section) => [...(s.chords ? [`Chords: ${s.chords}`] : []), ...s.text.split('\n')];

// Sections are matched by id (a renamed or edited section keeps its id), in the draft's order;
// sections only in the take come last, as removed.
export function compareSections(take: Section[], now: Section[]): SectionDiff[] {
  const old = new Map(take.map((s) => [s.id, s]));
  const out: SectionDiff[] = now.map((s) => {
    const t = old.get(s.id);
    if (!t) return { name: s.name, status: 'added', lines: lines(s).map((text) => ({ kind: 'added' as const, text })) };
    const diff = diffLines(lines(t), lines(s));
    const renamed = t.name !== s.name;
    return { name: s.name, was: renamed ? t.name : undefined, status: renamed || diff.some((l) => l.kind !== 'same') ? 'changed' : 'same', lines: diff };
  });
  const kept = new Set(now.map((s) => s.id));
  for (const t of take) if (!kept.has(t.id)) out.push({ name: t.name, status: 'removed', lines: lines(t).map((text) => ({ kind: 'removed' as const, text })) });
  return out;
}

// Run: node --experimental-strip-types test/grammar.test.ts
// Scores against test/slantsmith_grammar_test_set.csv per docs/requirements.md's acceptance bar:
// 100 "must flag" lines need >=90% flagged with the right fix; 100 lyric_ok lines need <=5% flagged.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLine } from '../src/engines/grammar.ts';

interface Row { line: string; mode: string; group: string; expect: string }

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  const lines = text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.length);
  for (const line of lines.slice(1)) {
    const fields: string[] = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else cur += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { fields.push(cur); cur = ''; }
      else cur += c;
    }
    fields.push(cur);
    const [line_, mode, group, expect] = fields;
    rows.push({ line: line_, mode, group, expect });
  }
  return rows;
}

const rows = parseCsv(readFileSync(new URL('./slantsmith_grammar_test_set.csv', import.meta.url), 'utf8'));

// A flag "satisfies" an expectation if its rule/word/suggestion matches what the CSV asked for.
function satisfies(flags: ReturnType<typeof checkLine>, expect: string): boolean {
  const doubled = expect.match(/^flag doubled (\w+)$/);
  if (doubled) return flags.some((f) => f.rule === 'doubled' && f.word.toLowerCase() === doubled[1]);
  const m = expect.match(/^flag (.+)>(.+)$/);
  if (!m) throw new Error(`unrecognized expect: ${expect}`);
  const [, wrong, right] = m;
  return flags.some((f) => f.word.toLowerCase() === wrong.toLowerCase() && f.suggestion.toLowerCase() === right.toLowerCase());
}

test('grammar test set: must-flag lines hit >=90%, lyric_ok false-positive rate <=5%', () => {
  const mustFlag = rows.filter((r) => r.group !== 'lyric_ok');
  const lyricOk = rows.filter((r) => r.group === 'lyric_ok');
  assert.equal(mustFlag.length, 100);
  assert.equal(lyricOk.length, 100);

  const byGroup = new Map<string, { hit: number; total: number }>();
  let hits = 0;
  for (const r of mustFlag) {
    const flags = checkLine(r.line);
    const ok = satisfies(flags, r.expect);
    if (ok) hits++;
    const g = byGroup.get(r.group) ?? { hit: 0, total: 0 };
    g.total++; if (ok) g.hit++;
    byGroup.set(r.group, g);
  }
  let falsePositives = 0;
  for (const r of lyricOk) {
    if (checkLine(r.line).length > 0) falsePositives++;
  }

  console.log('must-flag by group:', Object.fromEntries([...byGroup].map(([g, s]) => [g, `${s.hit}/${s.total}`])));
  console.log(`must-flag overall: ${hits}/100, lyric_ok false positives: ${falsePositives}/100`);

  assert.ok(hits >= 90, `expected >=90 correct flags, got ${hits}`);
  assert.ok(falsePositives <= 5, `expected <=5 false positives, got ${falsePositives}`);
});

test('FR-09 acceptance example: "their going home" flags their>they\'re', () => {
  const flags = checkLine("their going home without me");
  assert.ok(flags.some((f) => f.word === 'their' && f.suggestion === "they're"));
});

test('doubled-word rule never-flag examples are not flagged', () => {
  for (const line of ['I had had enough of the rain', 'I know that that was a lie', 'do do do that voodoo', 'no no no not tonight', 'baby baby come back', 'oh oh here it comes']) {
    assert.deepEqual(checkLine(line).filter((f) => f.rule === 'doubled'), [], line);
  }
});

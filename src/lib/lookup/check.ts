/**
 * A toy version of the lookup check: every number in a model's answer must match a value some tool
 * actually returned. Numbers with nothing behind them are flagged so they can't reach a bank operator
 * unmarked.
 */
export type Segment = { readonly kind: 'text' | 'backed' | 'unbacked'; readonly text: string };
export interface CheckResult {
  readonly segments: readonly Segment[];
  readonly backed: readonly string[];
  readonly unbacked: readonly string[];
}

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;

const normalise = (value: string): number => Number(value.replace(/,/g, ''));

export function checkNumbers(answer: string, toolValues: readonly string[]): CheckResult {
  const known = new Set(toolValues.map(normalise));
  const matches = [...answer.matchAll(NUMBER)];
  const pieces = matches.reduce<{ at: number; segments: readonly Segment[] }>(
    (acc, match) => {
      const start = match.index ?? 0;
      const kind = known.has(normalise(match[0])) ? 'backed' : 'unbacked';
      const before: readonly Segment[] = start > acc.at ? [{ kind: 'text', text: answer.slice(acc.at, start) }] : [];
      return { at: start + match[0].length, segments: [...acc.segments, ...before, { kind, text: match[0] }] };
    },
    { at: 0, segments: [] },
  );
  const tail: readonly Segment[] = pieces.at < answer.length ? [{ kind: 'text', text: answer.slice(pieces.at) }] : [];
  const segments = [...pieces.segments, ...tail];
  const pick = (kind: Segment['kind']) => segments.filter((s) => s.kind === kind).map((s) => s.text);
  return { segments, backed: pick('backed'), unbacked: pick('unbacked') };
}

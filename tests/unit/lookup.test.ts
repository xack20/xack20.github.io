import { describe, expect, it } from 'vitest';
import { checkNumbers } from '../../src/lib/lookup/check';

const ANSWER = 'The customer has 3 active cards, a daily limit of 50,000 BDT and 12 declined payments this week.';

describe('checkNumbers', () => {
  it('flags numbers with no tool result behind them', () => {
    const result = checkNumbers(ANSWER, ['3', '50000']);
    expect(result.unbacked).toEqual(['12']);
    expect(result.backed).toEqual(['3', '50,000']);
  });

  it('treats formatting differences as the same number', () => {
    expect(checkNumbers('Limit: 50,000.00', ['50000']).unbacked).toEqual([]);
  });

  it('flags everything when no tool was called', () => {
    expect(checkNumbers(ANSWER, []).unbacked).toEqual(['3', '50,000', '12']);
  });

  it('splits the answer into segments that rebuild the original text', () => {
    const { segments } = checkNumbers(ANSWER, ['3']);
    expect(segments.map((s) => s.text).join('')).toBe(ANSWER);
    expect(segments.filter((s) => s.kind === 'unbacked').map((s) => s.text)).toEqual(['50,000', '12']);
  });

  it('returns a single plain segment for text without numbers', () => {
    expect(checkNumbers('No numbers here.', []).segments).toEqual([{ kind: 'text', text: 'No numbers here.' }]);
  });
});

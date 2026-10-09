import { describe, expect, it } from 'vitest';
import { MAX_ANIMATED_CHARS, splitHeadline } from '../../src/lib/text/splitChars';

const HEADLINE = [{ text: 'Engineering' }, { text: 'trust', gold: true, breakAfter: true }, { text: 'into AI agents' }];

describe('splitHeadline', () => {
  it('keeps the readable text for screen readers', () => {
    expect(splitHeadline(HEADLINE).text).toBe('Engineering trust into AI agents');
  });

  it('splits into words, spaces and one line break in order', () => {
    const kinds = splitHeadline(HEADLINE).tokens.map((t) => t.kind);
    expect(kinds).toEqual(['word', 'space', 'word', 'break', 'word', 'space', 'word', 'space', 'word']);
  });

  it('numbers characters across words and marks only the gold segment', () => {
    const chars = splitHeadline(HEADLINE).tokens.flatMap((t) => (t.kind === 'word' ? t.chars : []));
    expect(chars.map((c) => c.index)).toEqual([...Array(28).keys()]);
    expect(chars.filter((c) => c.gold).map((c) => c.char).join('')).toBe('trust');
  });

  it('ignores extra whitespace', () => {
    expect(splitHeadline([{ text: '  Hello   world ' }]).text).toBe('Hello world');
  });

  it('refuses headlines longer than the CSS delay classes cover', () => {
    expect(() => splitHeadline([{ text: 'x'.repeat(MAX_ANIMATED_CHARS + 1) }])).toThrow(/at most/);
  });
});

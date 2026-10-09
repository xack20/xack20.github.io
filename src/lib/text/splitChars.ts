/**
 * Splits a headline into per-character spans for the 3D flip-in. Words stay whole
 * (the component wraps each in a nowrap span) and indexes drive CSS delay classes d0…d39.
 */
export interface HeadlineSegment { readonly text: string; readonly gold?: boolean; readonly breakAfter?: boolean }
export interface HeadlineChar { readonly char: string; readonly index: number; readonly gold: boolean }
export type HeadlineToken =
  | { readonly kind: 'word'; readonly chars: readonly HeadlineChar[] }
  | { readonly kind: 'space' }
  | { readonly kind: 'break' };

export const MAX_ANIMATED_CHARS = 40;

interface Word { readonly text: string; readonly gold: boolean; readonly after: 'space' | 'break' | 'none' }

function toWords(segments: readonly HeadlineSegment[]): readonly Word[] {
  return segments.flatMap((segment, si) => {
    const parts = segment.text.trim().split(/\s+/).filter(Boolean);
    const isLastSegment = si === segments.length - 1;
    return parts.map((text, wi): Word => {
      const isLastWord = wi === parts.length - 1;
      const after = !isLastWord ? 'space' : isLastSegment ? 'none' : segment.breakAfter ? 'break' : 'space';
      return { text, gold: Boolean(segment.gold), after };
    });
  });
}

export function splitHeadline(segments: readonly HeadlineSegment[]): { text: string; tokens: readonly HeadlineToken[] } {
  const words = toWords(segments);
  const total = words.reduce((sum, w) => sum + [...w.text].length, 0);
  if (total > MAX_ANIMATED_CHARS) throw new Error(`Headlines can have at most ${MAX_ANIMATED_CHARS} letters; got ${total}.`);
  const starts = words.map((_, i) => words.slice(0, i).reduce((sum, w) => sum + [...w.text].length, 0));
  const tokens = words.flatMap((word, i): HeadlineToken[] => {
    const chars = [...word.text].map((char, ci) => ({ char, index: starts[i] + ci, gold: word.gold }));
    const tail: HeadlineToken[] = word.after === 'none' ? [] : [{ kind: word.after }];
    return [{ kind: 'word', chars }, ...tail];
  });
  const text = words.map((w) => w.text).join(' ');
  return { text, tokens };
}

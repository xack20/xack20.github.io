/** Search engines show roughly 160 characters of a description; longer text is cut mid-word. */
export const MAX_DESCRIPTION = 160;
/** Whole sentences shorter than this say too little; a word cut of the full text is better. */
export const MIN_USEFUL = 70;
const ELLIPSIS = '…';

export function metaDescription(text: string, max: number = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [];
  // Prefixes of whole sentences grow monotonically, so the last one that fits is the longest.
  const prefixes = sentences.map((_, i) => sentences.slice(0, i + 1).map((x) => x.trim()).join(' '));
  const fitted = [...prefixes].reverse().find((prefix) => prefix.length <= max) ?? '';
  if (fitted.length >= Math.min(MIN_USEFUL, max)) return fitted;
  const cut = clean.slice(0, max - ELLIPSIS.length);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}${ELLIPSIS}`;
}

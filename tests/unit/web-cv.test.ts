import { describe, expect, it } from 'vitest';
import { toWebVariant } from '../../scripts/cv/web-variant.mjs';

// Made-up passages. The real list lives in the gitignored scripts/cv/web-replacements.local.json.
const REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['I am the boss of the widget layer', 'I work on the widget layer'],
  ['Wrote acme-secret-hub, the servers', 'Wrote the servers'],
  [' Also fixed a scary hole in the frobnicator.', ''],
];
const SOURCE = `Header\n${REPLACEMENTS.map(([from]) => from).join('\n')}\nFooter`;

describe('toWebVariant', () => {
  it('applies every approved change', () => {
    const out = toWebVariant(SOURCE, REPLACEMENTS);
    expect(out).toBe('Header\nI work on the widget layer\nWrote the servers\n\nFooter');
  });

  it('also removes the phone segment', () => {
    const out = toWebVariant(`\\small Dhaka $|$ (+88) 01811223344 $|$\n${SOURCE}`, REPLACEMENTS);
    expect(out).not.toMatch(/01811223344/);
  });

  it('refuses a CV where an expected passage is missing, so a changed base CV cannot leak', () => {
    expect(() => toWebVariant(SOURCE.replace(REPLACEMENTS[1][0], ''), REPLACEMENTS)).toThrow(/not found/);
  });

  it('refuses a passage that appears twice', () => {
    expect(() => toWebVariant(`${SOURCE}\n${REPLACEMENTS[0][0]}`, REPLACEMENTS)).toThrow(/more than once/);
  });

  it('never prints the passage it could not find', () => {
    try {
      toWebVariant('nothing here', REPLACEMENTS);
    } catch (error) {
      expect(String(error)).not.toContain('acme-secret-hub');
    }
  });
});

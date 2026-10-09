import { describe, expect, it } from 'vitest';
import { loadConfidentialRules, parseConfidential } from '../../scripts/guards/confidential.mjs';
import { findViolations, stripCode } from '../../scripts/guards/rules.mjs';
import { stripPhone } from '../../scripts/cv/strip-phone.mjs';

// Made-up values only. Real confidential terms live in a gitignored file or a CI secret, never in tests.
const FAKE_LOCAL = '01811223344';
const FAKE_CONFIDENTIAL = ['# comment lines and blanks are ignored', '', 'acme-internal-hub', 'Zorblat', '/\\bQXZ\\b/', '/\\bTCK-\\d+/i'].join('\n');
const ids = (text: string, scope: 'site' | 'cv') => findViolations(text, scope).map((v) => v.rule);

describe('phone rules', () => {
  it.each([`(+88) ${FAKE_LOCAL}`, '+8801811223344', '+880 1811-223344', '01811-223344', '0181 122 3344', 'href="tel:+8801811223344"'])(
    'flags %s in both scopes',
    (text) => {
      expect(ids(`call ${text}`, 'site').some((id) => id.startsWith('phone'))).toBe(true);
      expect(ids(`call ${text}`, 'cv').some((id) => id.startsWith('phone'))).toBe(true);
    },
  );

  it.each(['205 tokens/s across 16 streams', '2,265 cases', 'max rating 1414', 'ICPC Dhaka Regional 2018', '5,000 transactions'])(
    'allows %s',
    (text) => expect(findViolations(text, 'site')).toEqual([]),
  );
});

describe('ownership rules', () => {
  it.each(['36 of 54 APIs', '953 of 2,739 commits', '36 of its 54 API endpoints', 'about 98% of the code', 'about two thirds of the code', '84 commits on top of', '3.8 s → 143 ms', '3,800 ms to 143 ms', 'about 64% mine', '62% yours', '#1 of two authors', '14.4k of 22.5k lines', 'unique non-merge commits', '169 of 495 tests'])(
    'flags %s',
    (text) => expect(findViolations(text, 'cv').length).toBeGreaterThan(0),
  );

  it.each(['10 of 146 normal questions', 'PIN questions pass 44 of 44', '98.7% of guard checks', 'a 368-question test set', 'most of its APIs'])(
    'allows %s',
    (text) => expect(findViolations(text, 'site')).toEqual([]),
  );
});

describe('site-only rules', () => {
  it.each(['our tech lead', '97% accuracy', '90%+ of tickets', 'a five-engineer team', 'an em dash — here', 'we leverage AI', 'a seamless flow'])(
    'flags %s on the site',
    (text) => expect(findViolations(text, 'site').length).toBeGreaterThan(0),
  );

  it('does not apply site-only rules to the CV', () => {
    expect(findViolations('Tech lead for the agentic AI layer', 'cv')).toEqual([]);
  });
});

describe('confidential rules', () => {
  const rules = parseConfidential(FAKE_CONFIDENTIAL);

  it('turns each non-comment line into a rule', () => {
    expect(rules).toHaveLength(4);
  });

  it.each(['see ACME-INTERNAL-HUB docs', 'thanks zorblat', 'the QXZ service', 'ticket tck-5377'])('flags %s on the site and in the CV', (text) => {
    expect(findViolations(text, 'site', rules).some((v) => v.rule.startsWith('confidential'))).toBe(true);
    expect(findViolations(text, 'cv', rules).some((v) => v.rule.startsWith('confidential'))).toBe(true);
  });

  it('respects regex boundaries', () => {
    expect(findViolations('chaos qxzy', 'site', rules)).toEqual([]);
  });

  it('never puts the confidential term in the rule id', () => {
    expect(rules.every((r) => /^confidential-\d+$/.test(r.id))).toBe(true);
  });

  it('prefers the GUARD_CONFIDENTIAL environment variable over the local file', () => {
    expect(loadConfidentialRules({ env: { GUARD_CONFIDENTIAL: 'Zorblat' }, file: '/nonexistent' })).toHaveLength(1);
  });

  it('returns no rules when neither source exists', () => {
    expect(loadConfidentialRules({ env: {}, file: '/nonexistent/confidential.local.txt' })).toEqual([]);
  });
});

describe('stripCode', () => {
  it('drops styles, executable scripts, the CSP meta and hashed asset paths but keeps JSON-LD and text', () => {
    const html = [
      '<meta http-equiv="content-security-policy" content="script-src \'sha256-x+QXZ/y=\'">',
      '<link rel="stylesheet" href="/_astro/index.QXZ-1.css">',
      '<style>.QXZ{}</style>',
      '<script type="module">const QXZ = 1</script>',
      '<script type="application/ld+json">{"name":"x"}</script>',
      '<meta name="description" content="hello">',
    ].join('');
    const out = stripCode(html);
    expect(out).not.toMatch(/QXZ/);
    expect(out).toContain('"name":"x"');
    expect(out).toContain('hello');
  });
});

describe('stripPhone', () => {
  it('removes the phone segment from the CV header line', () => {
    const tex = `\\small Dhaka, Bangladesh $|$ (+88) ${FAKE_LOCAL} $|$\n    \\href{mailto:me@example.com}{x}`;
    expect(stripPhone(tex)).toBe('\\small Dhaka, Bangladesh $|$\n    \\href{mailto:me@example.com}{x}');
  });

  it('leaves a CV without a phone number unchanged', () => {
    const tex = '\\small Dhaka, Bangladesh $|$ \\href{mailto:me@example.com}{x}';
    expect(stripPhone(tex)).toBe(tex);
  });

  it('throws when a phone number is left anywhere else', () => {
    expect(() => stripPhone(`Call me on ${FAKE_LOCAL}`)).toThrow(/phone/i);
  });
});

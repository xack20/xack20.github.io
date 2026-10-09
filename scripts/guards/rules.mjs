// Content rules for the published site and the public CV (spec §2, C1–C3 and C6).
// Every pattern is non-global so .test() and .match() stay stateless.

/** @typedef {'site' | 'cv' | 'repo'} Scope */
/** @typedef {{ id: string, pattern: RegExp, scopes: readonly Scope[] }} Rule */
/** @typedef {{ rule: string, match: string }} Violation */

/** @type {readonly Scope[]} */
const BOTH = Object.freeze(['site', 'cv']);
/** @type {readonly Scope[]} */
const SITE = Object.freeze(['site']);

/** @type {readonly Rule[]} */
export const RULES = Object.freeze([
  // C3: no phone numbers (Bangladesh formats) and no tel: links.
  { id: 'phone-bd-paren', pattern: /\(\+?88\)\s*0?1[3-9]/, scopes: BOTH },
  { id: 'phone-bd-intl', pattern: /\+?880[\s-]?1[3-9](?:[\s-]?\d){8}\b/, scopes: BOTH },
  { id: 'phone-bd-local', pattern: /\b01[3-9](?:[\s-]?\d){8}\b/, scopes: BOTH },
  { id: 'phone-tel-link', pattern: /href=["']tel:/i, scopes: BOTH },
  // C2: no ownership counts and no member-sync figure.
  { id: 'ownership-x-of-y', pattern: /\b\d[\d,.]*k?\s+of\s+(?:its\s+|the\s+)?\d[\d,.]*k?\s+(?:APIs?|API endpoints|endpoints|commits|lines|tests)\b/i, scopes: BOTH },
  { id: 'ownership-percent-mine', pattern: /\d\s*%\s+(?:mine|yours|his)\b/i, scopes: BOTH },
  { id: 'ownership-author-rank', pattern: /#\d+\s+of\s+(?:two|three|four|\d+)\s+(?:authors|contributors)\b/i, scopes: BOTH },
  { id: 'ownership-non-merge', pattern: /\bnon-merge\b/i, scopes: BOTH },
  { id: 'ownership-percent-of-code', pattern: /\d\s*%\s+of\s+(?:the\s+|its\s+)?(?:code|lines|commits)\b/i, scopes: BOTH },
  { id: 'ownership-two-thirds', pattern: /\btwo thirds of the code\b/i, scopes: BOTH },
  { id: 'ownership-commit-count', pattern: /\b\d[\d,]*\s+commits\b/i, scopes: BOTH },
  { id: 'member-sync-figure', pattern: /3[.,]?8(?:00)?\s*m?s\s*(?:→|->|to)\s*143\s*ms/i, scopes: BOTH },
  // Claims the owner asked not to make on the site.
  { id: 'claim-97-percent', pattern: /\b97\s?%/, scopes: SITE },
  { id: 'claim-90-plus', pattern: /\b90\s?%\s?\+/, scopes: SITE },
  { id: 'claim-five-engineer', pattern: /five-engineer/i, scopes: SITE },
  { id: 'claim-tech-lead', pattern: /\btech\s+lead\b/i, scopes: SITE },
  // C1 (employer internals, people) lives in confidential.mjs: those terms must never be in tracked source.
  // C6: human voice.
  { id: 'style-em-dash', pattern: /—/, scopes: SITE },
  {
    id: 'style-stock-word',
    pattern: /\b(?:leverag(?:e|es|ed|ing)|seamless(?:ly)?|robust|cutting-edge|spearhead(?:s|ed|ing)?|passionate|delv(?:e|es|ing)|synerg(?:y|ies)|empower(?:s|ed|ing)?|streamlin(?:e|es|ed|ing)|world-class|state-of-the-art|game-?changer)\b/i,
    scopes: SITE,
  },
]);

/**
 * @param {string} text
 * @param {Scope} scope
 * @param {readonly Rule[]} [extraRules] rules loaded at runtime, e.g. from confidential.mjs
 * @returns {Violation[]}
 */
export function findViolations(text, scope, extraRules = []) {
  return [...RULES, ...extraRules].filter((rule) => rule.scopes.includes(scope)).flatMap((rule) => {
    const match = text.match(rule.pattern);
    return match ? [{ rule: rule.id, match: match[0] }] : [];
  });
}

/**
 * Removes markup whose text is code or hashes (styles, executable scripts, the CSP meta,
 * hashed asset paths) so rules only see words a visitor or crawler reads. JSON-LD stays.
 * @param {string} html
 */
export function stripCode(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<meta\s+http-equiv=["']content-security-policy["'][^>]*>/gi, '')
    .replace(/(?:href|src)=["']\/_astro\/[^"']*["']/gi, '');
}

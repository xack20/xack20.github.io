import { RULES } from '../guards/rules.mjs';

// The CV header carries "(+88) 01XXXXXXXXX $|$" between the city and the email.
const PHONE_SEGMENT = /\s*\(\+?88\)\s*01[3-9]\d{8}\s*\$\|\$/g;
const PHONE_RULES = RULES.filter((rule) => rule.id.startsWith('phone'));

/**
 * Returns the LaTeX source without the phone segment. Throws if any phone number survives,
 * so a changed CV layout can never leak a number into the public PDF.
 * @param {string} tex
 */
export function stripPhone(tex) {
  const stripped = tex.replace(PHONE_SEGMENT, '');
  const leftover = PHONE_RULES.find((rule) => rule.pattern.test(stripped));
  if (leftover) {
    throw new Error(`A phone number is still in the CV after stripping (rule ${leftover.id}). Remove it by hand.`);
  }
  return stripped;
}

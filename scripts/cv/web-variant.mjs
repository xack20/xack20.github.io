import { stripPhone } from './strip-phone.mjs';

/**
 * Builds the public web copy of the CV: removes the phone segment, then applies the owner-approved
 * replacements ([from, to] pairs). The pairs themselves quote confidential passages, so they live in a
 * gitignored file and are passed in. Every passage must appear exactly once; anything else means the
 * base CV changed and a human must look, so the build stops without printing the passage.
 * @param {string} tex
 * @param {ReadonlyArray<readonly [string, string]>} replacements
 */
export function toWebVariant(tex, replacements) {
  return replacements.reduce((text, [from, to], index) => {
    const count = text.split(from).length - 1;
    if (count === 0) throw new Error(`Web-copy passage #${index + 1} was not found in the CV. Update the replacements file.`);
    if (count > 1) throw new Error(`Web-copy passage #${index + 1} appears more than once in the CV.`);
    return text.replace(from, () => to);
  }, stripPhone(tex));
}

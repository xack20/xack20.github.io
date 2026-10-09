// Confidential terms (employer internals, people, the owner's phone number) must never sit in tracked
// source, because this repo is public. They come from the GUARD_CONFIDENTIAL environment variable (a CI
// secret) or from the gitignored scripts/guards/confidential.local.txt.
// Format: one term per line. Plain lines match as case-insensitive substrings; lines written as
// /pattern/flags are regular expressions. Blank lines and lines starting with # are ignored.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LOCAL_FILE = fileURLToPath(new URL('./confidential.local.txt', import.meta.url));
/** @typedef {import('./rules.mjs').Rule} Rule */
/** @typedef {import('./rules.mjs').Scope} Scope */

/** @type {readonly Scope[]} */
const SCOPES = Object.freeze(['site', 'cv', 'repo']);
const REGEX_LINE = /^\/(.+)\/([a-z]*)$/;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function toPattern(line) {
  const literal = line.match(REGEX_LINE);
  return literal ? new RegExp(literal[1], literal[2].replace('g', '')) : new RegExp(escapeRegex(line), 'i');
}

/**
 * Rule ids are numbered, never named after the term, so logs can't leak it.
 * @param {string} text
 * @returns {Rule[]}
 */
export function parseConfidential(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, i) => ({ id: `confidential-${i + 1}`, pattern: toPattern(line), scopes: SCOPES }));
}

/**
 * @param {{ env?: Record<string, string | undefined>, file?: string }} [options]
 * @returns {Rule[]}
 */
export function loadConfidentialRules({ env = process.env, file = LOCAL_FILE } = {}) {
  if (env.GUARD_CONFIDENTIAL) return parseConfidential(env.GUARD_CONFIDENTIAL);
  return existsSync(file) ? parseConfidential(readFileSync(file, 'utf8')) : [];
}

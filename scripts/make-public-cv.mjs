#!/usr/bin/env node
// Usage: npm run cv -- <path to the base CV .tex>
// Builds the owner-approved safe web copy of the base CV: removes the phone segment and applies the
// replacements in the gitignored scripts/cv/web-replacements.local.json, then compiles with tectonic
// into public/cv.pdf. The base CV file is never modified.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { toWebVariant } from './cv/web-variant.mjs';

const OUT_DIR = 'cv';
const OUT_NAME = 'Zakaria_Hossain_Foysal_CV.public';
const PUBLIC_PDF = 'public/cv.pdf';
const REPLACEMENTS_FILE = 'scripts/cv/web-replacements.local.json';

const source = process.argv[2];
if (!source) {
  console.error('Usage: npm run cv -- <path to the base CV .tex>');
  process.exit(2);
}
if (!existsSync(REPLACEMENTS_FILE)) {
  console.error(`Missing ${REPLACEMENTS_FILE} (the private list of approved web-copy changes).`);
  process.exit(2);
}
const replacements = JSON.parse(await readFile(REPLACEMENTS_FILE, 'utf8'));
const tex = toWebVariant(await readFile(source, 'utf8'), replacements);
await mkdir(OUT_DIR, { recursive: true });
const texPath = path.join(OUT_DIR, `${OUT_NAME}.tex`);
await writeFile(texPath, tex);
execFileSync('tectonic', ['-X', 'compile', texPath, '--outdir', OUT_DIR], { stdio: 'inherit' });
await copyFile(path.join(OUT_DIR, `${OUT_NAME}.pdf`), PUBLIC_PDF);
console.log(`Wrote ${texPath} and ${PUBLIC_PDF}`);

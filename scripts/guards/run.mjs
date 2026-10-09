#!/usr/bin/env node
// Usage: node scripts/guards/run.mjs --dist dist [--cv public/cv.pdf] [--repo]
//   --dist  check the built site (all rules, scope "site")
//   --cv    check the public CV PDF text (scope "cv")
//   --repo  check every tracked text file for confidential terms (scope "repo"); this repo is public
// Exits 1 on any violation, 2 on a usage or setup problem. Never prints a matched phone number or
// confidential term, because CI logs are public.
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { extractText, getDocumentProxy } from 'unpdf';
import { loadConfidentialRules } from './confidential.mjs';
import { findViolations, stripCode } from './rules.mjs';

const SITE_EXTENSIONS = new Set(['.html', '.xml', '.txt']);
const REPO_TEXT_EXTENSIONS = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.tex', '.ts', '.txt', '.yml', '.yaml']);

async function listFiles(dir, extensions) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

async function checkFiles(files, scope, rules, { prepare = (text) => text, base = '.' } = {}) {
  const perFile = await Promise.all(
    files.map(async (file) => findViolations(prepare(await readFile(file, 'utf8'), file), scope, rules).map((v) => ({ file: path.relative(base, file), ...v }))),
  );
  return perFile.flat();
}

async function checkCv(pdfPath, rules) {
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(pdfPath)));
  const { text } = await extractText(pdf, { mergePages: true });
  return findViolations(text, 'cv', rules).map((v) => ({ file: pdfPath, ...v }));
}

function trackedTextFiles() {
  const listed = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  return listed.filter((file) => REPO_TEXT_EXTENSIONS.has(path.extname(file)));
}

const isSecret = (rule) => rule.startsWith('phone') || rule.startsWith('confidential');
const fail = (message) => {
  console.error(message);
  process.exit(2);
};

const { values } = parseArgs({ options: { dist: { type: 'string' }, cv: { type: 'string' }, repo: { type: 'boolean' } } });
if (!values.dist && !values.cv && !values.repo) fail('Usage: node scripts/guards/run.mjs --dist <dir> [--cv <pdf>] [--repo]');

const confidential = loadConfidentialRules();
if (confidential.length === 0) {
  fail('No confidential terms found. Set GUARD_CONFIDENTIAL (CI secret) or create scripts/guards/confidential.local.txt.');
}

const problems = [];
const checked = [];
if (values.dist) {
  const files = await listFiles(values.dist, SITE_EXTENSIONS);
  if (files.length === 0) fail(`No HTML, XML or TXT files in ${values.dist}. Run the build first.`);
  const prepare = (text, file) => (file.endsWith('.html') ? stripCode(text) : text);
  problems.push(...(await checkFiles(files, 'site', confidential, { prepare, base: values.dist })));
  checked.push(`${files.length} site files`);
}
if (values.cv) {
  problems.push(...(await checkCv(values.cv, confidential)));
  checked.push('the CV');
}
if (values.repo) {
  const files = trackedTextFiles();
  problems.push(...(await checkFiles(files, 'repo', confidential)));
  checked.push(`${files.length} tracked files`);
}

problems.forEach((p) => console.error(`✗ ${p.file}: ${p.rule} → "${isSecret(p.rule) ? '[redacted]' : p.match}"`));
if (problems.length > 0) process.exit(1);
console.log(`✓ Content guards passed: ${checked.join(', ')}.`);

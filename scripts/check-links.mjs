#!/usr/bin/env node
// Usage: node scripts/check-links.mjs dist
// Every site-relative href/src in the built HTML must point at a real file, and every
// #fragment on an internal link must exist as an id on the target page.
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const LINK_ATTR = /\s(?:href|src)="(\/(?!\/)[^"]*)"/g;

function targetFile(distDir, urlPath) {
  const clean = decodeURI(urlPath || '/');
  if (clean.endsWith('/')) return path.join(distDir, clean, 'index.html');
  if (path.extname(clean)) return path.join(distDir, clean);
  return path.join(distDir, clean, 'index.html');
}

function brokenLinks(distDir, page, htmlByFile) {
  return [...page.html.matchAll(LINK_ATTR)].flatMap(([, link]) => {
    const [pathPart, fragment] = link.split('#');
    const target = targetFile(distDir, pathPart.split('?')[0]);
    const from = path.relative(distDir, page.file);
    if (!existsSync(target)) return [`${from} → ${link} (missing ${path.relative(distDir, target)})`];
    if (fragment && !(htmlByFile.get(target) ?? '').includes(`id="${fragment}"`)) return [`${from} → ${link} (no #${fragment})`];
    return [];
  });
}

const distDir = process.argv[2];
if (!distDir) {
  console.error('Usage: node scripts/check-links.mjs <dist dir>');
  process.exit(2);
}
const entries = await readdir(distDir, { withFileTypes: true, recursive: true });
const htmlFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => path.join(e.parentPath, e.name));
const pages = await Promise.all(htmlFiles.map(async (file) => ({ file, html: await readFile(file, 'utf8') })));
const htmlByFile = new Map(pages.map((page) => [page.file, page.html]));
const broken = pages.flatMap((page) => brokenLinks(distDir, page, htmlByFile));
broken.forEach((line) => console.error(`✗ ${line}`));
if (broken.length > 0) process.exit(1);
console.log(`✓ Internal links resolve across ${pages.length} pages.`);

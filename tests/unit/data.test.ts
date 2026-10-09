import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfidentialRules } from '../../scripts/guards/confidential.mjs';
import { findViolations } from '../../scripts/guards/rules.mjs';
import { PILLARS } from '../../src/data/home';
import { PATH } from '../../src/data/path';
import { LINKS, NAV, SITE, personJsonLd } from '../../src/data/site';
import { SKILLS } from '../../src/data/skills';
import { CONTESTS, EDUCATION, ROLES } from '../../src/data/experience';
import { WRITING } from '../../src/data/writing';

const WORK_DIR = path.resolve('src/content/work');
const PROJECTS_DIR = path.resolve('src/content/projects');
const SLUGS = [
  'agent-evals-guardrails', 'agentic-cms-assistant', 'card-reporting-data', 'hisaab', 'kon-ai-nagad', 'mcp-tool-servers',
  'ncp-fabric', 'nid-kyc', 'self-hosted-llms-rag', 'tag-explorer', 'whichllm-scraper-fix',
];
const PROJECT_SLUGS = [
  'adda', 'claude-code-tooling', 'deliveryexpress', 'fabric-samples', 'kona-identity-provider', 'lmcanvas', 'running-the-agent-stack',
];
const listSlugs = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
// Empty when no private list is available; scripts/guards/run.mjs fails closed in that case.
const CONFIDENTIAL = loadConfidentialRules();

describe('site data', () => {
  it('passes every site content rule', () => {
    const all = JSON.stringify({ SITE, LINKS, NAV, PILLARS, PATH, WRITING, SKILLS, personJsonLd, ROLES, EDUCATION, CONTESTS });
    expect(findViolations(all, 'site', CONFIDENTIAL)).toEqual([]);
  });

  it('uses https for every external link and site-relative paths for internal ones', () => {
    const hrefs = [...Object.values(LINKS), ...WRITING.map((w) => w.href)].filter((href) => !href.startsWith('mailto:'));
    hrefs.forEach((href) => expect(href).toMatch(/^(https:\/\/|\/[a-z-]+\/)/));
  });

  it('keeps nav links site-relative with trailing slashes', () => {
    NAV.forEach((item) => expect(item.href).toMatch(/^\/(?:[a-z]+\/)?(?:#[a-z]+)?$/));
  });

  it('shows three writing items and four path items on the home page', () => {
    expect(WRITING.filter((w) => w.home)).toHaveLength(3);
    expect(PATH.filter((p) => p.home)).toHaveLength(4);
  });

  it('offers only email, LinkedIn and GitHub as contact', () => {
    expect(LINKS.email).toBe('mailto:zakariahossain20@gmail.com');
    expect(SITE.email).toBe('zakariahossain20@gmail.com');
  });
});

describe('case-study markdown', () => {
  it('has exactly the agreed case studies', () => {
    expect(listSlugs(WORK_DIR)).toEqual(SLUGS);
  });

  it.each(SLUGS)('%s passes every site content rule', (slug) => {
    const text = readFileSync(path.join(WORK_DIR, `${slug}.md`), 'utf8');
    expect(findViolations(text, 'site', CONFIDENTIAL)).toEqual([]);
  });

  it.each(SLUGS)('%s has the case-study body sections', (slug) => {
    const text = readFileSync(path.join(WORK_DIR, `${slug}.md`), 'utf8');
    ['## How it works', '## Key decisions'].forEach((h) => expect(text).toContain(h));
    expect(text.includes('## What made it hard') || text.includes('## Results')).toBe(true);
  });
});

describe('project markdown', () => {
  it('has exactly the agreed projects', () => {
    expect(listSlugs(PROJECTS_DIR)).toEqual(PROJECT_SLUGS);
  });

  it.each(PROJECT_SLUGS)('%s passes every site content rule', (slug) => {
    const text = readFileSync(path.join(PROJECTS_DIR, `${slug}.md`), 'utf8');
    expect(findViolations(text, 'site', CONFIDENTIAL)).toEqual([]);
  });
});

describe('accuracy fixes from the final review', () => {
  const read = (file: string) => readFileSync(path.resolve(file), 'utf8');

  it('does not overstate the approval guarantee in the flagship case study', () => {
    const cms = read('src/content/work/agentic-cms-assistant.md');
    ['nothing is written until', "can't save anything", 'before anything is saved', 'Anything beyond a draft goes to', 'every write'].forEach((p) =>
      expect(cms).not.toContain(p),
    );
    expect(read('src/pages/about.astro')).not.toContain('keeps every write behind a person');
  });

  it('makes no claims the evidence does not support', () => {
    expect(read('src/components/Footer.astro')).not.toContain('Built by hand');
    expect(read('src/pages/lab.astro')).not.toContain('different people');
    expect(read('src/pages/about.astro')).not.toContain('six years on banking and payments');
  });

  it('says which Hisaab features are not in the public repo yet', () => {
    expect(read('src/content/work/hisaab.md')).toContain("aren't in the public repo yet");
  });
});

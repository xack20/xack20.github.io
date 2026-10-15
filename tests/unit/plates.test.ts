import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, legendOf, MARKS, toPlates, type Category, type WorkEntry } from '../../src/lib/scene/plates';

const WORK_DIR = path.resolve('src/content/work');
const CATEGORY_OF: Readonly<Record<string, Category>> = {
  'agentic-cms-assistant': 'agents', 'mcp-tool-servers': 'agents', 'agent-evals-guardrails': 'agents', 'kon-ai-nagad': 'agents', 'self-hosted-llms-rag': 'agents',
  'tag-explorer': 'payments', 'card-reporting-data': 'payments', 'ncp-fabric': 'payments',
  'nid-kyc': 'personal', hisaab: 'personal', 'whichllm-scraper-fix': 'personal',
};
const LABELS: Readonly<Record<Category, string>> = { agents: 'A', payments: 'B', personal: 'C' };

/** One top-level scalar from a markdown file's frontmatter, without its quotes. */
const field = (text: string, name: string): string => {
  const frontmatter = text.split('---')[1] ?? '';
  const value = new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1] ?? '';
  return value.trim().replace(/^"(.*)"$/, '$1');
};

/** The real case studies, read the way the content collection hands them to the page. */
const realEntries = (): readonly WorkEntry[] =>
  readdirSync(WORK_DIR).filter((file) => file.endsWith('.md')).map((file) => {
    const text = readFileSync(path.join(WORK_DIR, file), 'utf8');
    return {
      id: file.replace(/\.md$/, ''),
      data: { card: field(text, 'card'), meta: field(text, 'meta'), status: field(text, 'status'), order: Number(field(text, 'order')), category: field(text, 'category') as Category },
    };
  });

const entry = (id: string, order: number, meta = 'Org · Domain · 2026'): WorkEntry => ({ id, data: { card: `Name of ${id}`, meta, status: 'Done', order, category: 'payments' } });

describe('toPlates with the real case studies', () => {
  const plates = toPlates(realEntries());

  it('makes eleven plates, numbered 01 to 11 in order', () => {
    expect(plates.map((plate) => plate.number)).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
  });

  it('links every plate to its case-study page', () => {
    plates.forEach((plate) => expect(plate.href).toBe(`/work/${plate.slug}/`));
    expect(new Set(plates.map((plate) => plate.slug)).size).toBe(plates.length);
  });

  it('puts every case study in its agreed category, with that category\'s mark', () => {
    expect(Object.fromEntries(plates.map((plate) => [plate.slug, plate.category]))).toEqual(CATEGORY_OF);
    plates.forEach((plate) => expect(plate.mark).toBe(MARKS[plate.category]));
  });

  it('fills in the name, organisation, domain, year and status of every plate', () => {
    plates.forEach((plate) => {
      [plate.name, plate.org, plate.domain, plate.year, plate.status].forEach((text) => expect(text.trim()).not.toBe(''));
    });
    expect(plates[0]).toMatchObject({ slug: 'agentic-cms-assistant', org: 'KONA', domain: 'Card management', year: '2026', status: 'In active development' });
  });
});

describe('toPlates', () => {
  it('sorts by order without changing the list it was given', () => {
    const entries = Object.freeze([entry('b', 2), entry('c', 3), entry('a', 1)]);

    expect(toPlates(entries).map((plate) => plate.slug)).toEqual(['a', 'b', 'c']);
    expect(entries.map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });

  it('pads the number to two digits and takes the name from the card title', () => {
    expect(toPlates([entry('x', 7)])[0]).toMatchObject({ number: '07', name: 'Name of x', href: '/work/x/' });
    expect(toPlates([entry('y', 12)])[0]?.number).toBe('12');
  });

  it('leaves missing parts of the meta line empty', () => {
    expect(toPlates([entry('x', 1, 'Only org')])[0]).toMatchObject({ org: 'Only org', domain: '', year: '' });
  });
});

describe('categories', () => {
  it('gives each category a mark of its own', () => {
    expect(new Set(CATEGORIES.map((category) => MARKS[category])).size).toBe(CATEGORIES.length);
  });

  it('counts the plates in each category for the legend, in category order', () => {
    expect(legendOf(toPlates(realEntries()), LABELS)).toEqual([
      { category: 'agents', label: 'A', count: 5 },
      { category: 'payments', label: 'B', count: 3 },
      { category: 'personal', label: 'C', count: 3 },
    ]);
  });
});

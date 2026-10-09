import { describe, expect, it } from 'vitest';
import { metaDescription } from '../../src/lib/seo/description';
import { articleNode, breadcrumbNode, graph, PERSON_ID, profileNode, websiteNode } from '../../src/lib/seo/schema';

describe('metaDescription', () => {
  it('keeps a description that already fits', () => {
    expect(metaDescription('A short and complete description of the page.')).toBe('A short and complete description of the page.');
  });

  it('keeps whole sentences when the text is too long', () => {
    const text = 'First sentence is here and it is fine. Second sentence adds more detail. ' + 'Third sentence is long enough to push the total past the limit for sure, without question.';
    expect(metaDescription(text, 80)).toBe('First sentence is here and it is fine. Second sentence adds more detail.');
  });

  it('falls back to a word cut when the sentences that fit are too short to be useful', () => {
    const text = 'Short first sentence. ' + 'A much longer second sentence that carries the real detail and goes on for quite a while beyond the limit.';
    const out = metaDescription(text, 90);
    expect(out.length).toBeGreaterThan(70);
    expect(out.length).toBeLessThanOrEqual(90);
    expect(out.endsWith('…')).toBe(true);
  });

  it('cuts a single long sentence at a word boundary with an ellipsis', () => {
    const out = metaDescription('word '.repeat(60).trim(), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe('structured data', () => {
  it('wraps nodes in one schema.org graph', () => {
    expect(graph([websiteNode])).toEqual({ '@context': 'https://schema.org', '@graph': [websiteNode] });
  });

  it('builds breadcrumbs with absolute URLs and positions', () => {
    const node = breadcrumbNode([{ name: 'Work', path: '/work/' }, { name: 'Tag Explorer', path: '/work/tag-explorer/' }]);
    expect(node['@type']).toBe('BreadcrumbList');
    expect(node.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://xack20.github.io/' },
      { '@type': 'ListItem', position: 2, name: 'Work', item: 'https://xack20.github.io/work/' },
      { '@type': 'ListItem', position: 3, name: 'Tag Explorer', item: 'https://xack20.github.io/work/tag-explorer/' },
    ]);
  });

  it('builds an article authored by the owner', () => {
    const node = articleNode({ title: 'T', description: 'D', path: '/work/x/', published: new Date('2026-10-09') });
    expect(node).toMatchObject({ '@type': 'Article', headline: 'T', description: 'D', author: { '@id': PERSON_ID }, datePublished: '2026-10-09' });
    expect(node.mainEntityOfPage).toBe('https://xack20.github.io/work/x/');
  });

  it('builds a profile page about the owner', () => {
    expect(profileNode('/about/')).toMatchObject({ '@type': 'ProfilePage', mainEntity: { '@id': PERSON_ID }, url: 'https://xack20.github.io/about/' });
  });
});

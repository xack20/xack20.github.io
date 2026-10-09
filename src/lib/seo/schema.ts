/** schema.org structured data shared by every page. All nodes live in one @graph per page. */
import { SITE, personJsonLd } from '../../data/site';

export const PERSON_ID = `${SITE.url}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;
const absolute = (path: string): string => new URL(path, `${SITE.url}/`).toString();

export interface Crumb { readonly name: string; readonly path: string }

const { '@context': _context, ...person } = personJsonLd;
export const personNode = { ...person, '@id': PERSON_ID } as const;

export const websiteNode = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE.url}/`,
  name: SITE.name,
  description: SITE.description,
  inLanguage: 'en',
  publisher: { '@id': PERSON_ID },
} as const;

export function graph(nodes: readonly object[]): { '@context': string; '@graph': readonly object[] } {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function breadcrumbNode(trail: readonly Crumb[]) {
  const items = [{ name: 'Home', path: '/' }, ...trail];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, name: crumb.name, item: absolute(crumb.path) })),
  } as const;
}

export function articleNode({ title, description, path, published }: { title: string; description: string; path: string; published: Date }) {
  return {
    '@type': 'Article',
    headline: title,
    description,
    url: absolute(path),
    mainEntityOfPage: absolute(path),
    image: absolute('/og.png'),
    datePublished: published.toISOString().slice(0, 10),
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  } as const;
}

export function profileNode(path: string) {
  return { '@type': 'ProfilePage', url: absolute(path), mainEntity: { '@id': PERSON_ID }, isPartOf: { '@id': WEBSITE_ID } } as const;
}

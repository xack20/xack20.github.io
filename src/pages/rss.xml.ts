import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';

export async function GET(context: APIContext): Promise<Response> {
  const work = (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: work.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      link: `/work/${entry.id}/`,
      pubDate: entry.data.published,
    })),
  });
}

import { getCollection } from 'astro:content';
import { LINKS, SITE } from '../data/site';

export async function GET(): Promise<Response> {
  const work = (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
  const projects = (await getCollection('projects')).filter((p) => p.data.page).sort((a, b) => a.data.order - b.data.order);
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.role} in ${SITE.location}. ${SITE.description}`,
    '',
    '## Case studies',
    ...work.map((e) => `- [${e.data.title}](${SITE.url}/work/${e.id}/): ${e.data.summary}`),
    '',
    '## Projects',
    ...projects.map((p) => `- [${p.data.title}](${SITE.url}/projects/${p.id}/): ${p.data.summary}`),
    '',
    '## Pages',
    `- [Experience](${SITE.url}/experience/): every role, with what I built in each.`,
    `- [Lab](${SITE.url}/lab/): working, in-browser demos of the approval flow, PIN-safe screen matching, the lookup check and offline signing.`,
    `- [Writing and open source](${SITE.url}/writing/)`,
    `- [About](${SITE.url}/about/)`,
    `- [CV (PDF)](${SITE.url}${SITE.cvPath})`,
    '',
    '## Contact',
    `- Email: ${SITE.email}`,
    `- LinkedIn: ${LINKS.linkedin}`,
    `- GitHub: ${LINKS.github}`,
    `- Codeforces: ${LINKS.codeforces}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

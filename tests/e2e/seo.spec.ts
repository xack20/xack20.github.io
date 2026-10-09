import { expect, test, type Page } from '@playwright/test';

const SITE = 'https://xack20.github.io';
const WORK = [
  'agentic-cms-assistant', 'mcp-tool-servers', 'agent-evals-guardrails', 'kon-ai-nagad', 'self-hosted-llms-rag', 'tag-explorer',
  'card-reporting-data', 'ncp-fabric', 'nid-kyc', 'hisaab', 'whichllm-scraper-fix',
];
const PROJECTS = ['running-the-agent-stack', 'kona-identity-provider', 'lmcanvas', 'claude-code-tooling', 'adda'];
const PAGES = [
  '/', '/work/', ...WORK.map((s) => `/work/${s}/`), '/projects/', ...PROJECTS.map((s) => `/projects/${s}/`),
  '/experience/', '/lab/', '/writing/', '/about/',
];
const DESCRIPTION = { min: 50, max: 160 };

const jsonLdTypes = async (page: Page): Promise<string[]> => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const data = JSON.parse(text);
    const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    return nodes.map((n: { '@type': string }) => n['@type']);
  });
};

test.describe('search metadata', () => {
  test.skip(({ isMobile }) => isMobile, 'metadata is the same on every viewport');

  test('every page has a unique title, a good-length description and complete social tags', async ({ page }) => {
    const titles = new Set<string>();
    for (const path of PAGES) {
      await page.goto(path);
      const title = await page.title();
      expect(title.length, `${path} title`).toBeGreaterThan(10);
      expect(titles.has(title), `${path} duplicate title "${title}"`).toBe(false);
      titles.add(title);
      const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
      expect(description.length, `${path} description "${description}"`).toBeGreaterThanOrEqual(DESCRIPTION.min);
      expect(description.length, `${path} description "${description}"`).toBeLessThanOrEqual(DESCRIPTION.max);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${path}`);
      for (const selector of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image:alt"]', 'meta[property="og:locale"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'meta[name="author"]']) {
        await expect(page.locator(selector), `${path} ${selector}`).toHaveCount(1);
      }
    }
  });

  test('pages carry the right structured data', async ({ page }) => {
    await page.goto('/');
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(['Person', 'WebSite']));
    for (const path of ['/about/', '/experience/']) {
      await page.goto(path);
      expect(await jsonLdTypes(page), path).toEqual(expect.arrayContaining(['ProfilePage', 'BreadcrumbList']));
    }
    for (const path of ['/work/mcp-tool-servers/', '/projects/lmcanvas/']) {
      await page.goto(path);
      expect(await jsonLdTypes(page), path).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']));
    }
  });

  test('the sitemap lists every page with a last-modified date and leaves out the 404', async ({ request }) => {
    const index = await (await request.get('/sitemap-index.xml')).text();
    const sitemapPath = new URL(index.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '').pathname;
    const sitemap = await (await request.get(sitemapPath)).text();
    for (const path of PAGES) expect(sitemap, path).toContain(`<loc>${SITE}${path}</loc>`);
    expect(sitemap).toContain('<lastmod>');
    expect(sitemap).not.toContain('404');
  });
});

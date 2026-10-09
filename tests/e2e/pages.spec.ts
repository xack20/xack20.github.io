import { expect, test } from '@playwright/test';

test('about shows the path, skills, contests and links', async ({ page }) => {
  await page.goto('/about/');
  for (const name of ['How I work', 'Path', 'What I work with', 'Competitive programming', 'Elsewhere']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Web Developer, iTech Soft Solutions & Semicolon IT Solutions')).toBeVisible();
});

test('writing links both Medium articles and the open-source pages', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page.locator('main a[href^="https://medium.com/@zakariahossain/"]')).toHaveCount(2);
  await expect(page.locator('main a[href="/work/whichllm-scraper-fix/"]')).toHaveCount(1);
  await expect(page.locator('main a[href="/projects/lmcanvas/"]')).toHaveCount(1);
});

test('unknown URLs get the themed 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText("isn't on the map");
  await expect(page.getByRole('link', { name: 'Back to the start' })).toHaveAttribute('href', '/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});

test('inner pages can reach the home contact section', async ({ page }) => {
  await page.goto('/work/');
  await page.goto('/#contact');
  await expect(page.locator('#contact')).toBeInViewport();
});

const FILES: ReadonlyArray<readonly [string, string]> = [
  ['/rss.xml', 'xml'],
  ['/sitemap-index.xml', 'xml'],
  ['/robots.txt', 'text/plain'],
  ['/llms.txt', 'text/plain'],
  ['/og.png', 'image/png'],
  ['/favicon.svg', 'image/svg'],
];

for (const [path, type] of FILES) {
  test(`${path} is served as ${type}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(type);
  });
}

import { expect, test } from '@playwright/test';

const SLUGS = [
  'agentic-cms-assistant', 'mcp-tool-servers', 'agent-evals-guardrails', 'kon-ai-nagad', 'self-hosted-llms-rag', 'tag-explorer',
  'card-reporting-data', 'ncp-fabric', 'nid-kyc', 'hisaab', 'whichllm-scraper-fix',
];

test('the work index links every case study, grouped', async ({ page }) => {
  await page.goto('/work/');
  for (const slug of SLUGS) await expect(page.locator(`main a[href="/work/${slug}/"]`)).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'At KONA', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personal and open source', exact: true })).toBeVisible();
});

test('the projects index links every project page and groups them', async ({ page }) => {
  await page.goto('/projects/');
  for (const slug of ['running-the-agent-stack', 'kona-identity-provider', 'lmcanvas', 'claude-code-tooling', 'adda']) {
    await expect(page.locator(`main a[href="/projects/${slug}/"]`)).toHaveCount(1);
  }
  for (const name of ['At KONA', 'Personal', 'Open source', 'Earlier work']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
});

for (const slug of SLUGS) {
  test(`${slug} has the full case-study structure`, async ({ page }) => {
    await page.goto(`/work/${slug}/`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const name of ['In plain terms', 'How it works', 'Key decisions', 'Stack']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /^(What made it hard|Results)$/ })).toBeVisible();
    await expect(page.locator('figure.flow svg:visible')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Next case study' })).toBeVisible();
  });
}

test('diagrams run left to right on desktop and top to bottom on phones', async ({ page }, info) => {
  await page.goto('/work/agentic-cms-assistant/');
  const expected = info.project.name === 'mobile' ? 'vertical' : 'horizontal';
  await expect(page.locator(`figure.flow svg.${expected}`)).toBeVisible();
});

test('Tag Explorer credits the teammate', async ({ page }) => {
  await page.goto('/work/tag-explorer/');
  await expect(page.getByText('My teammate built the core batch pipeline')).toBeVisible();
});

test('Hisaab links its public repo', async ({ page }) => {
  await page.goto('/work/hisaab/');
  await expect(page.getByRole('link', { name: 'Public repo (behind my local build)' })).toHaveAttribute('href', 'https://github.com/xack20/finance-app');
});

test('diagram node labels keep their own case and spacing', async ({ page }) => {
  await page.goto('/work/agentic-cms-assistant/');
  const label = page.locator('figure.flow svg:visible text.node-label').first();
  await expect(label).toHaveCSS('text-transform', 'none');
  await expect(label).toHaveCSS('letter-spacing', 'normal');
});

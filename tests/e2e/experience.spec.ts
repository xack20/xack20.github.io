import { expect, test } from '@playwright/test';

const ROLES = [
  ['Senior Software Engineer', 'Jan 2025 – Present'],
  ['Software Engineer, Level 2', 'Jul 2022 – Dec 2024'],
  ['Software Engineer', 'Apr 2021 – Jun 2022'],
  ['Web Developer', 'Jul 2020 – Mar 2021'],
] as const;

test('experience lists every role with its dates', async ({ page }) => {
  await page.goto('/experience/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const [title, dates] of ROLES) {
    const role = page.locator('article.role', { has: page.getByRole('heading', { name: title, exact: true }) });
    await expect(role).toContainText(dates);
  }
});

test('experience links bullets to their case studies', async ({ page }) => {
  await page.goto('/experience/');
  for (const href of ['/work/agentic-cms-assistant/', '/work/mcp-tool-servers/', '/work/ncp-fabric/', '/work/tag-explorer/']) {
    await expect(page.locator(`article.role a[href="${href}"]`).first()).toBeVisible();
  }
});

test('experience shows education, thesis and contests', async ({ page }) => {
  await page.goto('/experience/');
  await expect(page.getByText('CGPA 3.74/4.00')).toBeVisible();
  await expect(page.getByText(/deep learning on financial transaction data/i)).toBeVisible();
  await expect(page.getByText(/286 rated contests/)).toBeVisible();
});

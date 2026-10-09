import { expect, test } from '@playwright/test';
import { collectErrors, expectNoAxeViolations, expectNoHorizontalScroll } from './helpers';

test('the hero headline has a clean accessible name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Engineering trust into AI agents');
});

test('selected work shows a curated set, featured first, and links to all case studies', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#work .work-grid > a');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toHaveAttribute('href', '/work/agentic-cms-assistant/');
  await expect(page.locator('#work a[href="/work/mcp-tool-servers/"]')).toHaveCount(1);
  await expect(page.locator('#work a.more[href="/work/"]')).toBeVisible();
});

test('pillars link to their deep dives and the path links to the full experience', async ({ page }) => {
  await page.goto('/');
  for (const href of ['/work/agent-evals-guardrails/', '/work/self-hosted-llms-rag/', '/work/ncp-fabric/']) {
    await expect(page.locator(`#what a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(page.locator('#path a[href="/experience/"]')).toBeVisible();
  await expect(page.locator('#what')).not.toContainText('millions');
});

test('contact offers email, LinkedIn, GitHub and the CV, and no phone', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', 'mailto:zakariahossain20@gmail.com');
  await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/zakaria-hossain-b34446160');
  await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/xack20');
  await expect(contact.getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', '/cv.pdf');
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test('the constellation canvas is sized to the hero', async ({ page }) => {
  await page.goto('/');
  const size = await page.locator('canvas[data-constellation]').evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
});

test('the home lab works in place', async ({ page }) => {
  await page.goto('/');
  await page.locator('#lab button[data-action="propose"]').click();
  await page.locator('#lab button[data-action="commit"]').click();
  await expect(page.locator('#lab [data-log]')).toContainText("can't approve its own write");
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the headline and every section at once, and passes axe', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    expect(await page.locator('.ch').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('.reveal.pending')).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
});

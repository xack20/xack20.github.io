import { expect, test } from '@playwright/test';
import { collectErrors, expectNoAxeViolations, expectNoHorizontalScroll } from './helpers';

const WORK = [
  'agentic-cms-assistant', 'mcp-tool-servers', 'agent-evals-guardrails', 'kon-ai-nagad', 'self-hosted-llms-rag', 'tag-explorer',
  'card-reporting-data', 'ncp-fabric', 'nid-kyc', 'hisaab', 'whichllm-scraper-fix',
];
const PROJECTS = ['running-the-agent-stack', 'kona-identity-provider', 'lmcanvas', 'claude-code-tooling', 'adda'];
const PAGES = [
  '/', '/work/', ...WORK.map((s) => `/work/${s}/`), '/projects/', ...PROJECTS.map((s) => `/projects/${s}/`),
  '/experience/', '/lab/', '/writing/', '/about/',
];

test.describe('every page, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of PAGES) {
    test(`${path}: one h1, axe clean, fits the screen, no console errors`, async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.reveal.pending')).toHaveCount(0);
      await expectNoAxeViolations(page);
      await expectNoHorizontalScroll(page);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('every page, no JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of PAGES) {
    test(`${path}: all content is visible`, async ({ page }) => {
      await page.goto(path);
      const hidden = await page.locator('.reveal').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
      expect(hidden).toBe(0);
      await expect(page.locator('main')).toContainText(/\w{3,}/);
    });
  }
});

test('focus is visible on links and buttons', async ({ page }) => {
  await page.goto('/lab/');
  const button = page.locator('button[data-action="propose"]');
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await button.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

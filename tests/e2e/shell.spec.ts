import { expect, test } from '@playwright/test';
import { collectErrors, expectNoHorizontalScroll } from './helpers';

const SECTIONS = ['Work', 'Projects', 'Experience', 'Lab', 'Writing', 'About', 'Contact'];

test('the skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('desktop nav shows every section and the CV button', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop layout only');
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const name of SECTIONS) await expect(nav.getByRole('link', { name })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', '/cv.pdf');
});

test('the mobile menu opens and lists every section', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile layout only');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
  await page.locator('summary', { hasText: 'Menu' }).click();
  const menu = page.getByRole('navigation', { name: 'Mobile' });
  for (const name of SECTIONS) await expect(menu.getByRole('link', { name })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('pages load without console errors or CSP violations', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('every page carries SEO, social and CSP metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Zakaria Hossain Foysal/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://xack20.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://xack20.github.io/og.png');
  await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
});

test('the mobile menu closes after choosing a same-page link', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile layout only');
  await page.goto('/');
  const menu = page.locator('details.menu');
  await menu.locator('summary').click();
  await menu.getByRole('link', { name: 'Contact' }).click();
  await expect(menu).not.toHaveAttribute('open', '');
  await expect(page.locator('#contact')).toBeInViewport();
});

test('Escape closes the mobile menu and returns focus to its button', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile layout only');
  await page.goto('/');
  const summary = page.locator('details.menu summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.menu')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('details.menu')).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
});

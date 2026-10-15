import { expect, test, type Page } from '@playwright/test';
import { collectErrors, expectNoAxeViolations, expectNoHorizontalScroll } from './helpers';

const NAME = 'Zakaria Hossain Foysal';
const CASE_STUDIES = 11;
const PLATE_LINKS = 'a.scene-plate[href^="/work/"]';
const LIT_GATES = '.signal-gate-frame--lit';
/** How long the scroll springs need to come to rest after a jump. */
const SETTLE_MS = 1800;
const MAX_TABS = 40;

const opacities = (page: Page, selector: string): Promise<number[]> =>
  page.locator(selector).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));

test('the headline is the name, and every case study is a plate linking to its page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(NAME);
  await expect(page.locator(PLATE_LINKS)).toHaveCount(CASE_STUDIES);
  const hrefs = await page.locator(PLATE_LINKS).evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  for (const href of hrefs) expect(href).toMatch(/^\/work\/[a-z0-9-]+\/$/);
  expect(errors).toEqual([]);
});

test('the path links to the full experience, and contact offers email, LinkedIn, GitHub and the CV but no phone', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#path a[href="/experience/"]')).toBeVisible();
  const contact = page.locator('#contact');
  await expect(contact.locator('a[href="mailto:zakariahossain20@gmail.com"]').first()).toBeVisible();
  await expect(contact.locator('a[href="https://www.linkedin.com/in/zakaria-hossain-b34446160"]').first()).toBeVisible();
  await expect(contact.locator('a[href="https://github.com/xack20"]').first()).toBeVisible();
  await expect(contact.locator('a[href="/cv.pdf"]').first()).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test('scrolling settles the plates into the wall, then plays the approval through all three gates', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the scrubbed wall is the desktop layout');
  const errors = collectErrors(page);
  await page.goto('/');
  // The server render is the short still layout; wait for the moving one before measuring scroll.
  await expect(page.locator('.scene-beat')).toHaveAttribute('data-mode', 'full');
  await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect(page.locator('.scene-group[data-settled]')).toHaveCount(1, { timeout: 8000 });

  await page.locator('#approval').evaluate((section: HTMLElement) => window.scrollTo(0, section.offsetTop + section.offsetHeight - window.innerHeight));
  await page.waitForTimeout(SETTLE_MS);
  await expect.poll(() => opacities(page, LIT_GATES), { timeout: 8000 }).toEqual([1, 1, 1]);
  expect(errors).toEqual([]);
});

test('tabbing onto a plate before the wall has formed brings the wall into view', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the deck plates are links only in the desktop layout');
  await page.goto('/');
  await expect(page.locator('.scene-beat')).toHaveAttribute('data-mode', 'full');
  for (let presses = 0; presses < MAX_TABS; presses += 1) {
    await page.keyboard.press('Tab');
    const onPlate = await page.evaluate(() => document.activeElement?.classList.contains('scene-plate') ?? false);
    if (onPlate) break;
  }
  await expect(page.locator('a.scene-plate:focus')).toHaveCount(1);
  await expect(page.locator('.scene-group[data-settled]')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('a.scene-plate:focus')).toBeInViewport();
});

test('on a 360px phone nothing scrolls sideways and the name fits', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await expectNoHorizontalScroll(page);
  const right = await page.getByRole('heading', { level: 1 }).evaluate((h1) => h1.getBoundingClientRect().right);
  expect(right).toBeLessThanOrEqual(360);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows a still first screen, all case studies in page flow and the approval as a still, and passes axe', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('.scene-beat')).toHaveAttribute('data-mode', 'still');
    await expect(page.locator('.signal-track')).toHaveCount(0);
    await expect(page.locator('#work .scene-list__grid > li')).toHaveCount(CASE_STUDIES);
    await expect(page.locator('#work .scene-list__grid a').first()).toBeVisible();
    await page.locator('#approval').scrollIntoViewIfNeeded();
    await expect.poll(() => opacities(page, LIT_GATES)).toEqual([1, 1, 1]);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
});

test.describe('with JavaScript off', () => {
  test.use({ javaScriptEnabled: false });

  test('still lists every case study as a visible link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(NAME);
    const links = page.locator(`#work ${PLATE_LINKS}`);
    await expect(links).toHaveCount(CASE_STUDIES);
    for (const link of await links.all()) await expect(link).toBeVisible();
  });
});

test('the moving desktop layout also passes axe, headings in order', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the moving wall is the desktop layout');
  await page.goto('/');
  await page.waitForTimeout(SETTLE_MS);
  await expectNoAxeViolations(page);
});

test('a malformed link hash does not take the home page down', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#%');
  await page.waitForTimeout(SETTLE_MS);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(NAME);
  await expect(page.locator(PLATE_LINKS)).toHaveCount(CASE_STUDIES);
  expect(errors).toEqual([]);
});

test('screen readers reach the approval gates without scrolling to them', async ({ page }) => {
  await page.goto('/');
  const gates = page.locator('#approval .signal-gate-label');
  await expect(gates).toHaveCount(3);
  for (const label of ['Propose', 'Approve', 'Commit']) {
    await expect(page.locator('#approval').getByText(label, { exact: true })).toBeAttached();
  }
  const visibility = await page.locator('#approval .signal-beat').evaluate((beat) => getComputedStyle(beat).visibility);
  expect(visibility).toBe('visible');
});

test('Tab after "View work" lands on the first case study', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the deck plates are links only in the desktop layout');
  await page.goto('/');
  await expect(page.locator('.scene-beat')).toHaveAttribute('data-mode', 'full');
  await page.locator('a[href="#work"]').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(SETTLE_MS);
  await page.keyboard.press('Tab');
  await expect(page.locator('a.scene-plate:focus')).toHaveAttribute('href', /^\/work\/[a-z0-9-]+\/$/);
});

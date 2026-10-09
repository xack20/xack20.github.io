import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './helpers';

const log = (page: Page) => page.locator('[data-lab] [data-log]');
const step = (page: Page, action: string) => page.locator(`[data-lab] button[data-action="${action}"]`).click();

test.describe('the approval lab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lab/');
  });

  test('blocks a commit before approval', async ({ page }) => {
    await step(page, 'propose');
    await step(page, 'commit');
    await expect(log(page)).toContainText("can't approve its own write");
  });

  test('commits once, then rejects the replay', async ({ page }) => {
    await step(page, 'propose');
    await step(page, 'approve');
    await step(page, 'commit');
    await expect(log(page)).toContainText('Committed with tok_');
    await step(page, 'replay');
    await expect(log(page)).toContainText('already used');
  });

  test('rejects a change edited after approval', async ({ page }) => {
    await step(page, 'propose');
    await step(page, 'approve');
    await step(page, 'tamper');
    await step(page, 'commit');
    await expect(log(page)).toContainText('hash mismatch');
  });

  test('reset clears the log', async ({ page }) => {
    await step(page, 'propose');
    await step(page, 'reset');
    await expect(log(page)).not.toContainText('saved as a draft');
    await expect(log(page)).toContainText('reset');
  });

  test('works from the keyboard', async ({ page }) => {
    await page.locator('button[data-action="propose"]').focus();
    await page.keyboard.press('Enter');
    await expect(log(page)).toContainText('saved as a draft');
    await page.keyboard.press('Tab');
    await expect(page.locator('button[data-action="approve"]')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(log(page)).toContainText('Approved by a person');
  });

  test('passes axe', async ({ page }) => {
    await expectNoAxeViolations(page);
  });
});

test.describe('the lab without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('explains the flow and disables the controls', async ({ page }) => {
    await page.goto('/lab/');
    for (const demo of ['[data-lab]', '[data-screens]', '[data-lookup]', '[data-sign]']) {
      await expect(page.locator(`${demo} [data-nojs]`)).toBeVisible();
    }
    await expect(page.locator('button[data-action="propose"]')).toBeDisabled();
  });
});

test.describe('the screen-matcher demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lab/');
  });

  const ask = async (page: Page, text: string) => {
    await page.locator('[data-screens] input').fill(text);
    await page.locator('[data-screens] button[type="submit"]').click();
  };

  test('turns a Banglish question into a screen card', async ({ page }) => {
    await ask(page, 'taka pathabo kivabe');
    await expect(page.locator('[data-screens] [data-result]')).toContainText('Send money');
    await expect(page.locator('[data-screens] .screen-card')).toBeVisible();
  });

  test('never offers Change PIN to someone who forgot their PIN', async ({ page }) => {
    await ask(page, 'pin vule gechi');
    await expect(page.locator('[data-screens] [data-result]')).toContainText('customer support');
    await expect(page.locator('[data-screens] .screen-card')).toHaveCount(0);
  });

  test('shows a weak match without a button', async ({ page }) => {
    await ask(page, 'recharj');
    await expect(page.locator('[data-screens] [data-result]')).toContainText('Mobile recharge');
    await expect(page.locator('[data-screens] .screen-card')).toHaveCount(0);
  });
});

test.describe('the lookup-check demo', () => {
  test('flags only the number no tool returned, and more when a tool is removed', async ({ page }) => {
    await page.goto('/lab/');
    const demo = page.locator('[data-lookup]');
    await expect(demo.locator('mark.unbacked')).toHaveText(['12']);
    await demo.getByLabel(/daily limit/).uncheck();
    await expect(demo.locator('mark.unbacked')).toHaveText(['50,000', '12']);
  });
});

test.describe('the offline-signing demo', () => {
  test('verifies an honest payment and rejects one changed on the way', async ({ page }) => {
    await page.goto('/lab/');
    const demo = page.locator('[data-sign]');
    await demo.locator('button[data-act="key"]').click();
    await expect(demo.locator('[data-fp]')).toHaveText(/[0-9a-f]{4}:/);
    await demo.locator('button[data-act="sign"]').click();
    await demo.locator('button[data-act="send"]').click();
    await expect(demo.locator('[data-log]')).toContainText('Signature valid');
    await demo.getByLabel(/Change the amount/).check();
    await demo.locator('button[data-act="send"]').click();
    await expect(demo.locator('[data-log]')).toContainText('Rejected');
  });
});

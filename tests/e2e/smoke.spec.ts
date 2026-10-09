import { expect, test } from '@playwright/test';

test('the home page responds and names the owner', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Zakaria Hossain Foysal/);
});

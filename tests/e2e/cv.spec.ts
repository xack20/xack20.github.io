import { expect, test } from '@playwright/test';

test('the CV link serves a PDF', async ({ request }) => {
  const response = await request.get('/cv.pdf');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

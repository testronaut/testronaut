import { test, expect } from '@playwright-ct/core';

test('runInBrowser', async ({ page, runInBrowser }) => {
  await runInBrowser(() => {
    document.body.textContent = 'It works!';
  });

  await expect(page.getByText('It works!')).toBeVisible();
});

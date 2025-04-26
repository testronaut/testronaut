import { expect, test } from '@playwright-ct/core';

test.describe('runInBrowser', () => {
  test('anonymous runInBrowser', async ({ page, runInBrowser }) => {
    await runInBrowser(() => {
      document.body.textContent = 'Hi!';
    });

    await expect(page.getByText('Hi!')).toBeVisible();
  });

  test('named runInBrowser', async ({ page, runInBrowser }) => {
    await runInBrowser('bye', () => {
      document.body.textContent = 'Bye!';
    });

    await expect(page.getByText('Bye!')).toBeVisible();
  });
});

import { test, expect } from '@playwright-ct/angular';
import { Hello } from './hello.ng';

test('anonymous mount', async ({ page, mount }) => {
  await mount(Hello);

  await expect(page.getByText('Welcome to Playwright CT')).toBeVisible();
});

test('named runInBrowser', async ({ page, runInBrowser }) => {
  await runInBrowser('bye', () => {
    document.body.textContent = 'Bye!';
  });

  await expect(page.getByText('Bye!')).toBeVisible();
});

import { expect, test } from '@playwright-ct/core';

test.describe('runInBrowser', () => {
  test('anonymous runInBrowser', async ({ page, runInBrowser }) => {
    await runInBrowser(() => {
      document.body.textContent = 'Hi!';
    });

    await expect(page.getByText('Hi!')).toBeVisible();
  });

  test('named runInBrowser', async ({ page, runInBrowser }) => {
    await runInBrowser('hello', () => {
      document.body.textContent = 'Hello!';
    });

    await expect(page.getByText('Hello!')).toBeVisible();
  });

  test('named runInBrowser with args', async ({ page, runInBrowser }) => {
    await runInBrowser('hello foo', { name: 'Foo' }, ({ name }) => {
      document.body.textContent = `Hello ${name}!`;
    });

    await expect(page.getByText('Hello Foo!')).toBeVisible();
  });
});

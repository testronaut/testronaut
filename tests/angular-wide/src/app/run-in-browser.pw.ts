import { expect, test } from '@testronaut/core';

test('anonymous inPage', async ({ page, inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Hi!';
  });

  await expect(page.getByText('Hi!')).toBeVisible();
});

test('named inPage', async ({ page, inPage }) => {
  await inPage('hello', () => {
    document.body.textContent = 'Hello!';
  });

  await expect(page.getByText('Hello!')).toBeVisible();
});

test('named inPage with args', async ({ page, inPage }) => {
  await inPage('hello foo', { name: 'Foo' }, ({ name }) => {
    document.body.textContent = `Hello ${name}!`;
  });

  await expect(page.getByText('Hello Foo!')).toBeVisible();
});

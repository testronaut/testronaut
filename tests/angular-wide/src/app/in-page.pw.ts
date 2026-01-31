import { expect, test } from '@testronaut/core';

test('anonymous inPage', async ({ page, inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Hi!';
  });

  await expect(page.getByText('Hi!')).toBeVisible();
});

test('named inPageWithFunctionName', async ({ page, inPageWithFunctionName }) => {
  await inPageWithFunctionName('hello', () => {
    document.body.textContent = 'Hello!';
  });

  await expect(page.getByText('Hello!')).toBeVisible();
});

test('named inPageWithFunctionName with args', async ({
  page,
  inPageWithFunctionName,
}) => {
  await inPageWithFunctionName('hello foo', { name: 'Foo' }, ({ name }) => {
    document.body.textContent = `Hello ${name}!`;
  });

  await expect(page.getByText('Hello Foo!')).toBeVisible();
});

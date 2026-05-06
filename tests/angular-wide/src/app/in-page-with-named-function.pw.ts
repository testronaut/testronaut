import { test, expect } from '@testronaut/core';

test.describe('general', () => {
  test('named inPageWithNamedFunction', async ({
    page,
    inPageWithNamedFunction,
  }) => {
    await inPageWithNamedFunction('hello', () => {
      document.body.textContent = 'Hello!';
    });

    await expect(page.getByText('Hello!')).toBeVisible();
  });

  test('named inPageWithNamedFunction with args', async ({
    page,
    inPageWithNamedFunction,
  }) => {
    await inPageWithNamedFunction('hello foo', { name: 'Foo' }, ({ name }) => {
      document.body.textContent = `Hello ${name}!`;
    });

    await expect(page.getByText('Hello Foo!')).toBeVisible();
  });
})
import { expect, test } from '@testronaut/core';

test('anonymous inPage', async ({ page, inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Hi!';
  });

  await expect(page.getByText('Hi!')).toBeVisible();
});

<<<<<<< HEAD
test('named inPageWithNamedFunction', async ({
  page,
  inPageWithNamedFunction,
}) => {
=======
test('named inPageWithNamedFunction', async ({ page, inPageWithNamedFunction }) => {
>>>>>>> main
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

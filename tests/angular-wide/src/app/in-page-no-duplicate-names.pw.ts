import { test } from '@testronaut/core';

/* TODO: once we make `inPageWithFunctionName` throw instead,
 * we can `expect(() => inPageWithFunctionName(...)).rejects.toThrow()` instead. */
test.fail('inPageWithFunctionName', async ({ inPageWithFunctionName }) => {
  await inPageWithFunctionName('duplicate name', () => {
    document.body.textContent = 'Hi!';
  });
});

test.fail(
  'another inPageWithFunctionName with the same name',
  async ({ inPageWithFunctionName }) => {
    await inPageWithFunctionName('duplicate name', () => {
      document.body.textContent = 'Bye!';
    });
  }
);

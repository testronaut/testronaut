import { test } from '@testronaut/core';

/* TODO: once we make `inPageWithNamedFunction` throw instead,
 * we can `expect(() => inPageWithNamedFunction(...)).rejects.toThrow()` instead. */
test.fail('inPageWithNamedFunction', async ({ inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('duplicate name', () => {
    document.body.textContent = 'Hi!';
  });
});

test.fail(
  'another inPageWithNamedFunction with the same name',
  async ({ inPageWithNamedFunction }) => {
    await inPageWithNamedFunction('duplicate name', () => {
      document.body.textContent = 'Bye!';
    });
  }
);

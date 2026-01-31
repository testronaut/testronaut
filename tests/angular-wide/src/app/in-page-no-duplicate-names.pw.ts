import { test } from '@testronaut/core';

/* TODO: once we make `inPage` throw instead,
 * we can `expect(() => inPage(...)).rejects.toThrow()` instead. */
test.fail('inPage', async ({ inPage }) => {
  await inPage('duplicate name', () => {
    document.body.textContent = 'Hi!';
  });
});

test.fail(
  'another inPage with the same name',
  async ({ inPage }) => {
    await inPage('duplicate name', () => {
      document.body.textContent = 'Bye!';
    });
  }
);

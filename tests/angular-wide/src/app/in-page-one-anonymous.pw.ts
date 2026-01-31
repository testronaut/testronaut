import { test } from '@testronaut/core';

/* TODO: once we make `inPage` throw instead,
 * we can `expect(() => inPage(...)).rejects.toThrow()` instead. */
test.fail('anonymous inPage', async ({ inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Hi!';
  });
});

test.fail('another anonymous inPage', async ({ inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Bye!';
  });
});

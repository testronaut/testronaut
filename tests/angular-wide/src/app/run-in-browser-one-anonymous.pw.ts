import { test } from '@testronaut/core';

/* TODO: once we make `runInBrowser` throw instead,
 * we can `expect(() => runInBrowser(...)).rejects.toThrow()` instead. */
test('anonymous runInBrowser', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    document.body.textContent = 'Hi!';
  });
});

test('another anonymous runInBrowser', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    document.body.textContent = 'Bye!';
  });
});

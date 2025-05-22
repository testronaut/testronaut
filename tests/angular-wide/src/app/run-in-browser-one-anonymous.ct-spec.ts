import { test } from '@playwright-ct/core';

/* TODO: once we make `runInBrowser` throw instead,
 * we can `expect(() => runInBrowser(...)).rejects.toThrow()` instead. */
test.fail('anonymous runInBrowser', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    document.body.textContent = 'Hi!';
  });
});

test.fail('another anonymous runInBrowser', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    document.body.textContent = 'Bye!';
  });
});

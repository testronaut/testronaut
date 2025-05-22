import { test } from '@playwright-ct/core';

/* TODO: once we make `runInBrowser` throw instead,
 * we can `expect(() => runInBrowser(...)).rejects.toThrow()` instead. */
test.fail('runInBrowser', async ({ runInBrowser }) => {
  await runInBrowser('duplicate name', () => {
    document.body.textContent = 'Hi!';
  });
});

test.fail(
  'another runInBrowser with the same name',
  async ({ runInBrowser }) => {
    await runInBrowser('duplicate name', () => {
      document.body.textContent = 'Bye!';
    });
  }
);

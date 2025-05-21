import { expect, test } from '@playwright-ct/core';

test.fixme('anonymous runInBrowser', async ({ runInBrowser }) => {
  await expect(() =>
    runInBrowser(() => {
      document.body.textContent = 'Hi!';
    })
  ).rejects.toThrow(
    'There can only be one anonymous function to extract per file.'
  );
});

test.fixme('another anonymous runInBrowser', async ({ runInBrowser }) => {
  await expect(() =>
    runInBrowser(() => {
      document.body.textContent = 'Bye!';
    })
  ).rejects.toThrow(
    'There can only be one anonymous function to extract per file.'
  );
});

import { expect, test } from '@testronaut/core';

/* Guards lax hash agreement between the .pw.ts source (analyze + transpile + tokenize
 * during extraction) and `computeHashes(fn.toString(), true)` when resolving anonymous
 * `inPage` at runtime — see packages/core/src/lib/playwright/fixtures.ts. */

test('two anonymous inPage calls in one file use distinct lax keys end-to-end', async ({
  page,
  inPage,
}) => {
  await inPage(() => {
    document.body.textContent = 'LaxHash first marker';
  });
  await expect(page.getByText('LaxHash first marker')).toBeVisible();

  await inPage(() => {
    document.body.textContent = 'LaxHash second marker';
  });
  await expect(page.getByText('LaxHash second marker')).toBeVisible();
});

test('anonymous inPage with block body and local const still matches extraction lax hash', async ({
  page,
  inPage,
}) => {
  await inPage(() => {
    const marker = 'LaxHash block const marker';
    document.body.textContent = marker;
  });
  await expect(page.getByText('LaxHash block const marker')).toBeVisible();
});

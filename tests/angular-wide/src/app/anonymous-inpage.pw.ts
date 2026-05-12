import { expect, test } from '@testronaut/core';

test('two anonymous inPage calls in one file resolve to distinct functions end-to-end', async ({
  page,
  inPage,
}) => {
  await inPage(() => {
    document.body.textContent = 'first marker';
  });
  await expect(page.getByText('first marker')).toBeVisible();

  await inPage(() => {
    document.body.textContent = 'second marker';
  });
  await expect(page.getByText('second marker')).toBeVisible();
});

test('anonymous inPage with block body and local const resolves correctly', async ({
  page,
  inPage,
}) => {
  await inPage(() => {
    const marker = 'block const marker';
    document.body.textContent = marker;
  });
  await expect(page.getByText('block const marker')).toBeVisible();
});

for (const marker of ['alpha', 'beta']) {
  test(`parameterized inPage resolves correctly: ${marker}`, async ({
    page,
    inPage,
  }) => {
    await inPage(() => {
      document.body.textContent = marker;
    });
    await expect(page.getByText(marker)).toBeVisible();
  });
}

import { expect, test } from '@playwright-ct/core';

test('test it', async ({ page }) => {
  await page.waitForFunction(() => {
    // @ts-expect-error property does not exist
    return globalThis['dzvDWHTi'];
  });

  await page.evaluate(async () => {
    // @ts-expect-error property does not exist
    const { extractedFunctionsMap } = await globalThis['dzvDWHTi']();
    await extractedFunctionsMap['']();
  });

  await expect(page.getByText('Hello World!')).toBeVisible();
});

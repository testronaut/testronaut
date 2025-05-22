import { expect, test } from '@playwright-ct/core';

/* Testing the safeguard that makes sure the second worker crashes with an explicit error.
 * We run two tests, skip the first one, and make sure the second one crashes. */
for (let i = 0; i < 2; i++) {
  test(`fail if there is more than one worker ${i}`, async ({
    runInBrowser,
  }, testInfo) => {
    /* It seems that Playwright will always run the first test in the first worker.
     * If this behavior changes, we will have to adapt this condition and make
     * it more dynamic. */
    test.skip(i === 0, 'Skip this test in the first worker');
    console.log(testInfo.parallelIndex);

    await expect(async () => {
      await runInBrowser(() => {
        document.body.textContent =
          'This test fails before because there are two workers!';
      });
    }).rejects.toThrow('`runInBrowser` does not support multiple workers yet.');
  });
}

import {
  expect,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  test as base,
  TestType,
} from '@playwright/test';
import { PlaywrightCtOptions } from './define-config';
import { Runner } from '../runner/runner';

export const test: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & Fixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = base.extend<Fixtures & { ct: PlaywrightCtOptions | null }>({
  ct: [null, { option: true }],

  page: async ({ page }, use) => {
    await page.goto('/');

    await use(page);
  },

  runInBrowser: async ({ ct, page }, use, testInfo) => {
    if (!ct) {
      throw new Error(
        'Playwright CT config is not set up. Please use `defineConfig({ use: { ct: { ... } } })` to set it up.'
      );
    }
    const runner = new Runner({
      projectRoot: ct.projectRoot,
      extractionDir: ct.testServer.extractionDir,
    });

    const { hash } = await runner.extract(testInfo.file);

    const runInBrowserImpl: RunInBrowser = async () => {
      await expect(async () => {
        try {
          await page.waitForFunction(
            // @ts-expect-error no index signature
            ({ hash }) => globalThis[hash],
            { hash },
            {
              timeout: 1_000,
            }
          );
        } catch (error) {
          /* Reload if extractions can't be found. */
          await page.reload();
          throw error;
        }
      }).toPass();

      await page.evaluate(
        async ({ hash }) => {
          // @ts-expect-error no index signature
          const module = await globalThis[hash]();
          return module.extractedFunctionsMap['']();
        },
        { hash }
      );
    };

    await use(runInBrowserImpl);
  },
});

export interface Fixtures {
  runInBrowser: RunInBrowser;
}

export interface RunInBrowser {
  <RETURN_TYPE>(fn: () => RETURN_TYPE | Promise<RETURN_TYPE>): Promise<void>;

  <RETURN_TYPE>(
    name: string,
    fn: () => RETURN_TYPE | Promise<RETURN_TYPE>
  ): Promise<void>;
}

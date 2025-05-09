import { test as base } from '@playwright/test';
import { PageAdapterPlaywright } from '../runner/page-adapter-playwright';
import { Runner } from '../runner/runner';
import { PlaywrightCtOptions } from './options';

const extendedTest = base.extend<Fixtures & { ct: PlaywrightCtOptions | null }>(
  {
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
        pageAdapter: new PageAdapterPlaywright(page),
        projectRoot: ct.projectRoot,
        extractionDir: ct.testServer.extractionDir,
        transforms: ct.transforms,
      });

      const { hash } = await runner.extract(testInfo.file);

      const runInBrowserImpl: RunInBrowser = async (nameOrFunction) => {
        const functionName =
          typeof nameOrFunction === 'string' ? nameOrFunction : '';

        await runner.runInBrowser({
          hash,
          functionName,
        });
      };

      await use(runInBrowserImpl);
    },
  }
);

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

export const test: Omit<typeof extendedTest, 'ct'> = extendedTest;

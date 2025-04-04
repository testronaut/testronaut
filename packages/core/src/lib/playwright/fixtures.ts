import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  test as base,
  TestType,
} from '@playwright/test';
import { Runner } from '../runner/runner';
import { PlaywrightCtOptions } from './options';
import { PageAdapterPlaywright } from '../runner/page-adapter-playwright';

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
      pageAdapter: new PageAdapterPlaywright(page),
      projectRoot: ct.projectRoot,
      extractionDir: ct.testServer.extractionDir,
    });

    const { hash } = await runner.extract(testInfo.file);

    const runInBrowserImpl: RunInBrowser = async () => {
      await runner.runInBrowser({
        hash,
        functionName: '',
      });
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

import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
  TestType,
  test as base,
  PlaywrightWorkerArgs,
} from '@playwright/test';
import { ExtractionPipeline } from '../runner/extraction-pipeline';
import { Runner } from '../runner/runner';

import { PlaywrightCtOptions } from './options';

/**
 * This is the type inferred from `base.extend()` but without the `ct` options.
 * This is needed because we do not want to expose our internal options to the user.
 * Also, `Omit<typeof test, 'ct'>` does not work because `test` is a function
 * and `Omit` also removes the function signature as a side effect.
 */
type PlaywrightCtTestType = TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & Fixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;

export const test: PlaywrightCtTestType = base.extend<
  Fixtures & { ct: PlaywrightCtOptions | null }
>({
  ct: [null, { option: true }],

  /**
   * Users should not care how to navigate a "page". CT takes
   * care of that, as it also manages the test server.
   */
  page: async ({ page }, use) => {
    await page.goto('/');
    page.goto = () => {
      throw new Error(
        'page.goto() is not available. Navigation is managed by CT.'
      );
    };
    await use(page);
  },

  runInBrowser: async ({ ct, page }, use, testInfo) => {
    if (!ct) {
      // TODO: Setup a link with detailed instructions
      throw new Error(
        'No config for Playwright CT. Use `withCt` in `defineConfig` (playwright.config.ts) to set it up.'
      );
    }

    const runner = new Runner(
      new ExtractionPipeline({
        projectRoot: ct.projectRoot,
        extractionDir: ct.extractionDir,
      }),
      page
    );
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

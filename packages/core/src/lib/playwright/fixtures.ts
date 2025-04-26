import { test as base } from '@playwright/test';
import { ExtractionPipeline } from '../runner/extraction-pipeline';
import { Runner } from '../runner/runner';

import { PlaywrightCtOptions } from './options';

const ctTest = base.extend<Fixtures & { ct: PlaywrightCtOptions | null }>({
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

    const runner = new Runner(new ExtractionPipeline(ct), page);
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

export const test = ctTest as Omit<typeof ctTest, 'ct'>;
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

import type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test';
import { test as base } from '@playwright/test';
import { ExtractionPipeline } from '../runner/extraction-pipeline';
import { Runner } from '../runner/runner';

import type { TestronautOptions } from './options';

/**
 * This is the type inferred from `base.extend()` but without the `testronaut` options.
 * This is needed because we do not want to expose our internal options to the user.
 * Also, `Omit<typeof test, 'testronaut'>` does not work because `test` is a function
 * and `Omit` also removes the function signature as a side effect.
 */
type TestronautTestType = TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & Fixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;

export const test: TestronautTestType = base.extend<
  Fixtures & { testronaut: TestronautOptions | null }
>({
  testronaut: [null, { option: true }],

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

  runInBrowser: async ({ testronaut, page }, use, testInfo) => {
    if (!testronaut) {
      // TODO: Setup a link with detailed instructions
      throw new Error(
        'No config for Playwright CT. Use `withTestronaut` in `defineConfig` (playwright.config.ts) to set it up.'
      );
    }

    const runner = new Runner(
      new ExtractionPipeline({
        projectRoot: testronaut.projectRoot,
        extractionDir: testronaut.extractionDir,
        transforms: testronaut.transforms,
      }),
      page
    );
    const { hash } = await runner.extract(testInfo.file);

    const runInBrowserImpl: RunInBrowser = async (...args: unknown[]) => {
      if (testInfo.parallelIndex !== 0) {
        throw new Error(
          '`runInBrowser` does not support multiple workers yet. Please run your tests in a single worker.'
        );
      }

      let functionName = '';
      if (typeof args[0] === 'string') {
        functionName = args[0];
        args.shift();
      }

      let data: Record<string, unknown> = {};
      if (typeof args[0] === 'object') {
        data = args[0] as Record<string, unknown>;
      }

      await runner.runInBrowser({
        hash,
        functionName,
        data,
      });
    };

    await use(runInBrowserImpl);
  },
});

export interface Fixtures {
  runInBrowser: RunInBrowser;
}

export interface RunInBrowser {
  <RETURN>(fn: () => RETURN | Promise<RETURN>): Promise<void>;

  <RETURN>(name: string, fn: () => RETURN | Promise<RETURN>): Promise<void>;

  <DATA extends Record<string, unknown>, RETURN>(
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<void>;

  <DATA extends Record<string, unknown>, RETURN>(
    name: string,
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<void>;
}

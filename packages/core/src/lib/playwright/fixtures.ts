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
 * This avoids transitive dependencies type inference errors such as:
 *
 * error TS2742: The inferred type of 'test' cannot be named without a reference to '.pnpm/playwright@1.52.0/node_modules/playwright/test'.
 * This is likely not portable. A type annotation is necessary.
 */
export type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
};

/**
 * This is the type inferred from `base.extend()` but without the `testronaut` options.
 * This is needed because we do not want to expose our internal options to the user.
 * Also, `Omit<typeof test, 'testronaut'>` does not work because `test` is a function
 * and `Omit` also removes the function signature as a side effect.
 */
export type TestronautTestType = TestType<
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

  inPage: async ({ testronaut, page }, use, testInfo) => {
    if (!testronaut) {
      /* TODO: Setup a link with detailed instructions */
      throw new Error(
        'No config for Playwright CT. Use `withTestronaut` in `defineConfig` (playwright.config.ts) to set it up.'
      );
    }

    const runner = new Runner(
      new ExtractionPipeline({
        projectRoot: testronaut.projectRoot,
        extractionDir: testronaut.extractionDir,
      }),
      page
    );
    const { hash } = await runner.extract(testInfo.file);

    const inPageImpl: InPage = async (...args: unknown[]) => {
      let functionName = '';
      if (typeof args[0] === 'string') {
        functionName = args[0];
        args.shift();
      }

      let data: Record<string, unknown> = {};
      if (typeof args[0] === 'object') {
        data = args[0] as Record<string, unknown>;
      }

      return await runner.inPage({
        hash,
        functionName,
        data,
      });
    };

    await use(inPageImpl);
  },
});

export interface Fixtures {
  inPage: InPage;
}

export interface InPage {
  <RETURN>(fn: () => RETURN | Promise<RETURN>): Promise<RETURN>;

  <RETURN>(name: string, fn: () => RETURN | Promise<RETURN>): Promise<RETURN>;

  <DATA extends Record<string, unknown>, RETURN>(
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<RETURN>;

  <DATA extends Record<string, unknown>, RETURN>(
    name: string,
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<RETURN>;
}

import type {
  Page,
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
   * Users should not care how to navigate a "page". Testronaut takes
   * care of that, as it also manages the test server.
   */
  page: async ({ page }, use) => {
    await page.goto('/');
    page.goto = () => {
      throw new Error(
        'page.goto() is not available. Navigation is managed by Testronaut.'
      );
    };
    await use(page);
  },

  inPageWithNamedFunction: async ({ testronaut, page }, use, testInfo) => {
    const inPageVariant = await createInPageVariant(
      testronaut,
      page,
      testInfo.file,
      'inPageWithNamedFunction'
    );
    await use(inPageVariant);
  },

  inPage: async ({ testronaut, page }, use, testInfo) => {
    const inPageVariant = await createInPageVariant(
      testronaut,
      page,
      testInfo.file,
      'inPage'
    );
    await use(inPageVariant);
  },
});

export interface Fixtures {
  inPage: InPage;
  inPageWithNamedFunction: InPageWithNamedFunction;
}

/**
 * Runs the provided function in the browser context.
 * This is the recommended way to execute code in the browser.
 */
export interface InPage {
  <RETURN>(fn: () => RETURN | Promise<RETURN>): Promise<RETURN>;

  <DATA extends Record<string, unknown>, RETURN>(
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<RETURN>;
}

/**
 * Runs the provided function in the browser context with an explicit function name.
 *
 * **Warning: This should be used as a last resort.**
 *
 * The function name serves as a unique identifier, which is required in rare scenarios
 * where `inPage` calls cannot be found during runtime.
 *
 * In most cases, prefer using \`inPage\` instead.
 */
export interface InPageWithNamedFunction {
  <RETURN>(name: string, fn: () => RETURN | Promise<RETURN>): Promise<RETURN>;

  <DATA extends Record<string, unknown>, RETURN>(
    name: string,
    data: DATA,
    fn: (data: DATA) => RETURN | Promise<RETURN>
  ): Promise<RETURN>;
}

async function createInPageVariant(
  testronaut: TestronautOptions | null,
  page: Page,
  filePath: string,
  variant: 'inPage'
): Promise<InPage>;

async function createInPageVariant(
  testronaut: TestronautOptions | null,
  page: Page,
  filePath: string,
  variant: 'inPageWithNamedFunction'
): Promise<InPageWithNamedFunction>;

/**
 * Creates a generic function which works
 * for both `inPage` and `inPageWithNamedFunction`.
 *
 * The difference is that with `inPageWithNamedFunction` has
 * a first argument which is the function name. The rest is
 * the same as with `inPage`.
 */
async function createInPageVariant(
  testronaut: TestronautOptions | null,
  page: Page,
  filePath: string
): Promise<InPage | InPageWithNamedFunction> {
  if (!testronaut) {
    throw new Error(`
No config for Testronaut. Use \`withTestronaut\` in \`defineConfig\` (playwright-testronaut.config.mts) to set it up.
More information on https://testronaut.dev`);
  }

  const runner = new Runner(
    new ExtractionPipeline({
      projectRoot: testronaut.projectRoot,
      extractionDir: testronaut.extractionDir,
      transforms: testronaut.transforms,
    }),
    page
  );
  const { hash } = await runner.extract(filePath);

  const inPageWithNamedFunctionImpl: InPageWithNamedFunction = async (
    ...args: unknown[]
  ) => {
    let functionName = '';

    if (typeof args[0] === 'string') {
      functionName = args[0];
      args.shift();
    }

    let data: Record<string, unknown> = {};
    if (typeof args[0] === 'object') {
      data = args[0] as Record<string, unknown>;
    }

    return await runner.inPage(hash, functionName, data);
  };

  return inPageWithNamedFunctionImpl;
}

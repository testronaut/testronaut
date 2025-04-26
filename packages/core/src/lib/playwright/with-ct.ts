import { PlaywrightTestConfig } from '@playwright/test';
import { dirname } from 'node:path/posix';
import { ExtractionPipeline } from '../runner/extraction-pipeline';
import { PlaywrightCtConfig } from './playwright-ct-config';

export interface WithCtArgs {
  /**
   * The path to the Playwright config file.
   */
  // INTERNAL: This is needed because Playwright doesn't provide the config path
  // outside fixtures or the global setup, but we init the extraction pipeline
  // as soon as `withCt` is called.
  configPath: string;

  /**
   * The directory where the extracted code will be generated.
   * By default the value is `ct-tests/generated`.
   */
  extractionDir?: string;

  use: PlaywrightTestConfig['use'];
}

/**
 * This function is used to configure Playwright for component testing.
 *
 * It will:
 * - Initialize the `index.ts` in the `extractionDir` directory where the extracted code will be written.
 * - Set up Playwright to match '*.ct-spec.ts' files in `src` folder by default.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@playwright/test';
 * import { withCt } from '@playwright-ct/core';
 *
 * export default defineConfig(
 *  withCt({
 *   configPath: __filename,
 *   use: { // 👈 IMPORTANT: `use` parameters go here
 *   }
 *  }),
 *  {
 *     ... // other Playwright config options
 *  }
 * );
 * ```
 *
 */
export function withCt(
  args: WithCtArgs
): PlaywrightTestConfig & PlaywrightCtConfig {
  const { configPath } = args;
  const projectRoot = dirname(configPath);
  const extractionDir = args.extractionDir ?? 'ct-tests/generated';
  const extractionPipeline = new ExtractionPipeline({
    extractionDir,
    projectRoot,
  });

  /* We have to make sure that `generated/index.ts` is present even if empty
   * before starting the web server, otherwise it would crash.
   * `globalSetup` sounds like the right place, but it runs after the web servers starts
   * Cf. https://github.com/microsoft/playwright/issues/19571#issuecomment-1358368164 */
  extractionPipeline.init();

  return {
    testDir: 'src',
    testMatch: '**/*.ct-spec.ts',
    use: {
      ...args.use,
      ct: {
        extractionDir,
        projectRoot,
      },
    },
  };
}

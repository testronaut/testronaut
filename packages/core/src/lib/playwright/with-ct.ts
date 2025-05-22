import { PlaywrightTestConfig } from '@playwright/test';
import { dirname, join } from 'node:path/posix';
import { ExtractionWriter } from '../extraction-writer/extraction-writer';
import { Options, PlaywrightCtOptions } from './options';
import { spawnSync } from 'node:child_process';

/**
 * This function is used to configure Playwright for component testing.
 *
 * It will:
 * - Initialize the `index.ts` in the `extractionDir` directory where the extracted code will be written.
 * - Set up the web server that serves the extracted code.
 * - Set up Playwright to match '*.ct-spec.ts' files in `src` folder by default.
 *
 * @example
 * ```ts
 * import { defineConfig, withCt } from '@playwright-ct/core';
 *
 * export default defineConfig(
 *  withCt({
 *   configPath: __filename,
 *   testServer: {
 *    command: 'npm run start -- --port {port}',
 *    extractionDir: 'generated',
 *   },
 *  }),
 *  {
 *     ... // other Playwright config options
 *  }
 * );
 * ```
 *
 */
export function withCt({
  configPath,
  extractionDir,
  testServer,
  transforms,
}: WithCtArgs): PlaywrightTestConfig & { use: Options } {
  const isServerRunningCmd = join(__dirname, 'is-server-running.js');
  const projectRoot = dirname(configPath);
  const port = 7358;

  const extractionWriter = new ExtractionWriter({
    extractionDir,
    projectRoot,
  });

  /* HACK: We have to make sure that:
   * - The entrypoint file `generated/index.ts` is present even if empty before
   *   giving Playwright the chance to start the web server, otherwise, the web server
   *   fails, and Playwright doesn't run the tests which generate the entrypoint file
   *   and extracted files.
   * - The entrypoint file is reset at it might indirectly import files that do not exist
   *   anymore. This happens often when the user switches to another git branch for example.
   * - We do not overwrite this file after the server starts as it can cause race conditions.
   *   This happens when running the tests on different browsers. Playwright keeps the same
   *   web server but starts a different worker for each browser.
   *
   * The current workaround is to check if the web server has already started or not.
   *
   * This is temporarily as the right solution is to control the test server ourselves.
   *
   * Note that `globalSetup` sounds like the right place, but it runs after the web servers starts
   * and it can be easily mistakenly overriden by the user.
   * Cf. https://github.com/microsoft/playwright/issues/19571#issuecomment-1358368164 */
  if (spawnSync(isServerRunningCmd, [port.toString()]).status !== 0) {
    extractionWriter.resetEntrypoint();
  }

  return {
    testDir: 'src',
    testMatch: '**/*.ct-spec.ts',
    /* Forcing a single worker as a temporary workaround
     * meanwhile we implement a proper solution to avoid race conditions
     * on generated extractions. */
    workers: 1,
    use: {
      baseURL: `http://localhost:${port}`,
      ct: {
        extractionDir,
        projectRoot,
        testServer,
        transforms,
      },
    },
    webServer: {
      command: testServer.command.replace('{port}', port.toString()),
      port,
    },
  };
}

export interface WithCtArgs extends Omit<PlaywrightCtOptions, 'projectRoot'> {
  /**
   * The path to the Playwright config file.
   */
  // INTERNAL: This is needed because Playwright doesn't provide the config path
  // outside fixtures or the global setup, but we init the extraction pipeline
  // as soon as `withCt` is called.
  configPath: string;
}

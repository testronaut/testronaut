import type { PlaywrightTestConfig } from '@playwright/test';
import { dirname } from 'node:path/posix';
import { ExtractionWriter } from '../extraction-writer/extraction-writer';
import type { FileSystem } from '../infra/file-system';
import type { TestronautOptions } from './options';
import { resolveTestServerPort } from './resolve-test-server-port';

/**
 * This function is used to configure Playwright for component testing.
 *
 * It will:
 * - Initialize the `index.ts` in the `extractionDir` directory where the extracted code will be written.
 * - Set up the web server that serves the extracted code.
 * - Set up Playwright to match '*.pw.ts' files in `src` folder by default.
 *
 * @example
 * ```ts
 * import { defineConfig, withTestronaut } from '@testronaut/core';
 *
 * export default defineConfig(
 *  withTestronaut({
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
export function _internal_withTestronaut({
  configPath,
  extractionDir,
  testServer,
  transforms,
  fileSystem,
}: _internal_WithTestronautParams): PlaywrightTestronautConfig {
  const projectRoot = dirname(configPath);

  const extractionWriter = new ExtractionWriter({
    extractionDir,
    projectRoot,
    fileSystem,
  });

  /* HACK: Concurrent projects or test runs or workers management.
   *
   * We have to make sure that:
   * - Each project has its own test server to avoid that the end of a run or worker
   *   interferes with a concurrent run that ends up withtout a server.
   * - The entrypoint file `generated/index.ts` is present even if empty before
   *   giving Playwright the chance to start the web server, otherwise, the web server
   *   fails, and Playwright doesn't run the tests which generate the entrypoint file
   *   and extracted files.
   * - The entrypoint file is reset at it might indirectly import files that do not exist
   *   anymore. This happens often when the user switches to another git branch for example.
   * - We do not overwrite this file after the server starts as it can cause race conditions
   *   and make the tests fail.
   *   This happens when running the tests on different browsers. Playwright keeps the same
   *   web server but starts a different worker for each browser.
   * - Pick an available port to avoid collisions with other test servers.
   *
   * The current workaround is to check if the test server for this projecthas already started or not.
   *
   * This is temporarily as the right solution is to control the test server ourselves.
   *
   * Note that `globalSetup` sounds like the right place, but it runs after the web servers starts
   * and it can be easily mistakenly overriden by the user.
   * Cf. https://github.com/microsoft/playwright/issues/19571#issuecomment-1358368164 */
  const { port, anotherTestServerMightBeRunning } =
    resolveTestServerPort(projectRoot);
  if (!anotherTestServerMightBeRunning) {
    extractionWriter.resetEntrypoint();
  }

  return {
    testDir: 'src',
    testMatch: '**/*.pw.ts',
    /* Forcing a single worker as a temporary workaround
     * meanwhile we implement a proper solution to avoid race conditions
     * on generated extractions. */
    workers: 1,
    use: {
      baseURL: `http://localhost:${port}`,
      testronaut: {
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

export const withTestronaut: WithTestronaut = _internal_withTestronaut;

export interface WithTestronaut {
  (args: WithTestronautParams): PlaywrightTestronautConfig;
}

export interface WithTestronautParams
  extends Omit<TestronautOptions, 'projectRoot'> {
  /**
   * The path to the Playwright config file.
   */
  // INTERNAL: This is needed because Playwright doesn't provide the config path
  // outside fixtures or the global setup, but we init the extraction pipeline
  // as soon as `withTestronaut` is called.
  configPath: string;
}

export interface _internal_WithTestronautParams extends WithTestronautParams {
  fileSystem?: FileSystem;
}

export type PlaywrightTestronautConfig = PlaywrightTestConfig & {
  use: { testronaut: TestronautOptions };
};

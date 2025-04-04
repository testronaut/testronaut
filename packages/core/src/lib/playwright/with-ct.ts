import { PlaywrightTestConfig } from '@playwright/test';
import { dirname } from 'node:path/posix';
import { ExtractionPipeline } from '../runner/extraction-pipeline';
import { Options, PlaywrightCtOptions } from './options';

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
export function withCt(
  args: WithCtArgs
): PlaywrightTestConfig & { use: Options } {
  const { configPath, ...rest } = args;
  const projectRoot = dirname(configPath);
  const port = 7357;

  /* We have to make sure that `generated/index.ts` is present even if empty
   * before starting the web server, otherwise it would crash.
   * `globalSetup` sounds like the right place, but it runs after the web servers starts
   * Cf. https://github.com/microsoft/playwright/issues/19571#issuecomment-1358368164 */
  const extractionPipeline = new ExtractionPipeline({
    extractionDir: args.testServer.extractionDir,
    projectRoot,
  });

  extractionPipeline.init();

  return {
    testDir: 'src',
    testMatch: '**/*.ct-spec.ts',
    use: {
      baseURL: `http://localhost:${port}`,
      ct: {
        projectRoot,
        ...rest,
      },
    },
    webServer: {
      command: args.testServer.command.replace('{port}', port.toString()),
      port,
    },
  };
}

export interface WithCtArgs extends Omit<PlaywrightCtOptions, 'projectRoot'> {
  /**
   * The path to the Playwright config file.
   */
  configPath: string;
}

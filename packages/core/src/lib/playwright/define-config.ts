import {
  defineConfig as baseDefineConfig,
  PlaywrightTestConfig as BasePlaywrightTestConfig,
} from '@playwright/test';
import { Runner } from '../runner/runner';

export function defineConfig(
  config: PlaywrightTestConfig
): PlaywrightTestConfig;
export function defineConfig<T extends Options>(
  config: PlaywrightTestConfig<T>
): PlaywrightTestConfig<T>;
export function defineConfig<T extends Options, W>(
  config: PlaywrightTestConfig<T, W>
): PlaywrightTestConfig<T, W>;
export function defineConfig(
  config: PlaywrightTestConfig,
  ...configs: PlaywrightTestConfig[]
): PlaywrightTestConfig;
export function defineConfig<T extends Options>(
  config: PlaywrightTestConfig<T>,
  ...configs: PlaywrightTestConfig<T>[]
): PlaywrightTestConfig<T>;
export function defineConfig<T extends Options, W>(
  config: PlaywrightTestConfig<T, W>,
  ...configs: PlaywrightTestConfig<T, W>[]
): PlaywrightTestConfig<T, W> {
  const port = 7357;

  /* We have to make sure that `generated/index.ts` is present even if empty
   * before starting the web server, otherwise it would crash.
   * `globalSetup` sounds like the right place, but it runs after the web servers starts
   * Cf. https://github.com/microsoft/playwright/issues/19571#issuecomment-1358368164 */
  const runner = new Runner({
    extractionDir: config.use.ct.testServer.extractionDir,
    projectRoot: config.use.ct.projectRoot,
  });
  runner.init();

  return baseDefineConfig(
    {
      ...config,
      testDir: 'src',
      testMatch: '**/*.ct-spec.ts',
      webServer: {
        command: config.use.ct.testServer.command.replace(
          '{port}',
          port.toString()
        ),
        port,
      },
    },
    ...configs
  ) as PlaywrightTestConfig<T, W>;
}

export type PlaywrightTestConfig<
  T extends Options = Options,
  W = Record<string, unknown>
> = Omit<BasePlaywrightTestConfig<T, W>, 'use'> & {
  use: Options & BasePlaywrightTestConfig<T, W>['use'];
};

export interface Options {
  ct: PlaywrightCtOptions;
}

export interface PlaywrightCtOptions {
  /**
   * This is generally the folder containing the `playwright.config.ts` file.
   * It is used:
   * - to compute the relative paths of the generated files,
   * - as the base directory used to compute the absolute paths for various configurations, such as `extractionDir`.
   */
  projectRoot: string;

  /**
   * Options to configure and run the test server.
   */
  testServer: {
    /**
     * The directory where the extracted code will be generated.
     */
    extractionDir: string;

    /**
     * The command to start the test server.
     */
    command: string;
  };
}

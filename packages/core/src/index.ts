import {
  PlaywrightTestConfig as BasePlaywrightTestConfig,
  defineConfig as baseDefineConfig,
} from '@playwright/test';
export { devices, expect, test } from '@playwright/test';

export interface PlaywrightCtOptions {
  /**
   * Options to configure and run the test server.
   */
  testServer: {
    /**
     * The directory where the extracted code will be generated.
     */
    generatedDir: string;

    /**
     * The command to start the test server.
     */
    command: string;
  };
}

export interface Options {
  ct: PlaywrightCtOptions;
}

export type PlaywrightTestConfig<
  T extends Options = Options,
  W = Record<string, unknown>
> = Omit<BasePlaywrightTestConfig<T, W>, 'use'> & {
  use: Options & BasePlaywrightTestConfig<T, W>['use'];
};

export function defineConfig(
  config: PlaywrightTestConfig<Options>
): PlaywrightTestConfig<Options>;
export function defineConfig<T extends Options>(
  config: PlaywrightTestConfig<T>
): PlaywrightTestConfig<T>;
export function defineConfig<T extends Options, W>(
  config: PlaywrightTestConfig<T, W>
): PlaywrightTestConfig<T, W>;
export function defineConfig(
  config: PlaywrightTestConfig<Options>,
  ...configs: PlaywrightTestConfig<Options>[]
): PlaywrightTestConfig<Options>;
export function defineConfig<T extends Options>(
  config: PlaywrightTestConfig<T>,
  ...configs: PlaywrightTestConfig<T>[]
): PlaywrightTestConfig<T>;
export function defineConfig<T extends Options, W>(
  config: PlaywrightTestConfig<T, W>,
  ...configs: PlaywrightTestConfig<T, W>[]
): PlaywrightTestConfig<T, W> {
  return baseDefineConfig(
    {
      ...config,
      testDir: 'src',
      testMatch: '**/*.ct-spec.ts',
      webServer: {
        command: config.use.ct.testServer.command.replace('{port}', '4300'),
        port: 4300,
      },
    },
    ...configs
  ) as PlaywrightTestConfig<T, W>;
}

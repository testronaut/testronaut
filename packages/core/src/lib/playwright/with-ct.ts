import { PlaywrightTestConfig } from '@playwright/test';
import { dirname } from 'node:path/posix';
import { Runner } from '../runner/runner';
import { Options, PlaywrightCtOptions } from './options';

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
  const runner = new Runner({
    extractionDir: args.testServer.extractionDir,
    projectRoot,
  });

  runner.init();

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

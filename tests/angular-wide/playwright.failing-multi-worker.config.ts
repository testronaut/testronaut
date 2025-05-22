import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices, withCt } from '@playwright-ct/core';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  nxE2EPreset(__filename),
  withCt({
    configPath: __filename,
    extractionDir: 'ct-tests/generated',
    testServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration ct --port {port} --live-reload false',
    },
  }),
  {
    use: {
      trace: 'on-first-retry',
    },
    /* Override workers count ot make `runInBrowser` fail on 2nd worker. */
    workers: 2,
    projects: [
      {
        name: 'failing-multi-worker',
        use: { ...devices['Desktop Chrome'] },
        fullyParallel: true,
        testMatch: '**/*.failing-multi-worker-ct-spec.ts',
      },
    ],
  }
);

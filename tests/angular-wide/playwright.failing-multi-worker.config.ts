import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices, withTestronaut } from '@testronaut/core';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  nxE2EPreset(__filename),
  withTestronaut({
    configPath: __filename,
    extractionDir: 'testronaut/generated',
    testServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration testronaut --port {port} --live-reload false',
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
        testMatch: '**/*.failing-multi-worker-pw.ts',
      },
    ],
  }
);

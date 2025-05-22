import { nxE2EPreset } from '@nx/playwright/preset';
import { withTestronaut } from '@testronaut/core';
import { defineConfig, devices } from '@playwright/test';

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
  withTestronaut({
    configPath: __filename,
    extractionDir: 'test-server/generated',
    testServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration testronaut --port {port} --live-reload false',
    },
  }),
  {
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
      /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
      trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    webServer: {
      command:
        'pnpm exec nx serve demos-angular --configuration testronaut --port 7357 --live-reload false',
      reuseExistingServer: !process.env['CI'],
    },
  }
);

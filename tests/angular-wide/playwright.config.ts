import { nxE2EPreset } from '@nx/playwright/preset';
import { withCt } from '@playwright-ct/core';
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
  withCt({
    configPath: __filename,
    use: {
      baseURL: 'http://localhost:4201',
    },
  }),
  {
    /* Configure projects for major browsers */
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],

    webServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration ct --port 4201 --live-reload false',
      reuseExistingServer: true,
    },
  }
);

import { nxE2EPreset } from '@nx/playwright/preset';
import { withAngularCt } from '@playwright-ct/angular';
import { defineConfig, devices } from '@playwright-ct/core';
import { fileURLToPath } from 'node:url';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

const __filename = fileURLToPath(import.meta.url);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  nxE2EPreset(__filename),
  withAngularCt({ configPath: __filename }),
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
  }
);

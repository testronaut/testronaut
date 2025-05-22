import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices, withCtAngular } from '@testronaut/angular';
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
  withCtAngular({
    configPath: __filename,
    extractionDir: 'test-server/generated',
    testServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration ct --port {port} --live-reload false',
    },
  }),
  {
    timeout: 3_000,
    use: {
      trace: 'on-first-retry',
    },
  },
  {
    /* Configure projects for major browsers */
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
  }
);

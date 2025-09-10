import { nxE2EPreset } from '@nx/playwright/preset';
import {
  defineConfig,
  devices,
  withTestronautAngular,
} from '@testronaut/angular';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  nxE2EPreset(__filename),
  withTestronautAngular({
    configPath: __filename,
    testServer: {
      command:
        'pnpm exec nx serve angular-wide --configuration testronaut --port {port} --live-reload false',
    },
  }),
  {
    timeout: process.env['CI'] ? 10_000 : 3_000,
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

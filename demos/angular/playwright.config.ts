import { nxE2EPreset } from '@nx/playwright/preset';
import { withTestronautAngular } from '@testronaut/angular';
import { defineConfig, devices } from '@playwright/test';
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
        'pnpm nx serve demos-angular --configuration testronaut --port {port} --live-reload false',
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
  }
);

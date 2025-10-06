import { defineConfig, devices } from '@playwright/test';
import { withTestronautAngular } from '@testronaut/angular';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config = defineConfig(
  withTestronautAngular({
    configPath: __filename,
    testServer: {
      command:
        'pnpm ng serve --configuration testronaut --port {port} --live-reload false',
    },
  }),
  {
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
  }
);

export default config;

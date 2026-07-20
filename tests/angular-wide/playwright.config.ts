import { nxE2EPreset } from '@nx/playwright/preset';
import {
  defineConfig,
  devices,
  withTestronautAngular,
} from '@testronaut/angular';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const isCI = process.env['CI'];
const isWindows = process.platform === 'win32';

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
    timeout: isCI ? 10_000 : 3_000,
    use: {
      trace: 'on-first-retry',
    },
    /* Maybe reduce flakiness on Windows CI.
     * Error example: 1 error was not a part of any test, see above for details
     * https://github.com/testronaut/testronaut/actions/runs/28581437508/job/84742463215 */
    workers: isCI && isWindows ? 1 : undefined,
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

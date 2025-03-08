import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

type PlaywrightTestConfigWithCt = PlaywrightTestConfig & {
  ct: {
    webServerCommand: 'ng playwright-ct';
    testServerAppDir: string;
  };
};

/**
 * Generates a configuration for Playwright which includes
 * additional options for component testing.
 */
export function defineConfigWithCt() {
  return defineConfig();
}

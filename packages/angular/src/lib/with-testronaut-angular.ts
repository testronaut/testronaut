import { withTestronaut, type WithTestronautParams } from '@testronaut/core';
import { angularTransform } from './angular-transform';

/**
 * From Playwright's perspective, CT is just like any other
 * E2E test which uses a special set of fixtures. All the
 * integration, processes, etc. should work as for any other
 * E2E test. So the integration needs to be seamless. We
 * don't and cannot deviate from Playwright's "way".
 *
 * That means using a separate configuration is out of question,
 * since all the tooling should seamlessly be able to run CT.
 *
 * That's why we provide this function that helps configure Playwright
 * specifically for CT while still allowing the user to still use usual
 * Playwright configuration.
 *
 * @example
 *
 * ```ts
 * export default defineConfig(
 *   withTestronautAngular({
 *     configPath: __filename,
 *     extractionDir: 'testronaut/generated',
 *     testServer: {
 *       command:
 *         'pnpm exec nx serve',
 *     },
 *   }),
 *   {
 *     use: {
 *       trace: 'on-first-retry',
 *       ...
 *     },
 *     projects: [...],
 *     ...
 *   },
 * );
 * ```
 */
export function withTestronautAngular(config: WithTestronautAngularParams) {
  return withTestronaut({
    ...config,
    transforms: [...(config.transforms ?? []), angularTransform],
  });
}

/**
 * @todo make `testServer` optional as for Angular, we can detect the command for CLI & NX.
 */
export type WithTestronautAngularParams = WithTestronautParams;

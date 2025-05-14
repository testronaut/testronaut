export type CtAngularConfig = {
  webServerCommand: 'ng playwright-ct';
  testServerAppDir: string;
};

/**
 * From Playwright's perspective, CT is just like any other
 * E2E test which uses a special set of fixtures. All the
 * integration, processes, etc. should work as for any other
 * E2E test. So the integration needs to be seamlessly. We
 * don't and cannot deviate from Playwright's "way".
 *
 * That means using a separate configuration is out of question,
 * since all the tooling should seemlessly be able to run CT.
 * It also doesn't make sense to provide a wrapper for `defineConfig`
 * because we don't want that changes in Playwright break CT or
 * make CT incompatible.
 *
 * That's why Playwright CT is integrated as own `projects`. This
 * allows users to use the existing E2E config and override, change
 * only those settings, which they want.
 */
export function addCtProjects(config: Partial<CtAngularConfig>) {
  return {
    ct: {
      webServerCommand: 'ng playwright-ct',
      testServerAppDir: 'playwright-ct-tests',
      ...config,
    },
  };
}

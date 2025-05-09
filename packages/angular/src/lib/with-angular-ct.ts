import { dirname, join } from 'node:path/posix';
import { CtConfig, withCt } from '@playwright-ct/core';
import { readFileSync } from 'node:fs';

export interface CtAngularConfig {
  configPath: string;
}

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
export function withAngularCt({ configPath }: CtAngularConfig) {
  // SPIKE: users could provide the testServer config otherwise, we can
  // try to detect it from the configPath.
  const testServer = detectTestServerConfig(configPath);

  return withCt({
    configPath,
    testServer,
  });
}

function detectTestServerConfig(configPath: string): CtConfig['testServer'] {
  // SPIKE: assuming the Nx project.json is always there
  const nxProjectJson = readFileSync(
    join(dirname(configPath), 'project.json'),
    'utf-8'
  );
  const nxProjectConfig = JSON.parse(nxProjectJson);
  const nxProjectName = nxProjectConfig.name;
  return {
    extractionDir: 'ct-tests/generated',
    command: `nx serve ${nxProjectName} --configuration ct --port {port} --live-reload false`,
  };
}

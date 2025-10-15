import { describe, expect, it } from 'vitest';
import { FileSystemFake } from '../infra/file-system.fake';
import {
  _internal_withTestronaut,
  withTestronaut,
  WithTestronautParams,
} from './with-testronaut';

describe(withTestronaut.name, () => {
  /**
   * This is a temporary workaround meanwhile we implement a proper solution.
   */
  it('sets max workers to 1 to avoid race conditions between workers', () => {
    const config = withTestingTestronaut({
      configPath: 'playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
    });

    expect(config.workers).toBe(1);
  });

  it('set reuseExistingServer to true to allow mutilple runners to share the same test server instead of just failing', () => {
    const config = withTestingTestronaut({
      configPath: 'playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
    });

    expect(config.webServer).toMatchObject({
      reuseExistingServer: true,
    });
  });
});

const withTestingTestronaut = (config: WithTestronautParams) => {
  return _internal_withTestronaut({
    ...config,
    /* Use fake here to avoid polluting the filesystem.
     * This would create a `generated` folder at the root of the workspace:
     * Don't ask me how I know. 😅 */
    fileSystem: new FileSystemFake(),
  });
};

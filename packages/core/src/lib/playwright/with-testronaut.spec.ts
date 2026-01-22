import { describe, expect, it } from 'vitest';
import { FileSystemFake } from '../infra/file-system.fake';
import {
  _internal_withTestronaut,
  PlaywrightTestronautConfig,
  withTestronaut,
  WithTestronautParams,
} from './with-testronaut';

describe(withTestronaut.name, () => {
  it('set reuseExistingServer to true to allow mutilple runners to share the same test server instead of just failing', () => {
    const config = withTestingTestronaut({
      configPath: '/my-project/playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
    });

    expect(config.webServer).toMatchObject({
      reuseExistingServer: true,
    });
  });

  it('initializes generated/index.ts file', () => {
    const { fileSystemFake, withTestronaut } = setUpWithTestronaut();

    withTestronaut({
      configPath: '/my-project/playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
    });

    expect(
      fileSystemFake.getFiles()['/my-project/generated/index.ts'].length
    ).toBeGreaterThan(0);
  });
});

function setUpWithTestronaut() {
  const fileSystemFake = new FileSystemFake();

  return {
    fileSystemFake,
    withTestronaut: (config: WithTestronautParams) =>
      withTestingTestronaut(config, fileSystemFake),
  };
}

function withTestingTestronaut(
  config: WithTestronautParams,
  fileSystem?: FileSystemFake
): PlaywrightTestronautConfig {
  return _internal_withTestronaut({
    ...config,
    /* Use fake here to avoid polluting the filesystem.
     * This would create a `generated` folder at the root of the workspace:
     * Don't ask me how I know. 😅 */
    fileSystem: fileSystem ?? new FileSystemFake(),
  });
}

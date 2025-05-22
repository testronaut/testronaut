import { FileSystemFake } from '../infra/file-system.fake';
import { _internal_withTestronaut, withTestronaut } from './with-testronaut';
import { describe, it, expect } from 'vitest';

describe(withTestronaut.name, () => {
  /**
   * This is a temporary workaround meanwhile we implement a proper solution.
   */
  it('sets max workers to 1 to avoid race conditions between workers', () => {
    const config = _internal_withTestronaut({
      configPath: 'playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
      /* Use fake here to avoid polluting the filesystem.
       * This would create a `generated` folder at the root of the workspace:
       * Don't ask me how I know. 😅 */
      fileSystem: new FileSystemFake(),
    });

    expect(config.workers).toBe(1);
  });
});

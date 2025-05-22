import { withCt } from './with-ct';
import { describe } from 'vitest';

describe(withCt.name, () => {
  /**
   * This is a temporary workaround meanwhile we implement a proper solution.
   */
  it('sets max workers to 1 to avoid race conditions between workers', () => {
    const config = withCt({
      configPath: 'playwright.config.ts',
      extractionDir: 'generated',
      testServer: {
        command: 'npm run start -- --port {port}',
      },
    });

    expect(config.workers).toBe(1);
  });
});

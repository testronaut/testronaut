import type { Transform } from '../analyzer/transform';

export interface Options {
  ct: TestronautOptions;
}

export interface TestronautOptions {
  /**
   * This is generally the folder containing the `playwright.config.ts` file.
   * It is used:
   * - to compute the relative paths of the generated files,
   * - as the base directory used to compute the absolute paths for various configurations, such as `extractionDir`.
   */
  projectRoot: string;

  /**
   * The directory where the extracted code will be generated.
   */
  extractionDir: string;

  /**
   * Options to configure and run the test server.
   */
  testServer: {
    /**
     * The command to start the test server.
     */
    command: string;
  };

  /**
   * List of transforms to apply to files before extraction.
   * This is used by framework plugins to transform fixtures
   * such as `mount()` to `runInBrowser()`.
   */
  transforms?: Transform[];
}

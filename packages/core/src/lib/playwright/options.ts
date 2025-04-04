export interface Options {
  ct: PlaywrightCtOptions;
}

export interface PlaywrightCtOptions {
  /**
   * This is generally the folder containing the `playwright.config.ts` file.
   * It is used:
   * - to compute the relative paths of the generated files,
   * - as the base directory used to compute the absolute paths for various configurations, such as `extractionDir`.
   */
  projectRoot: string;

  /**
   * Options to configure and run the test server.
   */
  testServer: {
    /**
     * The directory where the extracted code will be generated.
     */
    extractionDir: string;

    /**
     * The command to start the test server.
     */
    command: string;
  };
}

export interface TestronautConfig {
  extractionDir: string;
  projectRoot: string;
}

/**
 * This is the additional configuration type that
 * is added by `{@link withTestronaut}` to the Playwright config.
 */
export interface TestronautPlaywrightConfig {
  use: { testronaut: TestronautConfig };
}

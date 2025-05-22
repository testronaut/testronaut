export interface CtConfig {
  extractionDir: string;
  projectRoot: string;
}

/**
 * This is the additional configuration type which
 * is added by `{@link withCt}` to the Playwright config.
 */
export interface TestronautConfig {
  use: { ct: CtConfig };
}

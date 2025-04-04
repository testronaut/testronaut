export interface ExtractionConfig {
  /**
   * The root directory of the project.
   * Mainly used to compute the relative path of the parsed files.
   */
  projectRoot: string;

  /**
   * The path to the directory where the extracted files will be saved.
   */
  extractionDir: string;
}

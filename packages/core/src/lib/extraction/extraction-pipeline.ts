import { ExtractionConfig } from './extraction-config';
import { ExtractionWriter } from './extraction-writer';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;

  constructor(config: ExtractionConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
  }

  init() {
    this.#extractionWriter.init();
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async extract(filePath: string) {
    throw new Error('🚧 work in progress');
  }
}

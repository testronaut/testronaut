import { ExtractionPipeline } from './extraction-pipeline';
import { RunnerConfig } from './runner-config';

export class Runner {
  #extractionPipeline: ExtractionPipeline;

  constructor(config: RunnerConfig) {
    this.#extractionPipeline = new ExtractionPipeline(config);
  }

  init() {
    this.#extractionPipeline.init();
  }

  async extract(filePath: string) {
    return this.#extractionPipeline.extract(filePath);
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async runInBrowser() {
    throw new Error('🚧 work in progress');
  }
}

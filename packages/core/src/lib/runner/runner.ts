import { ExtractionPipeline } from '../extraction/extraction-pipeline';
import { RunnerConfig } from './runner-config';

export class Runner {
  #extractionPipeline: ExtractionPipeline;

  constructor(config: RunnerConfig) {
    this.#extractionPipeline = new ExtractionPipeline(config);
  }

  init() {
    this.#extractionPipeline.init();
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async extract(filePath: string) {
    throw new Error('🚧 work in progress');
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async runInBrowser() {
    throw new Error('🚧 work in progress');
  }
}
